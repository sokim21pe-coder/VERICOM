-- Identity Core (MASTER_SPEC 2절). Sprint 0 목록(0001)에 대한 CREATE.
-- Seller/Buyer 전용 사용자 테이블은 만들지 않는다.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users (id) on delete cascade,
  email text not null,
  display_name text not null,
  status text not null default 'active'
    check (status in ('active', 'disabled')),
  guest_session_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.persons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references public.users (id) on delete set null,
  full_name text not null,
  email text not null,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  legal_name text,
  business_registration_number text,
  website text,
  industry text,
  company_status text not null default 'active'
    check (company_status in ('draft', 'active', 'inactive')),
  verification_status text not null default 'unverified'
    check (verification_status in ('unverified', 'pending', 'verified')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.company_memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  company_id uuid not null references public.companies (id) on delete cascade,
  membership_role text not null
    check (membership_role in (
      'OWNER', 'REPRESENTATIVE', 'EXECUTIVE', 'EMPLOYEE', 'COMPANY_ADMIN'
    )),
  status text not null default 'active'
    check (status in ('pending', 'active', 'revoked')),
  verification_status text not null default 'unverified'
    check (verification_status in ('unverified', 'pending', 'verified')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, company_id)
);

create table if not exists public.platform_roles (
  code text primary key,
  label_ko text not null
);

insert into public.platform_roles (code, label_ko) values
  ('SELLER_USER', '기업 매각'),
  ('BUYER_USER', '기업 인수'),
  ('EXPERT_USER', 'M&A 전문가'),
  ('INTERNAL_DEAL_MANAGER', '내부 Deal 담당'),
  ('ADMIN', '관리자')
on conflict (code) do nothing;

create table if not exists public.user_platform_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  platform_role text not null references public.platform_roles (code),
  verification_level text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, platform_role)
);

-- TODO: Guest Session → TOM Structured Memory → User 연결 (Phase 후속)
create table if not exists public.guest_sessions (
  id text primary key,
  linked_user_id uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists users_email_idx on public.users (email);
create index if not exists persons_user_id_idx on public.persons (user_id);
create index if not exists companies_name_idx on public.companies (name);
create index if not exists memberships_user_id_idx on public.company_memberships (user_id);
create index if not exists memberships_company_id_idx on public.company_memberships (company_id);
create index if not exists user_roles_user_id_idx on public.user_platform_roles (user_id);

drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at
  before update on public.users
  for each row execute procedure public.set_updated_at();

drop trigger if exists persons_set_updated_at on public.persons;
create trigger persons_set_updated_at
  before update on public.persons
  for each row execute procedure public.set_updated_at();

drop trigger if exists companies_set_updated_at on public.companies;
create trigger companies_set_updated_at
  before update on public.companies
  for each row execute procedure public.set_updated_at();

drop trigger if exists memberships_set_updated_at on public.company_memberships;
create trigger memberships_set_updated_at
  before update on public.company_memberships
  for each row execute procedure public.set_updated_at();

drop trigger if exists user_roles_set_updated_at on public.user_platform_roles;
create trigger user_roles_set_updated_at
  before update on public.user_platform_roles
  for each row execute procedure public.set_updated_at();

create or replace function public.current_app_user_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.users where auth_user_id = auth.uid() limit 1;
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_user_id uuid;
  display text;
begin
  display := coalesce(
    nullif(trim(new.raw_user_meta_data->>'display_name'), ''),
    split_part(new.email, '@', 1)
  );
  insert into public.users (auth_user_id, email, display_name, status)
  values (new.id, new.email, display, 'active')
  on conflict (auth_user_id) do update
    set email = excluded.email
  returning id into new_user_id;

  insert into public.persons (user_id, full_name, email)
  values (new_user_id, display, new.email)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_auth_user();

create or replace function public.search_companies_by_name(q text)
returns table (id uuid, name text)
language sql
security definer
set search_path = public
as $$
  select c.id, c.name
  from public.companies c
  where auth.uid() is not null
    and length(trim(q)) >= 1
    and c.name ilike '%' || trim(q) || '%'
  order by c.name
  limit 20;
$$;

revoke all on function public.search_companies_by_name(text) from public;
grant execute on function public.search_companies_by_name(text) to authenticated;
grant execute on function public.current_app_user_id() to authenticated;

alter table public.users enable row level security;
alter table public.persons enable row level security;
alter table public.companies enable row level security;
alter table public.company_memberships enable row level security;
alter table public.platform_roles enable row level security;
alter table public.user_platform_roles enable row level security;
alter table public.guest_sessions enable row level security;

drop policy if exists users_select_self on public.users;
create policy users_select_self on public.users
  for select to authenticated
  using (auth_user_id = auth.uid());

drop policy if exists users_update_self on public.users;
create policy users_update_self on public.users
  for update to authenticated
  using (auth_user_id = auth.uid())
  with check (auth_user_id = auth.uid());

drop policy if exists users_insert_self on public.users;
create policy users_insert_self on public.users
  for insert to authenticated
  with check (auth_user_id = auth.uid());

drop policy if exists persons_select_self on public.persons;
create policy persons_select_self on public.persons
  for select to authenticated
  using (user_id = public.current_app_user_id());

drop policy if exists persons_insert_self on public.persons;
create policy persons_insert_self on public.persons
  for insert to authenticated
  with check (user_id = public.current_app_user_id());

drop policy if exists persons_update_self on public.persons;
create policy persons_update_self on public.persons
  for update to authenticated
  using (user_id = public.current_app_user_id())
  with check (user_id = public.current_app_user_id());

drop policy if exists memberships_select_self on public.company_memberships;
create policy memberships_select_self on public.company_memberships
  for select to authenticated
  using (user_id = public.current_app_user_id());

drop policy if exists memberships_insert_self on public.company_memberships;
create policy memberships_insert_self on public.company_memberships
  for insert to authenticated
  with check (user_id = public.current_app_user_id());

drop policy if exists companies_select_member on public.companies;
create policy companies_select_member on public.companies
  for select to authenticated
  using (
    id in (
      select company_id from public.company_memberships
      where user_id = public.current_app_user_id()
    )
  );

drop policy if exists companies_insert_auth on public.companies;
create policy companies_insert_auth on public.companies
  for insert to authenticated
  with check (auth.uid() is not null);

drop policy if exists roles_select_all on public.platform_roles;
create policy roles_select_all on public.platform_roles
  for select to authenticated
  using (true);

drop policy if exists user_roles_select_self on public.user_platform_roles;
create policy user_roles_select_self on public.user_platform_roles
  for select to authenticated
  using (user_id = public.current_app_user_id());

drop policy if exists user_roles_insert_self on public.user_platform_roles;
create policy user_roles_insert_self on public.user_platform_roles
  for insert to authenticated
  with check (user_id = public.current_app_user_id());

drop policy if exists user_roles_update_self on public.user_platform_roles;
create policy user_roles_update_self on public.user_platform_roles
  for update to authenticated
  using (user_id = public.current_app_user_id())
  with check (user_id = public.current_app_user_id());

grant select, insert, update on public.users to authenticated;
grant select, insert, update on public.persons to authenticated;
grant select, insert on public.companies to authenticated;
grant select, insert, update on public.company_memberships to authenticated;
grant select on public.platform_roles to authenticated;
grant select, insert, update on public.user_platform_roles to authenticated;
grant select on public.guest_sessions to authenticated;

-- TODO: Internal / Admin RLS는 후속 단계에서 별도 정책으로 연다.
drop policy if exists guest_sessions_select_linked on public.guest_sessions;
create policy guest_sessions_select_linked on public.guest_sessions
  for select to authenticated
  using (linked_user_id = public.current_app_user_id());
