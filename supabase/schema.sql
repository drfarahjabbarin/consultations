-- Run this in Supabase SQL Editor

-- 1) Tables
create table if not exists public.consultations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  doctor_phone text not null,
  urgency text not null check (urgency in ('elective','urgent','very_urgent')),
  status text not null default 'new' check (status in ('new','in_progress','closed'))
);

create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  consultation_id uuid not null references public.consultations(id) on delete cascade,
  name text not null,
  location text not null,
  location_other text,
  case_summary text
);

create table if not exists public.attachments (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  consultation_id uuid not null references public.consultations(id) on delete cascade,
  file_path text not null,
  file_name text not null,
  mime_type text,
  size_bytes bigint
);

-- Admin allowlist table (link to Supabase Auth user_id)
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- 2) Enable RLS
alter table public.consultations enable row level security;
alter table public.patients enable row level security;
alter table public.attachments enable row level security;
alter table public.admins enable row level security;

-- Helper: is current user admin?
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.admins a where a.user_id = auth.uid()
  );
$$;

