-- Seller Teaser Foundation — Draft → Review → Explicit Approval → Approved Teaser + Audit.
-- 비파괴/additive 전용. 기존 테이블/컬럼/정책 변경·삭제 없음.
-- Teaser는 NDA 전 익명/제한정보 소개자료다(IM/CIM 아님). 회사명은 식별정보 공개 승인 전 노출하지 않는다.
-- 재무/기업가치 산출값은 Teaser에 자동 포함하지 않는다(매출 구간만).
-- 승인은 오직 명시적 RPC로만 일어난다(저장=승인/미리보기=승인/자동승인 금지).
-- 보안 헬퍼는 0016의 has_staff_platform_role()/is_seller_member_of_company(uuid)를 재사용한다.

-- 1) Teaser 헤더: 현재 버전/상태/승인 메타. content는 현재 편집 중 스냅샷.
create table if not exists public.teasers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  deal_id uuid references public.deals (id) on delete set null,
  conversation_id uuid references public.tom_conversations (id) on delete set null,
  status text not null default 'DRAFT'
    check (status in ('DRAFT', 'IN_REVIEW', 'APPROVED')),
  current_version integer not null default 1 check (current_version >= 1),
  approved_version integer check (approved_version is null or approved_version >= 1),
  approved_at timestamptz,
  approved_by uuid references public.users (id) on delete set null,
  identity_masked boolean not null default true,
  masked_descriptor text,
  headline text,
  content jsonb not null,
  created_by uuid not null references public.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- 승인 상태면 approved_version/approved_at이 반드시 있어야 한다.
  constraint teasers_approved_requires_version
    check (
      status <> 'APPROVED'
      or (approved_version is not null and approved_at is not null)
    )
);

comment on table public.teasers is
  'Seller Teaser 헤더(현재 버전/상태/승인 메타). NDA 전 익명 소개자료. 기업가치 산출값 비포함.';

-- 회사별 sell 대화당 Teaser 1건으로 제한(중복 생성 방지).
create unique index if not exists teasers_company_conversation_idx
  on public.teasers (
    company_id,
    coalesce(conversation_id, '00000000-0000-0000-0000-000000000000')
  );

create index if not exists teasers_company_status_idx
  on public.teasers (company_id, status);

drop trigger if exists teasers_set_updated_at on public.teasers;
create trigger teasers_set_updated_at
  before update on public.teasers
  for each row execute procedure public.set_updated_at();

-- 2) Teaser 버전: 불변 스냅샷. 승인/수정 이력 Audit 대상.
create table if not exists public.teaser_versions (
  id uuid primary key default gen_random_uuid(),
  teaser_id uuid not null references public.teasers (id) on delete cascade,
  version integer not null check (version >= 1),
  status_at_snapshot text not null
    check (status_at_snapshot in ('DRAFT', 'IN_REVIEW', 'APPROVED')),
  identity_masked boolean not null default true,
  masked_descriptor text,
  headline text,
  content jsonb not null,
  created_by uuid not null references public.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint teaser_versions_unique unique (teaser_id, version)
);

comment on table public.teaser_versions is
  'Teaser 불변 버전 스냅샷. 승인된 버전은 이후 편집으로 덮어쓰지 않는다.';

create index if not exists teaser_versions_teaser_idx
  on public.teaser_versions (teaser_id, version desc);

-- 3) RLS: SELECT는 (해당 회사 Seller) 또는 (Staff)만. Buyer/타사는 어떤 경우에도 불가.
--    모든 쓰기는 아래 security-definer RPC로만 수행한다(직접 INSERT/UPDATE/DELETE 정책 없음).
alter table public.teasers enable row level security;
alter table public.teaser_versions enable row level security;

drop policy if exists teasers_select_seller_own on public.teasers;
create policy teasers_select_seller_own
  on public.teasers
  for select to authenticated
  using (public.is_seller_member_of_company(company_id));

drop policy if exists teasers_select_staff on public.teasers;
create policy teasers_select_staff
  on public.teasers
  for select to authenticated
  using (public.has_staff_platform_role());

drop policy if exists teaser_versions_select_seller_own on public.teaser_versions;
create policy teaser_versions_select_seller_own
  on public.teaser_versions
  for select to authenticated
  using (
    exists (
      select 1
      from public.teasers t
      where t.id = teaser_versions.teaser_id
        and public.is_seller_member_of_company(t.company_id)
    )
  );

drop policy if exists teaser_versions_select_staff on public.teaser_versions;
create policy teaser_versions_select_staff
  on public.teaser_versions
  for select to authenticated
  using (public.has_staff_platform_role());

grant select on public.teasers to authenticated;
grant select on public.teaser_versions to authenticated;

-- 4) RPCs. 모두 security definer + Seller 경계 검증. 승인은 명시적 호출로만.

-- 4a) Draft 생성(DRAFT, version 1). 이미 있으면 기존 id 반환.
create or replace function public.create_teaser_draft(
  p_company_id uuid,
  p_content jsonb,
  p_headline text default null,
  p_masked_descriptor text default null,
  p_identity_masked boolean default true,
  p_deal_id uuid default null,
  p_conversation_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid;
  existing_id uuid;
  new_id uuid;
begin
  uid := public.current_app_user_id();
  if uid is null then
    raise exception 'not authenticated';
  end if;

  if not public.is_seller_member_of_company(p_company_id) then
    raise exception 'not permitted: seller of company required';
  end if;

  if p_content is null then
    raise exception 'content required';
  end if;

  select id into existing_id
  from public.teasers
  where company_id = p_company_id
    and coalesce(conversation_id, '00000000-0000-0000-0000-000000000000')
        = coalesce(p_conversation_id, '00000000-0000-0000-0000-000000000000');

  if existing_id is not null then
    return existing_id;
  end if;

  insert into public.teasers (
    company_id, deal_id, conversation_id, status,
    current_version, identity_masked, masked_descriptor, headline,
    content, created_by
  ) values (
    p_company_id, p_deal_id, p_conversation_id, 'DRAFT',
    1, coalesce(p_identity_masked, true), p_masked_descriptor, p_headline,
    p_content, uid
  )
  returning id into new_id;

  insert into public.teaser_versions (
    teaser_id, version, status_at_snapshot,
    identity_masked, masked_descriptor, headline, content, created_by
  ) values (
    new_id, 1, 'DRAFT',
    coalesce(p_identity_masked, true), p_masked_descriptor, p_headline, p_content, uid
  );

  return new_id;
end;
$$;

-- 4b) 버전 저장(편집). 어떤 편집이든 상태를 DRAFT로 되돌려 승인을 무효화한다.
--     단, 이미 승인된 스냅샷(approved_version)은 보존한다(덮어쓰지 않음).
create or replace function public.save_teaser_version(
  p_teaser_id uuid,
  p_content jsonb,
  p_headline text default null,
  p_masked_descriptor text default null,
  p_identity_masked boolean default true
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid;
  t_company uuid;
  next_version integer;
begin
  uid := public.current_app_user_id();
  if uid is null then
    raise exception 'not authenticated';
  end if;

  if p_content is null then
    raise exception 'content required';
  end if;

  select company_id, current_version + 1
  into t_company, next_version
  from public.teasers
  where id = p_teaser_id
  for update;

  if t_company is null then
    raise exception 'teaser not found';
  end if;

  if not public.is_seller_member_of_company(t_company) then
    raise exception 'not permitted: seller of company required';
  end if;

  insert into public.teaser_versions (
    teaser_id, version, status_at_snapshot,
    identity_masked, masked_descriptor, headline, content, created_by
  ) values (
    p_teaser_id, next_version, 'DRAFT',
    coalesce(p_identity_masked, true), p_masked_descriptor, p_headline, p_content, uid
  );

  update public.teasers
  set
    status = 'DRAFT',
    current_version = next_version,
    identity_masked = coalesce(p_identity_masked, true),
    masked_descriptor = p_masked_descriptor,
    headline = p_headline,
    content = p_content
  where id = p_teaser_id;

  return next_version;
end;
$$;

-- 4c) 검토 제출(DRAFT → IN_REVIEW).
create or replace function public.submit_teaser_for_review(
  p_teaser_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid;
  t_company uuid;
  t_status text;
begin
  uid := public.current_app_user_id();
  if uid is null then
    raise exception 'not authenticated';
  end if;

  select company_id, status into t_company, t_status
  from public.teasers
  where id = p_teaser_id
  for update;

  if t_company is null then
    raise exception 'teaser not found';
  end if;

  if not public.is_seller_member_of_company(t_company) then
    raise exception 'not permitted: seller of company required';
  end if;

  if t_status <> 'DRAFT' then
    raise exception 'invalid transition to IN_REVIEW from %', t_status;
  end if;

  update public.teasers
  set status = 'IN_REVIEW'
  where id = p_teaser_id;
end;
$$;

-- 4d) 명시적 승인(IN_REVIEW → APPROVED). 현재 버전을 승인 스냅샷으로 고정한다.
create or replace function public.approve_teaser(
  p_teaser_id uuid
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid;
  t_company uuid;
  t_status text;
  t_version integer;
begin
  uid := public.current_app_user_id();
  if uid is null then
    raise exception 'not authenticated';
  end if;

  select company_id, status, current_version
  into t_company, t_status, t_version
  from public.teasers
  where id = p_teaser_id
  for update;

  if t_company is null then
    raise exception 'teaser not found';
  end if;

  if not public.is_seller_member_of_company(t_company) then
    raise exception 'not permitted: seller of company required';
  end if;

  if t_status <> 'IN_REVIEW' then
    raise exception 'invalid transition to APPROVED from %', t_status;
  end if;

  update public.teaser_versions
  set status_at_snapshot = 'APPROVED'
  where teaser_id = p_teaser_id
    and version = t_version;

  update public.teasers
  set
    status = 'APPROVED',
    approved_version = t_version,
    approved_at = now(),
    approved_by = uid
  where id = p_teaser_id;

  return t_version;
end;
$$;

revoke all on function public.create_teaser_draft(uuid, jsonb, text, text, boolean, uuid, uuid) from public;
revoke all on function public.save_teaser_version(uuid, jsonb, text, text, boolean) from public;
revoke all on function public.submit_teaser_for_review(uuid) from public;
revoke all on function public.approve_teaser(uuid) from public;

grant execute on function public.create_teaser_draft(uuid, jsonb, text, text, boolean, uuid, uuid) to authenticated;
grant execute on function public.save_teaser_version(uuid, jsonb, text, text, boolean) to authenticated;
grant execute on function public.submit_teaser_for_review(uuid) to authenticated;
grant execute on function public.approve_teaser(uuid) to authenticated;
