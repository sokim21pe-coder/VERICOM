insert into public.companies (name, company_status, verification_status)
select 'PLACEHOLDER_TEST_SELLER_CO', 'active', 'unverified'
where not exists (
  select 1 from public.companies where name = 'PLACEHOLDER_TEST_SELLER_CO'
);

insert into public.companies (name, company_status, verification_status)
select 'PLACEHOLDER_TEST_BUYER_CO', 'active', 'unverified'
where not exists (
  select 1 from public.companies where name = 'PLACEHOLDER_TEST_BUYER_CO'
);
