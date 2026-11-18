import { NextRequest, NextResponse } from 'next/server';
import {
  createSupabaseServerClient,
  translateSupabaseError,
} from '@/lib/supabase-server';
import {
  INITIAL_LEADS,
  INITIAL_ACTIVITIES,
  type Lead,
  type LeadActivity,
  type LeadOrigin,
  type LeadPriority,
  type PipelineStage,
  type ActivityType,
} from '@/lib/leadflow-data';

interface LeadRow {
  id: string;
  user_id: string;
  name: string;
  role: string;
  company: string;
  email: string;
  phone: string;
  city: string;
  segment: string;
  origin: string;
  stage: string;
  priority: string;
  value: number | string;
  probability: number;
  owner_id: string;
  next_action: string;
  next_action_date: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

interface ActivityRow {
  id: string;
  user_id: string;
  lead_id: string;
  type: string;
  title: string;
  description: string;
  due_date: string;
  due_time: string;
  owner_id: string;
  completed: boolean;
}

function mapRowToLead(row: LeadRow): Lead {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    company: row.company,
    email: row.email,
    phone: row.phone,
    city: row.city,
    segment: row.segment,
    origin: row.origin as LeadOrigin,
    stage: row.stage as PipelineStage,
    priority: row.priority as LeadPriority,
    value: Number(row.value) || 0,
    probability: Number(row.probability) || 0,
    ownerId: row.owner_id,
    nextAction: row.next_action,
    nextActionDate: row.next_action_date,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapRowToActivity(row: ActivityRow): LeadActivity {
  return {
    id: row.id,
    leadId: row.lead_id,
    type: row.type as ActivityType,
    title: row.title,
    description: row.description,
    dueDate: row.due_date,
    dueTime: row.due_time,
    ownerId: row.owner_id,
    completed: Boolean(row.completed),
  };
}

function extractBearer(req: NextRequest): string | null {
  const auth = req.headers.get('authorization');
  if (!auth || !auth.startsWith('Bearer ')) return null;
  return auth.slice(7).trim();
}

export async function GET(req: NextRequest) {
  const token = extractBearer(req);
  if (!token) {
    return NextResponse.json({ error: 'Token ausente.' }, { status: 401 });
  }

  try {
    const supabase = createSupabaseServerClient(token);
    const [leadsRes, actsRes] = await Promise.all([
      supabase
        .from('leads')
        .select('*')
        .order('updated_at', { ascending: false }),
      supabase
        .from('lead_activities')
        .select('*')
        .order('due_date', { ascending: true }),
    ]);

    if (leadsRes.error) {
      return NextResponse.json(
        { error: translateSupabaseError(leadsRes.error.message) },
        { status: 400 }
      );
    }
    if (actsRes.error) {
      return NextResponse.json(
        { error: translateSupabaseError(actsRes.error.message) },
        { status: 400 }
      );
    }

    return NextResponse.json({
      leads: ((leadsRes.data ?? []) as LeadRow[]).map(mapRowToLead),
      activities: ((actsRes.data ?? []) as ActivityRow[]).map(mapRowToActivity),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro ao carregar dados.';
    return NextResponse.json(
      { error: translateSupabaseError(msg) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const token = extractBearer(req);
  if (!token) {
    return NextResponse.json({ error: 'Token ausente.' }, { status: 401 });
  }

  try {
    const supabase = createSupabaseServerClient(token);
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser(token);

    if (userErr || !user) {
      return NextResponse.json(
        { error: translateSupabaseError(userErr?.message ?? 'Sessão inválida') },
        { status: 401 }
      );
    }

    await supabase.from('lead_activities').delete().eq('user_id', user.id);
    await supabase.from('leads').delete().eq('user_id', user.id);

    const leadIdMap = new Map<string, string>();
    const insertedLeads: Lead[] = [];

    for (const seed of INITIAL_LEADS) {
      const { data, error } = await supabase
        .from('leads')
        .insert({
          user_id: user.id,
          name: seed.name,
          role: seed.role,
          company: seed.company,
          email: seed.email,
          phone: seed.phone,
          city: seed.city,
          segment: seed.segment,
          origin: seed.origin,
          stage: seed.stage,
          priority: seed.priority,
          value: seed.value,
          probability: seed.probability,
          owner_id: seed.ownerId,
          next_action: seed.nextAction,
          next_action_date: seed.nextActionDate,
          notes: seed.notes,
          created_at: seed.createdAt,
          updated_at: seed.updatedAt,
        })
        .select('*')
        .single();

      if (error || !data) {
        return NextResponse.json(
          {
            error: translateSupabaseError(
              error?.message ?? 'Erro ao inserir dados iniciais.'
            ),
          },
          { status: 400 }
        );
      }

      const mapped = mapRowToLead(data as LeadRow);
      leadIdMap.set(seed.id, mapped.id);
      insertedLeads.push(mapped);
    }

    const activityPayloads = INITIAL_ACTIVITIES.flatMap((act) => {
      const mappedLeadId = leadIdMap.get(act.leadId);
      if (!mappedLeadId) return [];
      return [
        {
          user_id: user.id,
          lead_id: mappedLeadId,
          type: act.type,
          title: act.title,
          description: act.description,
          due_date: act.dueDate,
          due_time: act.dueTime,
          owner_id: act.ownerId,
          completed: act.completed,
        },
      ];
    });

    let insertedActivities: LeadActivity[] = [];
    if (activityPayloads.length > 0) {
      const { data: actsData, error: actsErr } = await supabase
        .from('lead_activities')
        .insert(activityPayloads)
        .select('*');

      if (actsErr) {
        return NextResponse.json(
          { error: translateSupabaseError(actsErr.message) },
          { status: 400 }
        );
      }
      insertedActivities = ((actsData ?? []) as ActivityRow[]).map(
        mapRowToActivity
      );
    }

    return NextResponse.json({
      leads: insertedLeads,
      activities: insertedActivities,
    });
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : 'Erro ao popular Supabase.';
    return NextResponse.json(
      { error: translateSupabaseError(msg) },
      { status: 500 }
    );
  }
}
