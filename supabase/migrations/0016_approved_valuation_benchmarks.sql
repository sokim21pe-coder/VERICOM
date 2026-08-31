-- Sprint 2 LEVEL 0 Approved EV/Sales Benchmark persistence.
-- 0008 / 0009 leftover 와 valuations(PLACEHOLDER default)는 적용하지 않는다.
-- 업종 기본 배수·PLACEHOLDER source·0.5–2.0 default는 두지 않는다.

create or replace function public.has_staff_platform_role()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_platform_roles
    where user_id = public.current_app_user_id()
      and platform_role in (
        'EXPERT_USER',
        'INTERNAL_DEAL_MANAGER',
        'ADMIN'
      )
  );
$$;

create or replace function public.is_seller_member_of_company(target_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.company_memberships m
    join public.user_platform_roles r on r.user_id = m.user_id
    where m.user_id = public.current_app_user_id()
      and m.company_id = target_company_id
      and m.status = 'active'
      and r.platform_role = 'SELLER_USER'
  );
$$;

revoke all on function public.has_staff_platform_role() from public;
revoke all on function public.is_seller_member_of_company(uuid) from public;
grant execute on function public.has_staff_platform_role() to authenticated;
grant execute on function public.is_seller_member_of_company(uuid) to authenticated;

create table if not exists public.approved_valuation_benchmarks (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  conversation_id uuid references public.tom_conversations (id) on delete set null,
  deal_id uuid references public.deals (id) on delete set null,
  method text not null check (method in ('EV_SALES')),
  multiple numeric,
  multiple_low numeric,
  multiple_base numeric,
  multiple_high numeric,
  source text not null,
  source_type text not null
    check (source_type in (
      'TEST_FIXTURE',
      'INTERNAL_REVIEW',
      'MARKET_PROVIDER',
      'UNKNOWN'
    )),
  as_of_date date not null,
  industry text,
  confidence text not null check (confidence in ('LOW', 'MEDIUM', 'HIGH')),
  approval_status text not null
    check (approval_status in ('APPROVED', 'TEST_ONLY', 'UNVERIFIED')),
  provenance jsonb,
  created_by uuid not null references public.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint approved_benchmarks_source_required
    check (length(trim(source)) > 0 and source <> 'PLACEHOLDER'),
  constraint approved_benchmarks_source_type_not_placeholder
    check (source_type <> 'PLACEHOLDER'),
  constraint approved_benchmarks_multiple_when_approved
    check (
      approval_status <> 'APPROVED'
      or coalesce(multiple, 0) > 0
      or coalesce(multiple_base, 0) > 0
      or coalesce(multiple_low, 0) > 0
      or coalesce(multiple_high, 0) > 0
    )
);

comment on table public.approved_valuation_benchmarks is
  'LEVEL 0 EV/Sales 승인 비교배수. 계산 결과 테이블이 아니다. default 배수/PLACEHOLDER 없음.';

create unique index if not exists approved_valuation_benchmarks_company_scope_idx
  on public.approved_valuation_benchmarks (
    company_id,
    method,
    coalesce(conversation_id, '00000000-0000-0000-0000-000000000000')
  );

create index if not exists approved_valuation_benchmarks_company_status_idx
  on public.approved_valuation_benchmarks (company_id, approval_status, method);

drop trigger if exists approved_valuation_benchmarks_set_updated_at
  on public.approved_valuation_benchmarks;
create trigger approved_valuation_benchmarks_set_updated_at
  before update on public.approved_valuation_benchmarks
  for each row execute procedure public.set_updated_at();

alter table public.approved_valuation_benchmarks enable row level security;

drop policy if exists approved_benchmarks_select_staff
  on public.approved_valuation_benchmarks;
create policy approved_benchmarks_select_staff
  on public.approved_valuation_benchmarks
  for select to authenticated
  using (public.has_staff_platform_role());

drop policy if exists approved_benchmarks_select_seller_own
  on public.approved_valuation_benchmarks;
create policy approved_benchmarks_select_seller_own
  on public.approved_valuation_benchmarks
  for select to authenticated
  using (
    approval_status = 'APPROVED'
    and public.is_seller_member_of_company(company_id)
    and (
      conversation_id is null
      or conversation_id in (
        select id
        from public.tom_conversations
        where user_id = public.current_app_user_id()
          and intent = 'sell'
      )
    )
  );

drop policy if exists approved_benchmarks_insert_staff
  on public.approved_valuation_benchmarks;
create policy approved_benchmarks_insert_staff
  on public.approved_valuation_benchmarks
  for insert to authenticated
  with check (
    public.has_staff_platform_role()
    and created_by = public.current_app_user_id()
  );

drop policy if exists approved_benchmarks_update_staff
  on public.approved_valuation_benchmarks;
create policy approved_benchmarks_update_staff
  on public.approved_valuation_benchmarks
  for update to authenticated
  using (public.has_staff_platform_role())
  with check (public.has_staff_platform_role());

drop policy if exists approved_benchmarks_delete_staff
  on public.approved_valuation_benchmarks;
create policy approved_benchmarks_delete_staff
  on public.approved_valuation_benchmarks
  for delete to authenticated
  using (public.has_staff_platform_role());

grant select, insert, update, delete on public.approved_valuation_benchmarks
  to authenticated;
