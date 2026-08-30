-- Sprint 0 Test Seed. DEV/TEST 전용. 실제 기업·고객 이메일을 쓰지 않는다.
-- Auth 사용자는 아래 이메일이 이미 있어야 한다. 비밀번호는 이 파일에 넣지 않는다.
--
-- TEST_DEV_SELLER     test.seller.sprint0@vericom.test
-- TEST_DEV_BUYER_A    test.buyera.sprint0@vericom.test
-- TEST_DEV_BUYER_B    test.buyerb.sprint0@vericom.test
-- TEST_DEV_EXPERT     test.expert.sprint0@vericom.test
-- TEST_DEV_INTERNAL   test.internal.sprint0@vericom.test
-- TEST_DEV_MULTI      test.multi.sprint0@vericom.test

insert into public.companies (name, legal_name, company_status, verification_status)
select 'TEST_DEV_SELLER_CO', 'TEST DEV SELLER CO', 'active', 'unverified'
where not exists (select 1 from public.companies where name = 'TEST_DEV_SELLER_CO');

insert into public.companies (name, legal_name, company_status, verification_status)
select 'TEST_DEV_BUYER_CO_A', 'TEST DEV BUYER CO A', 'active', 'unverified'
where not exists (select 1 from public.companies where name = 'TEST_DEV_BUYER_CO_A');

insert into public.companies (name, legal_name, company_status, verification_status)
select 'TEST_DEV_BUYER_CO_B', 'TEST DEV BUYER CO B', 'active', 'unverified'
where not exists (select 1 from public.companies where name = 'TEST_DEV_BUYER_CO_B');

insert into public.user_platform_roles (user_id, platform_role, verification_level)
select u.id, v.platform_role, v.verification_level
from public.users u
join (
  values
    ('test.seller.sprint0@vericom.test', 'SELLER_USER', 'S1'),
    ('test.buyera.sprint0@vericom.test', 'BUYER_USER', 'B1'),
    ('test.buyerb.sprint0@vericom.test', 'BUYER_USER', 'B1'),
    ('test.expert.sprint0@vericom.test', 'EXPERT_USER', 'E0'),
    ('test.internal.sprint0@vericom.test', 'INTERNAL_DEAL_MANAGER', 'I0'),
    ('test.multi.sprint0@vericom.test', 'SELLER_USER', 'S1'),
    ('test.multi.sprint0@vericom.test', 'BUYER_USER', 'B1')
) as v(email, platform_role, verification_level) on lower(u.email) = v.email
on conflict (user_id, platform_role) do nothing;

insert into public.company_memberships (
  user_id, company_id, membership_role, status, verification_status
)
select u.id, c.id, 'OWNER', 'active', 'unverified'
from public.users u
join public.companies c on c.name = 'TEST_DEV_SELLER_CO'
where lower(u.email) in (
  'test.seller.sprint0@vericom.test',
  'test.multi.sprint0@vericom.test'
)
on conflict (user_id, company_id) do nothing;

insert into public.company_memberships (
  user_id, company_id, membership_role, status, verification_status
)
select u.id, c.id, 'OWNER', 'active', 'unverified'
from public.users u
join public.companies c on c.name = 'TEST_DEV_BUYER_CO_A'
where lower(u.email) = 'test.buyera.sprint0@vericom.test'
on conflict (user_id, company_id) do nothing;

insert into public.company_memberships (
  user_id, company_id, membership_role, status, verification_status
)
select u.id, c.id, 'OWNER', 'active', 'unverified'
from public.users u
join public.companies c on c.name = 'TEST_DEV_BUYER_CO_B'
where lower(u.email) = 'test.buyerb.sprint0@vericom.test'
on conflict (user_id, company_id) do nothing;

insert into public.deals (title, seller_company_id, status)
select 'TEST_DEV_DEAL_A', c.id, 'draft'
from public.companies c
where c.name = 'TEST_DEV_SELLER_CO'
  and not exists (select 1 from public.deals where title = 'TEST_DEV_DEAL_A');

insert into public.deals (title, seller_company_id, status)
select 'TEST_DEV_DEAL_B_NO_EXPERT', c.id, 'draft'
from public.companies c
where c.name = 'TEST_DEV_SELLER_CO'
  and not exists (select 1 from public.deals where title = 'TEST_DEV_DEAL_B_NO_EXPERT');

insert into public.deal_participants (deal_id, user_id, deal_role)
select d.id, u.id, v.deal_role
from public.deals d
join (
  values
    ('TEST_DEV_DEAL_A', 'test.seller.sprint0@vericom.test', 'SELLER_OWNER'),
    ('TEST_DEV_DEAL_A', 'test.buyera.sprint0@vericom.test', 'BUYER_OWNER'),
    ('TEST_DEV_DEAL_A', 'test.expert.sprint0@vericom.test', 'EXPERT'),
    ('TEST_DEV_DEAL_A', 'test.internal.sprint0@vericom.test', 'INTERNAL_MANAGER'),
    ('TEST_DEV_DEAL_B_NO_EXPERT', 'test.seller.sprint0@vericom.test', 'SELLER_OWNER')
) as v(title, email, deal_role) on d.title = v.title
join public.users u on lower(u.email) = v.email
on conflict (deal_id, user_id) do nothing;

insert into public.deal_permissions (deal_id, user_id, permission_code)
select d.id, u.id, v.permission_code
from public.deals d
join (
  values
    ('TEST_DEV_DEAL_A', 'test.seller.sprint0@vericom.test', 'VIEW_DEAL'),
    ('TEST_DEV_DEAL_A', 'test.buyera.sprint0@vericom.test', 'VIEW_DEAL'),
    ('TEST_DEV_DEAL_A', 'test.expert.sprint0@vericom.test', 'EXPERT_VIEW_ASSIGNED'),
    ('TEST_DEV_DEAL_A', 'test.internal.sprint0@vericom.test', 'INTERNAL_VIEW_DEAL')
) as v(title, email, permission_code) on d.title = v.title
join public.users u on lower(u.email) = v.email
on conflict (deal_id, user_id, permission_code) do nothing;

insert into public.expert_profiles (user_id, specialty, status)
select u.id, 'TEST_DEV_FDD_SCOPE', 'active'
from public.users u
where lower(u.email) = 'test.expert.sprint0@vericom.test'
on conflict (user_id) do nothing;

insert into public.dd_workstreams (deal_id, code, status)
select d.id, 'FDD', 'not_started'
from public.deals d
where d.title = 'TEST_DEV_DEAL_A'
  and not exists (
    select 1 from public.dd_workstreams w
    where w.deal_id = d.id and w.code = 'FDD'
  );
