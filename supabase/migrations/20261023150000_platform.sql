-- ThutoVest marketplace backend. Run with `supabase db push`.
--
-- Security model (see SECURITY.md):
-- * platform_state holds the shared marketplace. RLS is on and there are no
--   policies, so browsers can't read or write it at all. Only the `platform`
--   Edge Function (service role) touches it, after running the same
--   authorize() rules as the app with the caller's identity from their login.
-- * Each student's private plan lives in student_states, readable and
--   writable only by its owner.
-- * platform_ticks is a public version counter. Browsers subscribe to it with
--   Realtime and re-fetch their own filtered view when it changes, so the
--   notification itself carries no data.

-- Which app account a login belongs to. Written only by migrations or the server.
create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('student', 'sponsor')),
  app_user_id text not null unique check (length(app_user_id) between 3 and 60),
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "read own profile" on public.profiles for select to authenticated using (user_id = auth.uid());
revoke insert, update, delete on public.profiles from anon, authenticated;

create table if not exists public.platform_state (
  id smallint primary key default 1 check (id = 1),
  state jsonb not null check (octet_length(state::text) < 20000000),
  version bigint not null default 1,
  updated_at timestamptz not null default now()
);
alter table public.platform_state enable row level security;
revoke all on public.platform_state from anon, authenticated;

create table if not exists public.platform_ticks (
  id smallint primary key default 1 check (id = 1),
  version bigint not null default 0,
  updated_at timestamptz not null default now()
);
alter table public.platform_ticks enable row level security;
create policy "anyone can read the version counter" on public.platform_ticks for select to anon, authenticated using (true);
revoke insert, update, delete on public.platform_ticks from anon, authenticated;
insert into public.platform_ticks (id, version) values (1, 0) on conflict (id) do nothing;

create table if not exists public.student_states (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  state jsonb not null check (octet_length(state::text) < 4000000),
  updated_at timestamptz not null default now()
);
alter table public.student_states enable row level security;
create policy "read own plan" on public.student_states for select to authenticated using (user_id = auth.uid());
create policy "create own plan" on public.student_states for insert to authenticated with check (user_id = auth.uid());
create policy "update own plan" on public.student_states for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
revoke delete on public.student_states from anon, authenticated;
revoke all on public.student_states from anon;

create or replace function public.touch_updated_at() returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
create trigger student_states_touch before update on public.student_states for each row execute function public.touch_updated_at();

-- Atomic write used by the Edge Function: only succeeds if nobody else wrote in between.
create or replace function public.commit_platform_state(p_expected bigint, p_state jsonb)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v bigint;
begin
  if p_expected = 0 then
    insert into public.platform_state (id, state, version) values (1, p_state, 1)
    on conflict (id) do nothing
    returning version into v;
  else
    update public.platform_state set state = p_state, version = version + 1, updated_at = now()
    where id = 1 and version = p_expected
    returning version into v;
  end if;
  if v is not null then
    update public.platform_ticks set version = v, updated_at = now() where id = 1;
  end if;
  return v;
end;
$$;
revoke execute on function public.commit_platform_state(bigint, jsonb) from public, anon, authenticated;
grant execute on function public.commit_platform_state(bigint, jsonb) to service_role;

-- Explicit grants: the project does not expose new tables automatically. RLS still decides which rows.
grant usage on schema public to anon, authenticated, service_role;
grant select on public.profiles to authenticated;
grant select on public.platform_ticks to anon, authenticated;
grant select, insert, update on public.student_states to authenticated;
grant all on public.profiles, public.platform_state, public.platform_ticks, public.student_states to service_role;

-- Realtime: version counter for everyone, each student's own plan for cross-device sync (RLS applies).
alter publication supabase_realtime add table public.platform_ticks;
alter publication supabase_realtime add table public.student_states;

-- Demo accounts for judges. These passwords are deliberately public (sign-in page and slides).
do $$
declare
  demo record;
begin
  for demo in
    select * from (values
      ('6f1c0a52-4d3b-4c8e-9a10-000000000001'::uuid, 'thando@thutovest.demo', 'student', 'stu-thando'),
      ('6f1c0a52-4d3b-4c8e-9a10-000000000002'::uuid, 'funding@ridgeline.demo', 'sponsor', 'sp-ridgeline')
    ) as t (id, email, role, app_user_id)
  loop
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token
    ) values (
      '00000000-0000-0000-0000-000000000000', demo.id, 'authenticated', 'authenticated', demo.email,
      extensions.crypt('Demo#2026', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}', '{}', now(), now(),
      '', '', '', '', '', '', '', ''
    ) on conflict (id) do nothing;

    insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (
      gen_random_uuid(), demo.id, demo.id::text,
      jsonb_build_object('sub', demo.id::text, 'email', demo.email, 'email_verified', true),
      'email', now(), now(), now()
    ) on conflict do nothing;

    insert into public.profiles (user_id, role, app_user_id) values (demo.id, demo.role, demo.app_user_id)
    on conflict (user_id) do nothing;
  end loop;
end;
$$;
