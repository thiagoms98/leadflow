import { NextRequest, NextResponse } from 'next/server';
import {
  createSupabaseServerClient,
  translateSupabaseError,
} from '@/lib/supabase-server';
import type { ActivityType, LeadActivity } from '@/lib/leadflow-data';

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

    const activity = (await req.json()) as Omit<
      LeadActivity,
      'id' | 'completed'
    >;

    const { data: inserted, error } = await supabase
      .from('lead_activities')
      .insert({
        user_id: user.id,
        lead_id: activity.leadId,
        type: activity.type,
        title: activity.title,
        description: activity.description,
        due_date: activity.dueDate,
        due_time: activity.dueTime,
        owner_id: activity.ownerId,
        completed: false,
      })
      .select('*')
      .single();

    if (error || !inserted) {
      return NextResponse.json(
        {
          error: translateSupabaseError(
            error?.message ?? 'Erro ao criar atividade.'
          ),
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      activity: mapRowToActivity(inserted as ActivityRow),
    });
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : 'Erro ao registrar atividade.';
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
    const { id, completed } = (await req.json()) as {
      id: string;
      completed: boolean;
    };

    const { error } = await supabase
      .from('lead_activities')
      .update({ completed })
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        { error: translateSupabaseError(error.message) },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : 'Erro ao atualizar atividade.';
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
    const { error } = await supabase
      .from('lead_activities')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        { error: translateSupabaseError(error.message) },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : 'Erro ao excluir atividade.';
    return NextResponse.json(
      { error: translateSupabaseError(msg) },
      { status: 500 }
    );
  }
}
