-- 사람이 Supabase SQL Editor에서 한 번 실행한다.
-- Auth User(admin@vericom.kr)를 먼저 Dashboard에서 만든 뒤에만 실행한다.
-- 비밀번호를 이 파일에 두지 않는다. 기존 ADMIN Role은 부여하지 않는다.
-- 0022 적용 후에만 성공한다. migration 번호가 아니며 schema_migrations에 넣지 않는다.

select
  u.id as user_id,
  u.auth_user_id,
  u.email,
  u.display_name
from public.users u
where lower(u.email) = 'admin@vericom.kr';

update public.users
set display_name = 'admin'
where lower(email) = 'admin@vericom.kr'
  and display_name is distinct from 'admin';

update public.persons p
set full_name = 'admin'
from public.users u
where p.user_id = u.id
  and lower(u.email) = 'admin@vericom.kr'
  and p.full_name is distinct from 'admin';

insert into public.user_platform_roles (user_id, platform_role, verification_level)
select u.id, 'PLATFORM_SUPER_ADMIN', 'P0'
from public.users u
where lower(u.email) = 'admin@vericom.kr'
on conflict (user_id, platform_role) do nothing;

-- 기대 결과: PLATFORM_SUPER_ADMIN 1행. ADMIN 행이 있으면 이 스크립트가 만든 것이 아니다.
select r.platform_role, r.verification_level, u.display_name, u.email
from public.user_platform_roles r
join public.users u on u.id = r.user_id
where lower(u.email) = 'admin@vericom.kr'
order by r.platform_role;
