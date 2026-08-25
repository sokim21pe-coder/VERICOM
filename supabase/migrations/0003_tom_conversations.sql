-- TOM 상담은 로그인한 users에 저장한다.
-- deal_id / artifact_id는 후속 Teaser·NDA·IM·LOI·DD 테이블과 연결할 Placeholder다.

create table if not exists public.tom_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  company_id uuid references public.companies (id) on delete set null,
  deal_id uuid,
  intent text not null check (intent in ('sell', 'buy')),
  status text not null default 'active'
    check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tom_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.tom_conversations (id) on delete cascade,
  author_role text not null check (author_role in ('user', 'tom', 'system')),
  body text not null,
  created_at timestamptz not null default now()
);

-- 대화에서 추출한 구조화 기억. Teaser/NDA 등과 나중에 매핑.
create table if not exists public.tom_memory_items (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.tom_conversations (id) on delete cascade,
  memory_key text not null,
  memory_value text,
  information_state text not null default 'UNKNOWN',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- TODO: artifact 테이블이 생기면 artifact_id FK를 건다.
create table if not exists public.tom_artifact_links (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.tom_conversations (id) on delete cascade,
  artifact_kind text not null
    check (artifact_kind in (
      'TEASER', 'NDA', 'IM', 'LOI', 'DD', 'SPA', 'CLOSING', 'OTHER'
    )),
  artifact_id uuid,
  created_at timestamptz not null default now(),
  unique (conversation_id, artifact_kind, artifact_id)
);

create index if not exists tom_conversations_user_idx
  on public.tom_conversations (user_id, intent, status);
create index if not exists tom_messages_conversation_idx
  on public.tom_messages (conversation_id, created_at);
create index if not exists tom_memory_conversation_idx
  on public.tom_memory_items (conversation_id);
create index if not exists tom_artifact_conversation_idx
  on public.tom_artifact_links (conversation_id);

drop trigger if exists tom_conversations_set_updated_at on public.tom_conversations;
create trigger tom_conversations_set_updated_at
  before update on public.tom_conversations
  for each row execute procedure public.set_updated_at();

drop trigger if exists tom_memory_set_updated_at on public.tom_memory_items;
create trigger tom_memory_set_updated_at
  before update on public.tom_memory_items
  for each row execute procedure public.set_updated_at();

alter table public.tom_conversations enable row level security;
alter table public.tom_messages enable row level security;
alter table public.tom_memory_items enable row level security;
alter table public.tom_artifact_links enable row level security;

drop policy if exists tom_conversations_own on public.tom_conversations;
create policy tom_conversations_own on public.tom_conversations
  for all to authenticated
  using (user_id = public.current_app_user_id())
  with check (user_id = public.current_app_user_id());

drop policy if exists tom_messages_own on public.tom_messages;
create policy tom_messages_own on public.tom_messages
  for all to authenticated
  using (
    conversation_id in (
      select id from public.tom_conversations
      where user_id = public.current_app_user_id()
    )
  )
  with check (
    conversation_id in (
      select id from public.tom_conversations
      where user_id = public.current_app_user_id()
    )
  );

drop policy if exists tom_memory_own on public.tom_memory_items;
create policy tom_memory_own on public.tom_memory_items
  for all to authenticated
  using (
    conversation_id in (
      select id from public.tom_conversations
      where user_id = public.current_app_user_id()
    )
  )
  with check (
    conversation_id in (
      select id from public.tom_conversations
      where user_id = public.current_app_user_id()
    )
  );

drop policy if exists tom_artifact_own on public.tom_artifact_links;
create policy tom_artifact_own on public.tom_artifact_links
  for all to authenticated
  using (
    conversation_id in (
      select id from public.tom_conversations
      where user_id = public.current_app_user_id()
    )
  )
  with check (
    conversation_id in (
      select id from public.tom_conversations
      where user_id = public.current_app_user_id()
    )
  );

grant select, insert, update on public.tom_conversations to authenticated;
grant select, insert on public.tom_messages to authenticated;
grant select, insert, update on public.tom_memory_items to authenticated;
grant select, insert on public.tom_artifact_links to authenticated;
