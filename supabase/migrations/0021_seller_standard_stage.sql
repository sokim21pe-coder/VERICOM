-- Phase C — Seller Standard Workflow Stage Persistence Foundation.
--
-- 목적: Seller Deal이 현재 Standard Workflow(코드 SoT `lib/deal/standard-workflow.ts`)의
--       어느 단계에 있는지 안전하게 저장하고, 전환 이력을 감사 가능하게 남긴다.
--
-- 원칙(비파괴):
-- * deals.seller_stage_key 는 nullable · default 없음. 기존 Deal은 NULL 유지(미확정 의미).
-- * 기존 Stage 값 삭제/변환/자동 migration 없음. 기존 컬럼 rename/삭제 없음.
-- * PostgreSQL enum을 새로 만들지 않는다(Workflow 확장/override 대비). text + 형태(prefix) CHECK만 둔다.
-- * 유효 stage key(13개)의 정확한 검증은 서버 코드 SoT(WorkflowStageKey)가 담당한다.
--   DB는 무효한 임의 문자열/타 side(BUYER_*) 유입만 막는 최소 형태 guard만 둔다(코드-DB drift 최소화).
-- * Buyer stage는 여기에 저장하지 않는다. Buyer persistence는 향후 Opportunity Architecture로 별도 설계.
-- * Stage 전환의 Source of Truth는 사용자 행동/승인/운영자 행동이며 AI가 확정하지 않는다.
--   자동 진행 trigger(NDA→NDA stage 등)를 만들지 않는다. 전환은 명시적 RPC 호출만.
--
-- 적용: 이 파일은 additive/backward-compatible 이다. 이번 작업에서 Production에 적용하지 않는다.
--       원격 적용은 별도 승인 후 진행한다.

-- 1) deals: Seller 현재 표준 Stage (nullable, default 없음)
alter table public.deals
  add column if not exists seller_stage_key text;

comment on column public.deals.seller_stage_key is
  'Seller Standard Workflow 현재 단계 key (lib/deal/standard-workflow.ts WorkflowStageKey, SELLER_*). NULL = 아직 명시적으로 확정되지 않음. 자동으로 DISCOVERY로 채우지 않는다.';

alter table public.deals
  drop constraint if exists deals_seller_stage_key_shape;
alter table public.deals
  add constraint deals_seller_stage_key_shape
  check (
    seller_stage_key is null
    or (seller_stage_key ~ '^SELLER_[A-Z_]+$' and char_length(seller_stage_key) <= 64)
  );

-- 2) deal_stage_events: append-only 전환 이력 (deal-scoped)
--    기존 audit_logs/activities 는 actor-scoped(본인 행만 조회)이고 from/to stage를 담지 못하므로
--    Deal 참여자가 조회 가능한 구조화된 stage 이력 SoT로 별도 테이블을 둔다.
--    (cross-cutting 일반 감사 로그는 서버 boundary에서 recordAudit()로 병행 기록한다.)
create table if not exists public.deal_stage_events (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references public.deals (id) on delete cascade,
  from_stage_key text,
  to_stage_key text not null,
  actor_user_id uuid references public.users (id) on delete set null,
  note text,
  transition_source text not null default 'USER_ACTION',
  created_at timestamptz not null default now(),
  constraint deal_stage_events_to_shape
    check (to_stage_key ~ '^SELLER_[A-Z_]+$' and char_length(to_stage_key) <= 64),
  constraint deal_stage_events_from_shape
    check (
      from_stage_key is null
      or (from_stage_key ~ '^SELLER_[A-Z_]+$' and char_length(from_stage_key) <= 64)
    ),
  constraint deal_stage_events_source_allowed
    check (transition_source in ('USER_ACTION', 'STAFF_ACTION', 'SYSTEM'))
);

comment on table public.deal_stage_events is
  'Seller Standard Workflow stage 전환 이력(append-only). Buyer/Opportunity stage는 포함하지 않는다.';

create index if not exists deal_stage_events_deal_idx
  on public.deal_stage_events (deal_id, created_at);

-- 3) 쓰기 권한 helper: Seller 측 Deal 참여자(오너/운영자) 또는 Internal 매니저만 stage 전환 가능
create or replace function public.can_write_seller_deal_stage(target_deal_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.deal_participants p
    where p.user_id = public.current_app_user_id()
      and p.deal_id = target_deal_id
      and p.deal_role in ('SELLER_OWNER', 'SELLER_OPERATOR', 'INTERNAL_MANAGER')
  );
$$;

revoke all on function public.can_write_seller_deal_stage(uuid) from public;
grant execute on function public.can_write_seller_deal_stage(uuid) to authenticated;

-- 4) 단일 write path: stage 전환 command (event append + 현재 stage 갱신을 원자적으로 수행)
--    권한 검증은 여기서 강제하고, 유효 stage key(13개) 검증은 호출 전 서버 코드 SoT가 담당한다.
--    Buyer stage/자동 진행/AI 확정은 하지 않는다.
create or replace function public.transition_seller_deal_stage(
  p_deal_id uuid,
  p_to_stage_key text,
  p_note text default null,
  p_source text default 'USER_ACTION'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid;
  v_from text;
  v_event_id uuid;
begin
  v_actor := public.current_app_user_id();
  if v_actor is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  if not public.can_write_seller_deal_stage(p_deal_id) then
    raise exception 'not permitted to transition this deal stage' using errcode = '42501';
  end if;

  -- 현재 stage를 from으로 기록(없으면 NULL). 기존 Deal 데이터를 임의로 바꾸지 않는다.
  select seller_stage_key into v_from from public.deals where id = p_deal_id;

  insert into public.deal_stage_events (
    deal_id,
    from_stage_key,
    to_stage_key,
    actor_user_id,
    note,
    transition_source
  ) values (
    p_deal_id,
    v_from,
    p_to_stage_key,
    v_actor,
    nullif(btrim(coalesce(p_note, '')), ''),
    coalesce(nullif(btrim(coalesce(p_source, '')), ''), 'USER_ACTION')
  ) returning id into v_event_id;

  update public.deals
    set seller_stage_key = p_to_stage_key
    where id = p_deal_id;

  return v_event_id;
end;
$$;

revoke all on function public.transition_seller_deal_stage(uuid, text, text, text) from public;
grant execute on function public.transition_seller_deal_stage(uuid, text, text, text) to authenticated;

-- 5) RLS: 참여자만 이력 조회. 직접 INSERT/UPDATE/DELETE 권한은 부여하지 않는다(오직 RPC로만 기록).
alter table public.deal_stage_events enable row level security;

drop policy if exists deal_stage_events_select_participant on public.deal_stage_events;
create policy deal_stage_events_select_participant on public.deal_stage_events
  for select to authenticated
  using (
    deal_id in (
      select deal_id from public.deal_participants
      where user_id = public.current_app_user_id()
    )
  );

grant select on public.deal_stage_events to authenticated;
