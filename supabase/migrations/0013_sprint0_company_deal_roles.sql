-- Sprint 0: 한 Company가 Deal별로 Seller 또는 Buyer가 될 수 있음을 검증하는 TEST Deal.
-- companies 테이블에 영구 Seller/Buyer 컬럼을 만들지 않는다.
-- TEST_DEV_SELLER_CO = DEAL_A/B에서 Seller, DEAL_Y에서 Buyer.
-- TEST_DEV_BUYER_CO_A = DEAL_A에서 Buyer, DEAL_Y에서 Seller.

insert into public.deals (title, seller_company_id, status)
select 'TEST_DEV_DEAL_Y_COMPANY_AS_BUYER', c.id, 'draft'
from public.companies c
where c.name = 'TEST_DEV_BUYER_CO_A'
  and not exists (
    select 1 from public.deals where title = 'TEST_DEV_DEAL_Y_COMPANY_AS_BUYER'
  );

insert into public.deal_participants (deal_id, user_id, deal_role)
select d.id, u.id, v.deal_role
from public.deals d
join (
  values
    (
      'TEST_DEV_DEAL_Y_COMPANY_AS_BUYER',
      'test.buyera.sprint0@vericom.test',
      'SELLER_OWNER'
    ),
    (
      'TEST_DEV_DEAL_Y_COMPANY_AS_BUYER',
      'test.seller.sprint0@vericom.test',
      'BUYER_OWNER'
    )
) as v(title, email, deal_role) on d.title = v.title
join public.users u on lower(u.email) = v.email
on conflict (deal_id, user_id) do nothing;

insert into public.deal_permissions (deal_id, user_id, permission_code)
select d.id, u.id, v.permission_code
from public.deals d
join (
  values
    (
      'TEST_DEV_DEAL_Y_COMPANY_AS_BUYER',
      'test.buyera.sprint0@vericom.test',
      'VIEW_DEAL'
    ),
    (
      'TEST_DEV_DEAL_Y_COMPANY_AS_BUYER',
      'test.seller.sprint0@vericom.test',
      'VIEW_DEAL'
    )
) as v(title, email, permission_code) on d.title = v.title
join public.users u on lower(u.email) = v.email
on conflict (deal_id, user_id, permission_code) do nothing;
