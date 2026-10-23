-- WhatsApp companion tables. Run with `supabase db push`.
-- Students can only touch their own rows. The webhook uses the service role.

create table if not exists public.whatsapp_link_codes (
  student_id uuid primary key references auth.users (id) on delete cascade,
  phone text not null check (phone ~ '^\+27[6-8][0-9]{8}$'),
  code_hash text not null check (length(code_hash) = 64),
  expires_at timestamptz not null default now() + interval '10 minutes',
  consent_at timestamptz not null default now()
);

create table if not exists public.whatsapp_links (
  phone text primary key check (phone ~ '^\+27[6-8][0-9]{8}$'),
  student_id uuid not null unique references auth.users (id) on delete cascade,
  linked_at timestamptz not null default now(),
  opted_out boolean not null default false,
  alert_prefs jsonb not null default '{"offers":true,"documents":true,"deadlines":true,"payments":true,"messages":true}'
);

-- The minimum the bot may say, written by the app for the signed-in student.
create table if not exists public.bot_snapshots (
  student_id uuid primary key references auth.users (id) on delete cascade,
  snapshot jsonb not null check (pg_column_size(snapshot) < 20000),
  updated_at timestamptz not null default now()
);

create table if not exists public.scam_reports (
  id bigint generated always as identity primary key,
  student_id uuid references auth.users (id) on delete set null,
  channel text not null check (channel in ('whatsapp', 'app')),
  report text not null check (length(report) <= 500),
  created_at timestamptz not null default now()
);

alter table public.whatsapp_link_codes enable row level security;
alter table public.whatsapp_links enable row level security;
alter table public.bot_snapshots enable row level security;
alter table public.scam_reports enable row level security;

-- Link codes: a student creates and replaces only their own code.
create policy "own link code" on public.whatsapp_link_codes
  for all to authenticated using (student_id = auth.uid()) with check (student_id = auth.uid());

-- Links: a student can see their link and change alerts or opt out. The webhook creates links.
create policy "read own link" on public.whatsapp_links
  for select to authenticated using (student_id = auth.uid());
create policy "update own link" on public.whatsapp_links
  for update to authenticated using (student_id = auth.uid()) with check (student_id = auth.uid());
create policy "delete own link" on public.whatsapp_links
  for delete to authenticated using (student_id = auth.uid());
-- Only these columns can be changed by the student (field whitelist).
revoke update on public.whatsapp_links from authenticated;
grant update (opted_out, alert_prefs) on public.whatsapp_links to authenticated;

-- Snapshots: written and read only by their owner.
create policy "own snapshot" on public.bot_snapshots
  for all to authenticated using (student_id = auth.uid()) with check (student_id = auth.uid());

-- Scam reports: students can file, nobody but the service role can read.
create policy "file a report" on public.scam_reports
  for insert to authenticated with check (student_id = auth.uid());

-- Explicit grants: the project does not expose new tables automatically. RLS still decides which rows.
grant select, insert, update, delete on public.whatsapp_link_codes, public.bot_snapshots to authenticated;
grant select, delete on public.whatsapp_links to authenticated;
grant insert on public.scam_reports to authenticated;
grant all on public.whatsapp_link_codes, public.whatsapp_links, public.bot_snapshots, public.scam_reports to service_role;
