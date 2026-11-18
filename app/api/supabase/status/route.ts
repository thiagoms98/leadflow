import { NextResponse } from 'next/server';
import { getSupabaseServerConfig } from '@/lib/supabase-server';

export async function GET() {
  const cfg = getSupabaseServerConfig();
  return NextResponse.json({
    configured: cfg.configured,
    diagnosticError: cfg.diagnosticError ?? null,
  });
}
