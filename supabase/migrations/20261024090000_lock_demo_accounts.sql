-- The demo passwords are deliberately public, so anyone signed in as a demo
-- account could change its password, email or phone and lock judges out.
-- Keep those fields as they are for the two demo accounts. Updates still go
-- through (sign-in times and so on), so logging in is unaffected.
-- To change a demo login on purpose, drop this trigger first, then recreate it.
create or replace function public.keep_demo_credentials() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if old.id in ('6f1c0a52-4d3b-4c8e-9a10-000000000001', '6f1c0a52-4d3b-4c8e-9a10-000000000002') then
    new.encrypted_password := old.encrypted_password;
    new.email := old.email;
    new.phone := old.phone;
  end if;
  return new;
end;
$$;

revoke all on function public.keep_demo_credentials() from public, anon, authenticated;

drop trigger if exists keep_demo_credentials on auth.users;
create trigger keep_demo_credentials before update on auth.users
for each row execute function public.keep_demo_credentials();
