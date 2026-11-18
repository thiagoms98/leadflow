import { NextRequest, NextResponse } from 'next/server';
import {
  createSupabaseServerClient,
  translateSupabaseError,
} from '@/lib/supabase-server';
import type {
  Lead,
  LeadOrigin,
  LeadPriority,
  PipelineStage,
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

function extractBearer(req: NextRequest): string | null {
  const auth = req.headers.get('authorization');
  if (!auth || !auth.startsWith('Bearer ')) return null;
  return auth.slice(7).trim();
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

    const data = (await req.json()) as Omit<
      Lead,
      'id' | 'createdAt' | 'updatedAt'
    >;
    const today = new Date().toISOString().slice(0, 10);

    const { data: inserted, error } = await supabase
      .from('leads')
      .insert({
        user_id: user.id,
        name: data.name,
        role: data.role,
        company: data.company,
        email: data.email,
        phone: data.phone,
        city: data.city,
        segment: data.segment,
        origin: data.origin,
        stage: data.stage,
        priority: data.priority,
        value: data.value,
        probability: data.probability,
        owner_id: data.ownerId,
        next_action: data.nextAction,
        next_action_date: data.nextActionDate,
        notes: data.notes,
        created_at: today,
        updated_at: today,
      })
      .select('*')
      .single();

    if (error || !inserted) {
      return NextResponse.json(
        {
          error: translateSupabaseError(
            error?.message ?? 'Erro ao cadastrar lead.'
          ),
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ lead: mapRowToLead(inserted as LeadRow) });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro ao criar lead.';
    return NextResponse.json(
      { error: translateSupabaseError(msg) },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const token = extractBearer(req);
  if (!token) {
    return NextResponse.json({ error: 'Token ausente.' }, { status: 401 });
  }

  try {
    const supabase = createSupabaseServerClient(token);
    const body = (await req.json()) as {
      id: string;
      patch: Partial<Omit<Lead, 'id' | 'createdAt'>>;
    };

    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString().slice(0, 10),
    };
    const { patch } = body;
    if (patch.name !== undefined) payload.name = patch.name;
    if (patch.role !== undefined) payload.role = patch.role;
    if (patch.company !== undefined) payload.company = patch.company;
    if (patch.email !== undefined) payload.email = patch.email;
    if (patch.phone !== undefined) payload.phone = patch.phone;
    if (patch.city !== undefined) payload.city = patch.city;
    if (patch.segment !== undefined) payload.segment = patch.segment;
    if (patch.origin !== undefined) payload.origin = patch.origin;
    if (patch.stage !== undefined) payload.stage = patch.stage;
    if (patch.priority !== undefined) payload.priority = patch.priority;
    if (patch.value !== undefined) payload.value = patch.value;
    if (patch.probability !== undefined) payload.probability = patch.probability;
    if (patch.ownerId !== undefined) payload.owner_id = patch.ownerId;
    if (patch.nextAction !== undefined) payload.next_action = patch.nextAction;
    if (patch.nextActionDate !== undefined)
      payload.next_action_date = patch.nextActionDate;
    if (patch.notes !== undefined) payload.notes = patch.notes;

    const { data: updated, error } = await supabase
      .from('leads')
      .update(payload)
      .eq('id', body.id)
      .select('*')
      .single();

    if (error || !updated) {
      return NextResponse.json(
        {
          error: translateSupabaseError(
            error?.message ?? 'Erro ao atualizar lead.'
          ),
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ lead: mapRowToLead(updated as LeadRow) });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro ao atualizar lead.';
    return NextResponse.json(
      { error: translateSupabaseError(msg) },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const token = extractBearer(req);
  if (!token) {
    return NextResponse.json({ error: 'Token ausente.' }, { status: 401 });
  }

  try {
    const supabase = createSupabaseServerClient(token);
    const { id } = (await req.json()) as { id: string };
    const { error } = await supabase.from('leads').delete().eq('id', id);

    if (error) {
      return NextResponse.json(
        { error: translateSupabaseError(error.message) },
        { status: 400 }
      );
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro ao excluir lead.';
    return NextResponse.json(
      { error: translateSupabaseError(msg) },
      { status: 500 }
    );
  }
}
