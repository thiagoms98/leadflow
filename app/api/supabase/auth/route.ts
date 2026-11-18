import { NextRequest, NextResponse } from 'next/server';
import type { User } from '@supabase/supabase-js';
import {
  createSupabaseServerClient,
  getSupabaseServerConfig,
  translateSupabaseError,
} from '@/lib/supabase-server';

function computeInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'LF';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function mapUser(user: User) {
  const meta = (user.user_metadata ?? {}) as Record<string, string | undefined>;
  const name =
    meta.name?.trim() ||
    user.email?.split('@')[0] ||
    'Usuário LeadFlow';

  return {
    id: user.id,
    name,
    email: user.email ?? '',
    company: meta.company?.trim() || 'Minha Empresa',
    role: meta.role?.trim() || 'Gestor Comercial',
    initials: meta.initials?.trim() || computeInitials(name),
    isDemo: false,
  };
}

export async function POST(req: NextRequest) {
  const cfg = getSupabaseServerConfig();
  if (!cfg.configured) {
    return NextResponse.json(
      {
        error:
          cfg.diagnosticError ||
          'Credenciais do Supabase não configuradas nas variáveis de ambiente.',
      },
      { status: 400 }
    );
  }

  try {
    const body = (await req.json()) as {
      action?: 'login' | 'register' | 'recover' | 'refresh';
      email?: string;
      password?: string;
      name?: string;
      company?: string;
      role?: string;
      refreshToken?: string;
    };

    const supabase = createSupabaseServerClient();

    if (body.action === 'login') {
      const email = (body.email ?? '').trim().toLowerCase();
      const password = body.password ?? '';
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return NextResponse.json(
          { error: translateSupabaseError(error.message) },
          { status: 401 }
        );
      }
      if (!data.user || !data.session) {
        return NextResponse.json(
          { error: 'Não foi possível iniciar sessão no Supabase.' },
          { status: 401 }
        );
      }

      return NextResponse.json({
        user: mapUser(data.user),
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
      });
    }

    if (body.action === 'register') {
      const email = (body.email ?? '').trim().toLowerCase();
      const password = body.password ?? '';
      const name = (body.name ?? '').trim();
      const company = (body.company ?? '').trim();
      const role = (body.role ?? 'Gestor Comercial').trim();
      const initials = computeInitials(name || email);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            company,
            role,
            initials,
          },
        },
      });

      if (error) {
        return NextResponse.json(
          { error: translateSupabaseError(error.message) },
          { status: 400 }
        );
      }

      if (data.session && data.user) {
        return NextResponse.json({
          user: mapUser(data.user),
          accessToken: data.session.access_token,
          refreshToken: data.session.refresh_token,
          needsConfirmation: false,
        });
      }

      return NextResponse.json({
        user: null,
        needsConfirmation: true,
      });
    }

    if (body.action === 'recover') {
      const email = (body.email ?? '').trim().toLowerCase();
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) {
        return NextResponse.json(
          { error: translateSupabaseError(error.message) },
          { status: 400 }
        );
      }
      return NextResponse.json({ ok: true });
    }

    if (body.action === 'refresh') {
      const refreshToken = body.refreshToken ?? '';
      const { data, error } = await supabase.auth.refreshSession({
        refresh_token: refreshToken,
      });
      if (error || !data.session || !data.user) {
        return NextResponse.json(
          { error: translateSupabaseError(error?.message ?? 'Sessão expirada') },
          { status: 401 }
        );
      }
      return NextResponse.json({
        user: mapUser(data.user),
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
      });
    }

    return NextResponse.json({ error: 'Ação inválida.' }, { status: 400 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Erro interno de autenticação.';
    return NextResponse.json(
      { error: translateSupabaseError(message) },
      { status: 500 }
    );
  }
}
