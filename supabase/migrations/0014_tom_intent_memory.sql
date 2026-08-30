-- Sprint 1 TOM Structured Memory 보강.
-- 기존 tom_conversations / tom_messages / tom_memory_items를 재사용한다.
-- 0008 / 0009 / valuations 테이블은 포함하지 않는다.

alter table public.tom_conversations
  add column if not exists platform_role text;

alter table public.tom_memory_items
  add column if not exists user_id uuid references public.users (id) on delete cascade;

alter table public.tom_memory_items
  add column if not exists company_id uuid references public.companies (id) on delete set null;

alter table public.tom_memory_items
  add column if not exists deal_id uuid;

alter table public.tom_memory_items
  add column if not exists source text;

alter table public.tom_memory_items
  add column if not exists confidence numeric;

create unique index if not exists tom_memory_items_conversation_key_idx
  on public.tom_memory_items (conversation_id, memory_key);

create index if not exists tom_memory_items_user_idx
  on public.tom_memory_items (user_id);

comment on column public.tom_conversations.platform_role is
  '대화 당시 Active Platform Role. Company의 영구 Seller/Buyer 속성이 아니다.';
comment on column public.tom_memory_items.source is
  'Intent 출처. Sprint 1은 rule만 사용한다.';
comment on column public.tom_memory_items.confidence is
  '규칙 기반 점수. exact=1.0, rule=0.8, unknown=0.';
