-- SUPER ADMIN MODE v1 Foundation.
-- Additive only. 기존 테이블/컬럼/SELECT 정책을 넓히지 않는다.
-- 기존 ADMIN(/internal Staff)과 별개로 PLATFORM_SUPER_ADMIN을 추가한다.
-- 전체 조회는 security-definer RPC만. 일반 authenticated 직접 SELECT 확대 없음.
-- 0021 재실행/수정 없음. schema_migrations 직접 수정 없음.

insert into public.platform_roles (code, label_ko) values
  ('PLATFORM_SUPER_ADMIN', '슈퍼 관리자')
on conflict (code) do nothing;

create or replace function public.has_platform_super_admin()
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
      and platform_role = 'PLATFORM_SUPER_ADMIN'
  );
$$;

revoke all on function public.has_platform_super_admin() from public;
grant execute on function public.has_platform_super_admin() to authenticated;

-- 0012 원칙 확장: INTERNAL / ADMIN / PLATFORM_SUPER_ADMIN 자가부여 금지.
-- 허용 목록은 Seller/Buyer/Expert만.
drop policy if exists user_roles_insert_self on public.user_platform_roles;
create policy user_roles_insert_self
  on public.user_platform_roles
  for insert
  to authenticated
  with check (
    user_id = public.current_app_user_id()
    and platform_role in ('SELLER_USER', 'BUYER_USER', 'EXPERT_USER')
  );

drop policy if exists user_roles_update_self on public.user_platform_roles;
create policy user_roles_update_self
  on public.user_platform_roles
  for update
  to authenticated
  using (user_id = public.current_app_user_id())
  with check (
    user_id = public.current_app_user_id()
    and platform_role in ('SELLER_USER', 'BUYER_USER', 'EXPERT_USER')
  );

create or replace function public.admin_assert_super_admin()
returns void
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.has_platform_super_admin() then
    raise exception 'not permitted: platform super admin required'
      using errcode = '42501';
  end if;
end;
$$;

revoke all on function public.admin_assert_super_admin() from public;

create or replace function public.admin_dashboard_kpis()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  teasers_json jsonb := '{}'::jsonb;
  stages_json jsonb := '{}'::jsonb;
begin
  perform public.admin_assert_super_admin();

  if to_regclass('public.teasers') is not null then
    select coalesce(jsonb_object_agg(k, c), '{}'::jsonb)
      into teasers_json
    from (
      select status::text as k, count(*)::int as c
      from public.teasers
      group by 1
    ) t;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'deals'
      and column_name = 'seller_stage_key'
  ) then
    execute $q$
      select coalesce(jsonb_object_agg(k, c), '{}'::jsonb)
      from (
        select coalesce(seller_stage_key, 'UNSET') as k, count(*)::int as c
        from public.deals
        group by 1
      ) s
    $q$ into stages_json;
  end if;

  return jsonb_build_object(
    'total_users', (select count(*)::int from public.users),
    'active_users', (select count(*)::int from public.users where status = 'active'),
    'total_companies', (select count(*)::int from public.companies),
    'total_deals', (select count(*)::int from public.deals),
    'deals_by_seller_stage', stages_json,
    'teasers_by_status', teasers_json
  );
end;
$$;

revoke all on function public.admin_dashboard_kpis() from public;
grant execute on function public.admin_dashboard_kpis() to authenticated;

create or replace function public.admin_list_users(
  p_query text default null,
  p_status text default null,
  p_limit integer default 20,
  p_offset integer default 0
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  lim integer := least(greatest(coalesce(p_limit, 20), 1), 50);
  off integer := greatest(coalesce(p_offset, 0), 0);
  q text := nullif(trim(coalesce(p_query, '')), '');
  st text := nullif(trim(coalesce(p_status, '')), '');
  total integer := 0;
  rows jsonb := '[]'::jsonb;
begin
  perform public.admin_assert_super_admin();

  select count(*)::int into total
  from public.users u
  where (q is null or u.email ilike '%' || q || '%' or u.display_name ilike '%' || q || '%')
    and (st is null or u.status = st);

  select coalesce(jsonb_agg(item), '[]'::jsonb)
    into rows
  from (
    select jsonb_build_object(
      'id', u.id,
      'email', u.email,
      'display_name', u.display_name,
      'status', u.status,
      'created_at', u.created_at,
      'platform_roles', coalesce((
        select jsonb_agg(r.platform_role order by r.platform_role)
        from public.user_platform_roles r
        where r.user_id = u.id
      ), '[]'::jsonb),
      'company_name', c.name,
      'membership_role', m.membership_role
    ) as item
    from public.users u
    left join lateral (
      select company_id, membership_role
      from public.company_memberships
      where user_id = u.id
        and status in ('active', 'pending')
      order by created_at desc
      limit 1
    ) m on true
    left join public.companies c on c.id = m.company_id
    where (q is null or u.email ilike '%' || q || '%' or u.display_name ilike '%' || q || '%')
      and (st is null or u.status = st)
    order by u.created_at desc
    limit lim offset off
  ) listed;

  return jsonb_build_object('total', total, 'limit', lim, 'offset', off, 'rows', rows);
end;
$$;

revoke all on function public.admin_list_users(text, text, integer, integer) from public;
grant execute on function public.admin_list_users(text, text, integer, integer) to authenticated;

create or replace function public.admin_get_user(p_user_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  perform public.admin_assert_super_admin();
  if p_user_id is null then
    return null;
  end if;

  select jsonb_build_object(
    'id', u.id,
    'email', u.email,
    'display_name', u.display_name,
    'status', u.status,
    'created_at', u.created_at,
    'platform_roles', coalesce((
      select jsonb_agg(r.platform_role order by r.platform_role)
      from public.user_platform_roles r
      where r.user_id = u.id
    ), '[]'::jsonb),
    'memberships', coalesce((
      select jsonb_agg(jsonb_build_object(
        'company_id', m.company_id,
        'company_name', c.name,
        'membership_role', m.membership_role,
        'status', m.status
      ) order by m.created_at desc)
      from public.company_memberships m
      join public.companies c on c.id = m.company_id
      where m.user_id = u.id
    ), '[]'::jsonb)
  )
    into result
  from public.users u
  where u.id = p_user_id;

  return result;
end;
$$;

revoke all on function public.admin_get_user(uuid) from public;
grant execute on function public.admin_get_user(uuid) to authenticated;

create or replace function public.admin_list_companies(
  p_query text default null,
  p_limit integer default 20,
  p_offset integer default 0
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  lim integer := least(greatest(coalesce(p_limit, 20), 1), 50);
  off integer := greatest(coalesce(p_offset, 0), 0);
  q text := nullif(trim(coalesce(p_query, '')), '');
  total integer := 0;
  rows jsonb := '[]'::jsonb;
begin
  perform public.admin_assert_super_admin();

  select count(*)::int into total
  from public.companies c
  where q is null or c.name ilike '%' || q || '%';

  select coalesce(jsonb_agg(item), '[]'::jsonb)
    into rows
  from (
    select jsonb_build_object(
      'id', c.id,
      'name', c.name,
      'company_status', c.company_status,
      'verification_status', c.verification_status,
      'created_at', c.created_at,
      'member_count', (
        select count(*)::int from public.company_memberships m
        where m.company_id = c.id and m.status = 'active'
      ),
      'deal_count', (
        select count(*)::int from public.deals d
        where d.seller_company_id = c.id
      ),
      'owner_name', (
        select u.display_name
        from public.company_memberships m
        join public.users u on u.id = m.user_id
        where m.company_id = c.id
          and m.membership_role = 'OWNER'
          and m.status = 'active'
        order by m.created_at
        limit 1
      )
    ) as item
    from public.companies c
    where q is null or c.name ilike '%' || q || '%'
    order by c.created_at desc
    limit lim offset off
  ) listed;

  return jsonb_build_object('total', total, 'limit', lim, 'offset', off, 'rows', rows);
end;
$$;

revoke all on function public.admin_list_companies(text, integer, integer) from public;
grant execute on function public.admin_list_companies(text, integer, integer) to authenticated;

create or replace function public.admin_get_company(p_company_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  perform public.admin_assert_super_admin();
  if p_company_id is null then
    return null;
  end if;

  select jsonb_build_object(
    'id', c.id,
    'name', c.name,
    'industry', c.industry,
    'company_status', c.company_status,
    'verification_status', c.verification_status,
    'created_at', c.created_at,
    'member_count', (
      select count(*)::int from public.company_memberships m
      where m.company_id = c.id and m.status = 'active'
    ),
    'deal_count', (
      select count(*)::int from public.deals d
      where d.seller_company_id = c.id
    ),
    'members', coalesce((
      select jsonb_agg(jsonb_build_object(
        'user_id', u.id,
        'display_name', u.display_name,
        'membership_role', m.membership_role,
        'status', m.status
      ) order by m.created_at)
      from public.company_memberships m
      join public.users u on u.id = m.user_id
      where m.company_id = c.id
    ), '[]'::jsonb)
  )
    into result
  from public.companies c
  where c.id = p_company_id;

  return result;
end;
$$;

revoke all on function public.admin_get_company(uuid) from public;
grant execute on function public.admin_get_company(uuid) to authenticated;

create or replace function public.admin_list_deals(
  p_query text default null,
  p_limit integer default 20,
  p_offset integer default 0
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  lim integer := least(greatest(coalesce(p_limit, 20), 1), 50);
  off integer := greatest(coalesce(p_offset, 0), 0);
  q text := nullif(trim(coalesce(p_query, '')), '');
  total integer := 0;
  rows jsonb := '[]'::jsonb;
  has_stage boolean := false;
begin
  perform public.admin_assert_super_admin();

  has_stage := exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'deals'
      and column_name = 'seller_stage_key'
  );

  select count(*)::int into total
  from public.deals d
  left join public.companies c on c.id = d.seller_company_id
  where q is null
    or coalesce(d.title, '') ilike '%' || q || '%'
    or coalesce(c.name, '') ilike '%' || q || '%';

  if has_stage then
    execute $q$
      select coalesce(jsonb_agg(item), '[]'::jsonb)
      from (
        select jsonb_build_object(
          'id', d.id,
          'title', d.title,
          'seller_company_id', d.seller_company_id,
          'seller_company_name', c.name,
          'seller_stage_key', d.seller_stage_key,
          'status', d.status,
          'created_at', d.created_at
        ) as item
        from public.deals d
        left join public.companies c on c.id = d.seller_company_id
        where $1::text is null
          or coalesce(d.title, '') ilike '%' || $1 || '%'
          or coalesce(c.name, '') ilike '%' || $1 || '%'
        order by d.created_at desc
        limit $2 offset $3
      ) listed
    $q$
      into rows
      using q, lim, off;
  else
    select coalesce(jsonb_agg(item), '[]'::jsonb)
      into rows
    from (
      select jsonb_build_object(
        'id', d.id,
        'title', d.title,
        'seller_company_id', d.seller_company_id,
        'seller_company_name', c.name,
        'seller_stage_key', null,
        'status', d.status,
        'created_at', d.created_at
      ) as item
      from public.deals d
      left join public.companies c on c.id = d.seller_company_id
      where q is null
        or coalesce(d.title, '') ilike '%' || q || '%'
        or coalesce(c.name, '') ilike '%' || q || '%'
      order by d.created_at desc
      limit lim offset off
    ) listed;
  end if;

  return jsonb_build_object('total', total, 'limit', lim, 'offset', off, 'rows', rows);
end;
$$;

revoke all on function public.admin_list_deals(text, integer, integer) from public;
grant execute on function public.admin_list_deals(text, integer, integer) to authenticated;

create or replace function public.admin_get_deal(p_deal_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  result jsonb;
  stage text := null;
begin
  perform public.admin_assert_super_admin();
  if p_deal_id is null then
    return null;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'deals'
      and column_name = 'seller_stage_key'
  ) then
    execute 'select seller_stage_key from public.deals where id = $1'
      into stage
      using p_deal_id;
  end if;

  select jsonb_build_object(
    'id', d.id,
    'title', d.title,
    'seller_company_id', d.seller_company_id,
    'seller_company_name', c.name,
    'seller_stage_key', stage,
    'status', d.status,
    'created_at', d.created_at,
    'participant_count', (
      select count(*)::int from public.deal_participants p
      where p.deal_id = d.id
    )
  )
    into result
  from public.deals d
  left join public.companies c on c.id = d.seller_company_id
  where d.id = p_deal_id;

  return result;
end;
$$;

revoke all on function public.admin_get_deal(uuid) from public;
grant execute on function public.admin_get_deal(uuid) to authenticated;

create or replace function public.admin_list_audit_logs(
  p_query text default null,
  p_limit integer default 20,
  p_offset integer default 0
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  lim integer := least(greatest(coalesce(p_limit, 20), 1), 50);
  off integer := greatest(coalesce(p_offset, 0), 0);
  q text := nullif(trim(coalesce(p_query, '')), '');
  total integer := 0;
  rows jsonb := '[]'::jsonb;
begin
  perform public.admin_assert_super_admin();

  select count(*)::int into total
  from public.audit_logs a
  left join public.users u on u.id = a.actor_user_id
  where q is null
    or a.action ilike '%' || q || '%'
    or coalesce(u.email, '') ilike '%' || q || '%';

  select coalesce(jsonb_agg(item), '[]'::jsonb)
    into rows
  from (
    select jsonb_build_object(
      'id', a.id,
      'action', a.action,
      'entity_type', a.entity_type,
      'entity_id', a.entity_id,
      'actor_user_id', a.actor_user_id,
      'actor_email', u.email,
      'created_at', a.created_at
    ) as item
    from public.audit_logs a
    left join public.users u on u.id = a.actor_user_id
    where q is null
      or a.action ilike '%' || q || '%'
      or coalesce(u.email, '') ilike '%' || q || '%'
    order by a.created_at desc
    limit lim offset off
  ) listed;

  return jsonb_build_object('total', total, 'limit', lim, 'offset', off, 'rows', rows);
end;
$$;

revoke all on function public.admin_list_audit_logs(text, integer, integer) from public;
grant execute on function public.admin_list_audit_logs(text, integer, integer) to authenticated;
