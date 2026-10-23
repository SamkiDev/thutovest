-- The demo student is now Tatenda. Same account and password (deliberately public), new email and app id.
update auth.users
set email = 'tatenda@thutovest.demo', updated_at = now()
where id = '6f1c0a52-4d3b-4c8e-9a10-000000000001';

update auth.identities
set identity_data = identity_data || jsonb_build_object('email', 'tatenda@thutovest.demo'), updated_at = now()
where user_id = '6f1c0a52-4d3b-4c8e-9a10-000000000001' and provider = 'email';

update public.profiles
set app_user_id = 'stu-tatenda'
where user_id = '6f1c0a52-4d3b-4c8e-9a10-000000000001';

-- The saved plan still belongs to the old id; the app replaces it with a fresh demo plan on next sign-in.
delete from public.student_states where user_id = '6f1c0a52-4d3b-4c8e-9a10-000000000001';
