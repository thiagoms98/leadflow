import { createClient, type SupabaseClient } from '@supabase/supabase-js';

function cleanEnvValue(raw: string | undefined): string {
  if (!raw) return '';
  let val = raw.trim();
  // Remove aspas simples ou duplas coladas acidentalmente no painel de Secrets
  if (
    (val.startsWith('"') && val.endsWith('"')) ||
    (val.startsWith("'") && val.endsWith("'"))
  ) {
    val = val.slice(1, -1).trim();
  }
  return val;
}

function normalizeSupabaseUrl(rawUrl: string): string {
  const cleaned = cleanEnvValue(rawUrl);
  if (!cleaned) return '';
  try {
    const parsed = new URL(cleaned);
    return parsed.origin;
  } catch {
    return cleaned.replace(/\/+$/, '');
  }
}

export function getSupabaseServerConfig(): {
  url: string;
  anonKey: string;
  configured: boolean;
  diagnosticError?: string;
} {
  const rawUrl =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    '';
  const rawKey =
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_KEY ||
    '';

  const url = normalizeSupabaseUrl(rawUrl);
  const anonKey = cleanEnvValue(rawKey);

  if (!url || !anonKey) {
    return { configured: false, url: '', anonKey: '' };
  }

  const isPlaceholder =
    url.toLowerCase().includes('seu-projeto') ||
    url.toLowerCase().includes('your-project') ||
    anonKey.toLowerCase().includes('sua-chave') ||
    anonKey.toLowerCase().includes('your-anon-key');

  if (isPlaceholder) {
    return { configured: false, url: '', anonKey: '' };
  }

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return {
      configured: false,
      url,
      anonKey,
      diagnosticError:
        'A variável SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL deve começar com https:// (ex.: https://seuprojeto.supabase.co).',
    };
  }

  return { configured: true, url, anonKey };
}

export function createSupabaseServerClient(
  accessToken?: string
): SupabaseClient {
  const cfg = getSupabaseServerConfig();
  if (!cfg.configured) {
    throw new Error(cfg.diagnosticError || 'Supabase não configurado.');
  }

  return createClient(cfg.url, cfg.anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    ...(accessToken
      ? {
          global: {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        }
      : {}),
  });
}

export function translateSupabaseError(message: string): string {
  const msg = message.toLowerCase();
  if (msg.includes('invalid api key') || msg.includes('apikey')) {
    return 'API Key do Supabase inválida. Verifique nas Secrets se SUPABASE_ANON_KEY (ou NEXT_PUBLIC_SUPABASE_ANON_KEY) é a chave "anon" / "publishable" exata do mesmo projeto de SUPABASE_URL, sem espaços ou aspas.';
  }
  if (msg.includes('invalid login credentials')) {
    return 'E-mail ou senha incorretos.';
  }
  if (msg.includes('email not confirmed')) {
    return 'Confirme seu e-mail pelo link enviado antes de entrar.';
  }
  if (msg.includes('user already registered')) {
    return 'Este e-mail já está cadastrado. Faça login para acessar.';
  }
  if (msg.includes('password should be at least')) {
    return 'A senha deve conter no mínimo 6 caracteres.';
  }
  if (msg.includes('rate limit') || msg.includes('too many requests')) {
    return 'Muitas tentativas em sequência. Aguarde alguns instantes.';
  }
  if (msg.includes('jwt expired')) {
    return 'Sua sessão expirou. Faça login novamente.';
  }
  return message;
}
