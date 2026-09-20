-- Arogya Kavacha 108: realtime emergency dispatch
-- Run this in Supabase Dashboard -> SQL Editor.

create table if not exists public.emergency_requests (
  id text primary key,
  patient_name text not null,
  contact_phone text,
  emergency_type text not null,
  details text default '',
  status text not null default 'requested',
  latitude double precision not null,
  longitude double precision not null,
  accuracy double precision default 0,
  address text default '',
  hospital_id text,
  hospital jsonb not null,
  ambulance jsonb not null,
  eta_minutes integer not null default 0,
  route_to_patient jsonb not null default '[]'::jsonb,
  route_to_hospital jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.emergency_requests enable row level security;

-- Prototype policies. Tighten these after real Supabase Auth is enabled.
drop policy if exists "anon can insert emergency requests" on public.emergency_requests;
create policy "anon can insert emergency requests"
on public.emergency_requests for insert to anon, authenticated
with check (true);

drop policy if exists "anon can read emergency requests" on public.emergency_requests;
create policy "anon can read emergency requests"
on public.emergency_requests for select to anon, authenticated
using (true);

drop policy if exists "anon can update emergency requests" on public.emergency_requests;
create policy "anon can update emergency requests"
on public.emergency_requests for update to anon, authenticated
using (true) with check (true);

-- Realtime needs the table in the publication.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'emergency_requests'
  ) then
    alter publication supabase_realtime add table public.emergency_requests;
  end if;
end $$;

create or replace function public.touch_emergency_request_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists emergency_requests_updated_at on public.emergency_requests;
create trigger emergency_requests_updated_at
before update on public.emergency_requests
for each row execute function public.touch_emergency_request_updated_at();

-- Allow a user to cancel a request from the patient app.
drop policy if exists "anon can delete emergency requests" on public.emergency_requests;
create policy "anon can delete emergency requests"
on public.emergency_requests for delete to anon, authenticated
using (true);
