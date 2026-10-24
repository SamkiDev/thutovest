-- Five more demo student logins, one per judge, so judges don't share one plan.
-- Same deliberately public password as the other demo accounts.
do $$
declare
  demo record;
begin
  for demo in
    select * from (values
      ('6f1c0a52-4d3b-4c8e-9a10-000000000003'::uuid, 'judge1@thutovest.demo', 'stu-judge1'),
      ('6f1c0a52-4d3b-4c8e-9a10-000000000004'::uuid, 'judge2@thutovest.demo', 'stu-judge2'),
      ('6f1c0a52-4d3b-4c8e-9a10-000000000005'::uuid, 'judge3@thutovest.demo', 'stu-judge3'),
      ('6f1c0a52-4d3b-4c8e-9a10-000000000006'::uuid, 'judge4@thutovest.demo', 'stu-judge4'),
      ('6f1c0a52-4d3b-4c8e-9a10-000000000007'::uuid, 'judge5@thutovest.demo', 'stu-judge5')
    ) as t (id, email, app_user_id)
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

    insert into public.profiles (user_id, role, app_user_id) values (demo.id, 'student', demo.app_user_id)
    on conflict (user_id) do nothing;
  end loop;
end;
$$;

-- Lock the judge logins the same way as the first two demo accounts.
create or replace function public.keep_demo_credentials() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if old.id in (
    '6f1c0a52-4d3b-4c8e-9a10-000000000001', '6f1c0a52-4d3b-4c8e-9a10-000000000002',
    '6f1c0a52-4d3b-4c8e-9a10-000000000003', '6f1c0a52-4d3b-4c8e-9a10-000000000004',
    '6f1c0a52-4d3b-4c8e-9a10-000000000005', '6f1c0a52-4d3b-4c8e-9a10-000000000006',
    '6f1c0a52-4d3b-4c8e-9a10-000000000007'
  ) then
    new.encrypted_password := old.encrypted_password;
    new.email := old.email;
    new.phone := old.phone;
  end if;
  return new;
end;
$$;

revoke all on function public.keep_demo_credentials() from public, anon, authenticated;
