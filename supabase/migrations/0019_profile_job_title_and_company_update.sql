-- 회원 프로필 편집(내 프로필) 지원. 비파괴/additive.
-- 1) persons.job_title 컬럼 추가 (nullable)
-- 2) 회사 기본정보(회사명/업종/웹사이트) 수정용 security-definer RPC
--    companies에는 UPDATE RLS가 없다. register_company_for_current_user 패턴을 따라
--    "현재 사용자가 해당 회사의 active member"일 때만 수정하도록 함수로 경계를 둔다.
-- 기존 컬럼/데이터/정책 변경 없음.

alter table public.persons
  add column if not exists job_title text;

create or replace function public.update_company_for_current_user(
  p_company_id uuid,
  p_name text,
  p_industry text default null,
  p_website text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid;
begin
  uid := public.current_app_user_id();
  if uid is null then
    raise exception 'not authenticated';
  end if;

  if p_name is null or length(trim(p_name)) = 0 then
    raise exception 'company name required';
  end if;

  -- 현재 사용자가 해당 회사의 active membership을 가진 경우에만 허용.
  if not exists (
    select 1
    from public.company_memberships m
    where m.company_id = p_company_id
      and m.user_id = uid
      and m.status = 'active'
  ) then
    raise exception 'not permitted to update this company';
  end if;

  update public.companies
  set
    name = trim(p_name),
    industry = nullif(trim(coalesce(p_industry, '')), ''),
    website = nullif(trim(coalesce(p_website, '')), '')
  where id = p_company_id;

  return p_company_id;
end;
$$;

revoke all on function public.update_company_for_current_user(uuid, text, text, text) from public;
grant execute on function public.update_company_for_current_user(uuid, text, text, text) to authenticated;
