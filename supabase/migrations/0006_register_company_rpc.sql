-- 회사 INSERT 직후 SELECT가 RLS에 막혀 생성 실패하던 문제를 피한다.
-- 로그인한 사용자의 users 행과 Membership을 같은 함수에서 만든다.

create or replace function public.register_company_for_current_user(
  p_name text,
  p_legal_name text default null,
  p_industry text default null,
  p_website text default null,
  p_business_registration_number text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid;
  cid uuid;
begin
  uid := public.current_app_user_id();
  if uid is null then
    raise exception 'not authenticated';
  end if;
  if p_name is null or length(trim(p_name)) = 0 then
    raise exception 'company name required';
  end if;

  insert into public.companies (
    name,
    legal_name,
    industry,
    website,
    business_registration_number,
    company_status,
    verification_status
  )
  values (
    trim(p_name),
    nullif(trim(p_legal_name), ''),
    nullif(trim(p_industry), ''),
    nullif(trim(p_website), ''),
    nullif(trim(p_business_registration_number), ''),
    'active',
    'unverified'
  )
  returning id into cid;

  insert into public.company_memberships (
    user_id,
    company_id,
    membership_role,
    status,
    verification_status
  )
  values (
    uid,
    cid,
    'OWNER',
    'active',
    'unverified'
  );

  return cid;
end;
$$;

revoke all on function public.register_company_for_current_user(text, text, text, text, text) from public;
grant execute on function public.register_company_for_current_user(text, text, text, text, text) to authenticated;
