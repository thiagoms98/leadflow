-- LeadFlow — Schema SQL para Supabase (PostgreSQL + RLS)
-- Execute este script no SQL Editor do seu projeto Supabase.

create extension if not exists "pgcrypto";

-- 1. Perfis de Usuários (sincronizado com auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  email text not null,
  company text not null default '',
  role text not null default 'Gestor Comercial',
  initials text not null default 'LF',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Usuários visualizam o próprio perfil"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Usuários atualizam o próprio perfil"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Usuários inserem o próprio perfil"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Trigger para criar perfil automaticamente ao cadastrar usuário
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  full_name text;
  user_initials text;
begin
  full_name := coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1));
  user_initials := coalesce(
    new.raw_user_meta_data ->> 'initials',
    upper(left(full_name, 2))
  );

  insert into public.profiles (id, name, email, company, role, initials)
  values (
    new.id,
    full_name,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'company', ''),
    coalesce(new.raw_user_meta_data ->> 'role', 'Gestor Comercial'),
    user_initials
  )
  on conflict (id) do update set
    name = excluded.name,
    email = excluded.email,
    company = excluded.company,
    role = excluded.role,
    initials = excluded.initials;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. Tabela de Leads
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  role text not null default 'Decisor Comercial',
  company text not null,
  email text not null default '',
  phone text not null default '',
  city text not null default 'São Paulo, SP',
  segment text not null default 'SaaS B2B',
  origin text not null default 'Inbound / Site',
  stage text not null default 'novo' check (stage in ('novo', 'qualificacao', 'proposta', 'negociacao', 'fechado')),
  priority text not null default 'Média' check (priority in ('Alta', 'Média', 'Normal')),
  value numeric not null default 0,
  probability integer not null default 15 check (probability >= 0 and probability <= 100),
  owner_id text not null default 'tm-thiago',
  next_action text not null default '',
  next_action_date date not null default current_date,
  notes text not null default '',
  created_at date not null default current_date,
  updated_at date not null default current_date
);

create index if not exists idx_leads_user_id on public.leads (user_id);
create index if not exists idx_leads_stage on public.leads (stage);

alter table public.leads enable row level security;

create policy "Usuários visualizam seus próprios leads"
  on public.leads for select
  using (auth.uid() = user_id);

create policy "Usuários criam seus próprios leads"
  on public.leads for insert
  with check (auth.uid() = user_id);

create policy "Usuários atualizam seus próprios leads"
  on public.leads for update
  using (auth.uid() = user_id);

create policy "Usuários excluem seus próprios leads"
  on public.leads for delete
  using (auth.uid() = user_id);

-- 3. Tabela de Atividades / Follow-ups
create table if not exists public.lead_activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  lead_id uuid not null references public.leads (id) on delete cascade,
  type text not null default 'Ligação' check (type in ('Ligação', 'Reunião', 'E-mail', 'Proposta', 'Nota')),
  title text not null,
  description text not null default '',
  due_date date not null default current_date,
  due_time text not null default '14:00',
  owner_id text not null default 'tm-thiago',
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_lead_activities_user_id on public.lead_activities (user_id);
create index if not exists idx_lead_activities_lead_id on public.lead_activities (lead_id);

alter table public.lead_activities enable row level security;

create policy "Usuários visualizam suas próprias atividades"
  on public.lead_activities for select
  using (auth.uid() = user_id);

create policy "Usuários criam suas próprias atividades"
  on public.lead_activities for insert
  with check (auth.uid() = user_id);

create policy "Usuários atualizam suas próprias atividades"
  on public.lead_activities for update
  using (auth.uid() = user_id);

create policy "Usuários excluem suas próprias atividades"
  on public.lead_activities for delete
  using (auth.uid() = user_id);
