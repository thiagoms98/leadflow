import { getSessionSnapshot, refreshSupabaseSession } from './leadflow-auth';
import type { Lead, LeadActivity } from './leadflow-data';

async function fetchWithSupabaseAuth(
  url: string,
  init: RequestInit = {}
): Promise<Response> {
  const session = getSessionSnapshot();
  const token = session?.accessToken;
  if (!token) {
    throw new Error('Sessão Supabase ausente.');
  }

  const doFetch = (bearer: string) =>
    fetch(url, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init.headers ?? {}),
        Authorization: `Bearer ${bearer}`,
      },
    });

  let res = await doFetch(token);
  if (res.status === 401) {
    const refreshed = await refreshSupabaseSession();
    if (refreshed) {
      res = await doFetch(refreshed);
    }
  }

  return res;
}

async function parseOrThrow<T>(res: Response): Promise<T> {
  const data = (await res.json()) as T & { error?: string };
  if (!res.ok) {
    throw new Error(data.error || 'Erro ao comunicar com o Supabase.');
  }
  return data;
}

export async function fetchWorkspaceFromSupabase(): Promise<{
  leads: Lead[];
  activities: LeadActivity[];
}> {
  const res = await fetchWithSupabaseAuth('/api/supabase/workspace', {
    method: 'GET',
    cache: 'no-store',
  });
  return parseOrThrow(res);
}

export async function createLeadInSupabase(
  data: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Lead> {
  const res = await fetchWithSupabaseAuth('/api/supabase/leads', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  const parsed = await parseOrThrow<{ lead: Lead }>(res);
  return parsed.lead;
}

export async function updateLeadInSupabase(
  id: string,
  patch: Partial<Omit<Lead, 'id' | 'createdAt'>>
): Promise<Lead> {
  const res = await fetchWithSupabaseAuth('/api/supabase/leads', {
    method: 'PATCH',
    body: JSON.stringify({ id, patch }),
  });
  const parsed = await parseOrThrow<{ lead: Lead }>(res);
  return parsed.lead;
}

export async function deleteLeadInSupabase(id: string): Promise<void> {
  const res = await fetchWithSupabaseAuth('/api/supabase/leads', {
    method: 'DELETE',
    body: JSON.stringify({ id }),
  });
  await parseOrThrow(res);
}

export async function createActivityInSupabase(
  activity: Omit<LeadActivity, 'id' | 'completed'>
): Promise<LeadActivity> {
  const res = await fetchWithSupabaseAuth('/api/supabase/activities', {
    method: 'POST',
    body: JSON.stringify(activity),
  });
  const parsed = await parseOrThrow<{ activity: LeadActivity }>(res);
  return parsed.activity;
}

export async function toggleActivityInSupabase(
  id: string,
  completed: boolean
): Promise<void> {
  const res = await fetchWithSupabaseAuth('/api/supabase/activities', {
    method: 'PATCH',
    body: JSON.stringify({ id, completed }),
  });
  await parseOrThrow(res);
}

export async function deleteActivityInSupabase(id: string): Promise<void> {
  const res = await fetchWithSupabaseAuth('/api/supabase/activities', {
    method: 'DELETE',
    body: JSON.stringify({ id }),
  });
  await parseOrThrow(res);
}

export async function seedDemoWorkspaceInSupabase(): Promise<{
  leads: Lead[];
  activities: LeadActivity[];
}> {
  const res = await fetchWithSupabaseAuth('/api/supabase/workspace', {
    method: 'POST',
  });
  return parseOrThrow(res);
}
