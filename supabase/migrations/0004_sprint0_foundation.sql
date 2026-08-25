-- Sprint 0 잔여 기반. Deal 생성·DD 워크플로는 UI에서 열지 않는다.

create table if not exists public.deals (
  id uuid primary key default gen_random_uuid(),
  title text,
  seller_company_id uuid references public.companies (id) on delete set null,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.deal_participants (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references public.deals (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  deal_role text not null,
  created_at timestamptz not null default now(),
  unique (deal_id, user_id)
);

create table if not exists public.deal_permissions (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references public.deals (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  permission_code text not null,
  created_at timestamptz not null default now(),
  unique (deal_id, user_id, permission_code)
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.users (id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.users (id) on delete set null,
  activity_type text not null,
  entity_type text,
  entity_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.expert_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users (id) on delete cascade,
  specialty text,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.dd_workstreams (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid references public.deals (id) on delete cascade,
  code text not null,
  status text not null default 'not_started',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists deal_participants_user_idx on public.deal_participants (user_id);
create index if not exists deal_permissions_user_idx on public.deal_permissions (user_id, deal_id);
create index if not exists audit_logs_actor_idx on public.audit_logs (actor_user_id, created_at);

drop trigger if exists deals_set_updated_at on public.deals;
create trigger deals_set_updated_at
  before update on public.deals
  for each row execute procedure public.set_updated_at();

drop trigger if exists expert_profiles_set_updated_at on public.expert_profiles;
create trigger expert_profiles_set_updated_at
  before update on public.expert_profiles
  for each row execute procedure public.set_updated_at();

drop trigger if exists dd_workstreams_set_updated_at on public.dd_workstreams;
create trigger dd_workstreams_set_updated_at
  before update on public.dd_workstreams
  for each row execute procedure public.set_updated_at();

alter table public.deals enable row level security;
alter table public.deal_participants enable row level security;
alter table public.deal_permissions enable row level security;
alter table public.audit_logs enable row level security;
alter table public.activities enable row level security;
alter table public.expert_profiles enable row level security;
alter table public.dd_workstreams enable row level security;

drop policy if exists deals_select_participant on public.deals;
create policy deals_select_participant on public.deals
  for select to authenticated
  using (
    id in (
      select deal_id from public.deal_participants
      where user_id = public.current_app_user_id()
    )
  );

drop policy if exists deal_participants_select_self on public.deal_participants;
create policy deal_participants_select_self on public.deal_participants
  for select to authenticated
  using (user_id = public.current_app_user_id());

drop policy if exists deal_permissions_select_self on public.deal_permissions;
create policy deal_permissions_select_self on public.deal_permissions
  for select to authenticated
  using (user_id = public.current_app_user_id());

drop policy if exists audit_insert_self on public.audit_logs;
create policy audit_insert_self on public.audit_logs
  for insert to authenticated
  with check (actor_user_id = public.current_app_user_id());

drop policy if exists audit_select_self on public.audit_logs;
create policy audit_select_self on public.audit_logs
  for select to authenticated
  using (actor_user_id = public.current_app_user_id());

drop policy if exists activities_insert_self on public.activities;
create policy activities_insert_self on public.activities
  for insert to authenticated
  with check (actor_user_id = public.current_app_user_id());

drop policy if exists activities_select_self on public.activities;
create policy activities_select_self on public.activities
  for select to authenticated
  using (actor_user_id = public.current_app_user_id());

drop policy if exists expert_profiles_self on public.expert_profiles;
create policy expert_profiles_self on public.expert_profiles
  for all to authenticated
  using (user_id = public.current_app_user_id())
  with check (user_id = public.current_app_user_id());

drop policy if exists dd_workstreams_participant on public.dd_workstreams;
create policy dd_workstreams_participant on public.dd_workstreams
  for select to authenticated
  using (
    deal_id in (
      select deal_id from public.deal_participants
      where user_id = public.current_app_user_id()
    )
  );

grant select on public.deals to authenticated;
grant select on public.deal_participants to authenticated;
grant select on public.deal_permissions to authenticated;
grant select, insert on public.audit_logs to authenticated;
grant select, insert on public.activities to authenticated;
grant select, insert, update on public.expert_profiles to authenticated;
grant select on public.dd_workstreams to authenticated;

-- Private Storage: Dashboard → Storage에서 버킷 이름 vericom-private, Public 해제.
