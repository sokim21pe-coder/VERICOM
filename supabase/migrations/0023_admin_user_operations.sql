-- SUPER ADMIN v1.1 사용자 운영.
-- Additive only. 0022 수정 없음. 기존 RLS SELECT 확대 없음.
-- users.status(active/disabled)를 Application SoT로 사용. Auth ban/service_role 없음.
-- 관리자 mutation은 security-definer RPC만. actor는 current_app_user_id().

alter table public.audit_logs
  add column if not exists metadata jsonb;

create or replace function public.users_protect_status()
returns trigger
language plpgsql
as $$
begin
  if new.status is distinct from old.status
     and not public.has_platform_super_admin() then
    raise exception 'not permitted: status'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists users_protect_status on public.users;
create trigger users_protect_status
  before update on public.users
  for each row execute procedure public.users_protect_status();

create or replace function public.admin_write_audit(
  p_action text,
  p_entity_type text,
  p_entity_id uuid,
  p_metadata jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
  values (
    public.current_app_user_id(),
    p_action,
    p_entity_type,
    p_entity_id,
    coalesce(p_metadata, '{}'::jsonb)
  );
end;
$$;

revoke all on function public.admin_write_audit(text, text, uuid, jsonb) from public;

create or replace function public.admin_role_verification_level(p_role text)
returns text
language sql
immutable
as $$
  select case p_role
    when 'SELLER_USER' then 'S1'
    when 'BUYER_USER' then 'B1'
    when 'EXPERT_USER' then 'E0'
    when 'INTERNAL_DEAL_MANAGER' then 'I0'
    when 'ADMIN' then 'A0'
    when 'PLATFORM_SUPER_ADMIN' then 'SA0'
    else 'S1'
  end;
$$;

create or replace function public.admin_active_super_admin_count()
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::int
  from public.users u
  join public.user_platform_roles r on r.user_id = u.id
  where r.platform_role = 'PLATFORM_SUPER_ADMIN'
    and u.status = 'active';
$$;

revoke all on function public.admin_active_super_admin_count() from public;

create or replace function public.admin_normalize_reason(
  p_reason_type text,
  p_reason_detail text
)
returns text
language plpgsql
stable
as $$
declare
  reason_type text := upper(trim(coalesce(p_reason_type, '')));
  reason_detail text := trim(coalesce(p_reason_detail, ''));
begin
  if reason_type not in (
    'SECURITY', 'USER_REQUEST', 'CONTRACT_ENDED', 'TEST_ACCOUNT', 'POLICY', 'OTHER'
  ) then
    raise exception 'ADMIN_REASON_REQUIRED' using errcode = 'P0001';
  end if;
  if char_length(reason_detail) < 1 then
    raise exception 'ADMIN_REASON_REQUIRED' using errcode = 'P0001';
  end if;
  return reason_type;
end;
$$;

create or replace function public.admin_get_platform_roles()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  perform public.admin_assert_super_admin();
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'code', p.code,
      'label_ko', p.label_ko
    ) order by p.code)
    from public.platform_roles p
  ), '[]'::jsonb);
end;
$$;

revoke all on function public.admin_get_platform_roles() from public;
grant execute on function public.admin_get_platform_roles() to authenticated;

create or replace function public.admin_update_user_status(
  p_user_id uuid,
  p_status text,
  p_reason_type text,
  p_reason_detail text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := public.current_app_user_id();
  target public.users%rowtype;
  reason_type text;
  new_status text := trim(coalesce(p_status, ''));
  is_super boolean := false;
begin
  perform public.admin_assert_super_admin();
  reason_type := public.admin_normalize_reason(p_reason_type, p_reason_detail);

  if new_status not in ('active', 'disabled') then
    raise exception 'ADMIN_INVALID_STATUS' using errcode = 'P0001';
  end if;
  if p_user_id is null then
    raise exception 'ADMIN_USER_NOT_FOUND' using errcode = 'P0001';
  end if;

  select * into target from public.users where id = p_user_id;
  if target.id is null then
    raise exception 'ADMIN_USER_NOT_FOUND' using errcode = 'P0001';
  end if;

  if target.status = new_status then
    if new_status = 'disabled' then
      raise exception 'ADMIN_ALREADY_DISABLED' using errcode = 'P0001';
    end if;
    raise exception 'ADMIN_ALREADY_ACTIVE' using errcode = 'P0001';
  end if;

  if new_status = 'disabled' then
    if actor is not null and actor = target.id then
      raise exception 'ADMIN_SELF_DISABLE' using errcode = 'P0001';
    end if;
    select exists (
      select 1 from public.user_platform_roles
      where user_id = target.id and platform_role = 'PLATFORM_SUPER_ADMIN'
    ) into is_super;
    if is_super and public.admin_active_super_admin_count() <= 1 then
      raise exception 'ADMIN_LAST_SUPER_ADMIN' using errcode = 'P0001';
    end if;
  end if;

  update public.users
    set status = new_status
    where id = target.id;

  perform public.admin_write_audit(
    case when new_status = 'disabled' then 'ADMIN_USER_DISABLED' else 'ADMIN_USER_ENABLED' end,
    'user',
    target.id,
    jsonb_build_object(
      'target_user_id', target.id,
      'target_email', target.email,
      'reason_type', reason_type,
      'reason_detail', trim(p_reason_detail),
      'previous_status', target.status,
      'new_status', new_status
    )
  );

  return jsonb_build_object(
    'ok', true,
    'id', target.id,
    'status', new_status
  );
end;
$$;

revoke all on function public.admin_update_user_status(uuid, text, text, text) from public;
grant execute on function public.admin_update_user_status(uuid, text, text, text) to authenticated;

create or replace function public.admin_add_platform_role(
  p_user_id uuid,
  p_role text,
  p_reason_type text,
  p_reason_detail text,
  p_confirm text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := public.current_app_user_id();
  target public.users%rowtype;
  reason_type text;
  role_code text := trim(coalesce(p_role, ''));
  already boolean := false;
begin
  perform public.admin_assert_super_admin();
  reason_type := public.admin_normalize_reason(p_reason_type, p_reason_detail);

  if p_user_id is null then
    raise exception 'ADMIN_USER_NOT_FOUND' using errcode = 'P0001';
  end if;
  if not exists (select 1 from public.platform_roles where code = role_code) then
    raise exception 'ADMIN_INVALID_ROLE' using errcode = 'P0001';
  end if;

  select * into target from public.users where id = p_user_id;
  if target.id is null then
    raise exception 'ADMIN_USER_NOT_FOUND' using errcode = 'P0001';
  end if;

  if role_code = 'PLATFORM_SUPER_ADMIN'
     and trim(coalesce(p_confirm, '')) is distinct from 'SUPER ADMIN 권한 부여' then
    raise exception 'ADMIN_CONFIRM_REQUIRED' using errcode = 'P0001';
  end if;

  select exists (
    select 1 from public.user_platform_roles
    where user_id = target.id and platform_role = role_code
  ) into already;
  if already then
    raise exception 'ADMIN_ALREADY_HAS_ROLE' using errcode = 'P0001';
  end if;

  insert into public.user_platform_roles (user_id, platform_role, verification_level)
  values (target.id, role_code, public.admin_role_verification_level(role_code));

  perform public.admin_write_audit(
    'ADMIN_PLATFORM_ROLE_ADDED',
    'user_platform_roles',
    target.id,
    jsonb_build_object(
      'target_user_id', target.id,
      'target_email', target.email,
      'reason_type', reason_type,
      'reason_detail', trim(p_reason_detail),
      'role', role_code,
      'actor_user_id', actor
    )
  );

  return jsonb_build_object('ok', true, 'id', target.id, 'role', role_code);
end;
$$;

revoke all on function public.admin_add_platform_role(uuid, text, text, text, text) from public;
grant execute on function public.admin_add_platform_role(uuid, text, text, text, text) to authenticated;

create or replace function public.admin_remove_platform_role(
  p_user_id uuid,
  p_role text,
  p_reason_type text,
  p_reason_detail text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := public.current_app_user_id();
  target public.users%rowtype;
  reason_type text;
  role_code text := trim(coalesce(p_role, ''));
  owned boolean := false;
begin
  perform public.admin_assert_super_admin();
  reason_type := public.admin_normalize_reason(p_reason_type, p_reason_detail);

  if p_user_id is null then
    raise exception 'ADMIN_USER_NOT_FOUND' using errcode = 'P0001';
  end if;
  if not exists (select 1 from public.platform_roles where code = role_code) then
    raise exception 'ADMIN_INVALID_ROLE' using errcode = 'P0001';
  end if;

  select * into target from public.users where id = p_user_id;
  if target.id is null then
    raise exception 'ADMIN_USER_NOT_FOUND' using errcode = 'P0001';
  end if;

  select exists (
    select 1 from public.user_platform_roles
    where user_id = target.id and platform_role = role_code
  ) into owned;
  if not owned then
    raise exception 'ADMIN_ROLE_NOT_FOUND' using errcode = 'P0001';
  end if;

  if role_code = 'PLATFORM_SUPER_ADMIN' then
    if actor is not null and actor = target.id then
      raise exception 'ADMIN_SELF_REMOVE_SUPER' using errcode = 'P0001';
    end if;
    if target.status = 'active' and public.admin_active_super_admin_count() <= 1 then
      raise exception 'ADMIN_LAST_SUPER_ADMIN' using errcode = 'P0001';
    end if;
  end if;

  delete from public.user_platform_roles
  where user_id = target.id and platform_role = role_code;

  perform public.admin_write_audit(
    'ADMIN_PLATFORM_ROLE_REMOVED',
    'user_platform_roles',
    target.id,
    jsonb_build_object(
      'target_user_id', target.id,
      'target_email', target.email,
      'reason_type', reason_type,
      'reason_detail', trim(p_reason_detail),
      'role', role_code,
      'actor_user_id', actor
    )
  );

  return jsonb_build_object('ok', true, 'id', target.id, 'role', role_code);
end;
$$;

revoke all on function public.admin_remove_platform_role(uuid, text, text, text) from public;
grant execute on function public.admin_remove_platform_role(uuid, text, text, text) to authenticated;

drop function if exists public.admin_list_users(text, text, integer, integer);

create or replace function public.admin_list_users(
  p_query text default null,
  p_status text default null,
  p_role text default null,
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
  role_code text := nullif(trim(coalesce(p_role, '')), '');
  total integer := 0;
  rows jsonb := '[]'::jsonb;
begin
  perform public.admin_assert_super_admin();

  if role_code is not null
     and not exists (select 1 from public.platform_roles where code = role_code) then
    raise exception 'ADMIN_INVALID_ROLE' using errcode = 'P0001';
  end if;

  select count(*)::int into total
  from public.users u
  where (q is null or u.email ilike '%' || q || '%' or u.display_name ilike '%' || q || '%')
    and (st is null or u.status = st)
    and (
      role_code is null or exists (
        select 1 from public.user_platform_roles r
        where r.user_id = u.id and r.platform_role = role_code
      )
    );

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
      and (
        role_code is null or exists (
          select 1 from public.user_platform_roles r
          where r.user_id = u.id and r.platform_role = role_code
        )
      )
    order by u.created_at desc
    limit lim offset off
  ) listed;

  return jsonb_build_object('total', total, 'limit', lim, 'offset', off, 'rows', rows);
end;
$$;

revoke all on function public.admin_list_users(text, text, text, integer, integer) from public;
grant execute on function public.admin_list_users(text, text, text, integer, integer) to authenticated;

create or replace function public.admin_get_user(p_user_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  result jsonb;
  last_login timestamptz := null;
begin
  perform public.admin_assert_super_admin();
  if p_user_id is null then
    return null;
  end if;

  begin
    select au.last_sign_in_at into last_login
    from public.users u
    join auth.users au on au.id = u.auth_user_id
    where u.id = p_user_id;
  exception
    when others then
      last_login := null;
  end;

  select jsonb_build_object(
    'id', u.id,
    'email', u.email,
    'display_name', u.display_name,
    'status', u.status,
    'created_at', u.created_at,
    'auth_user_id', u.auth_user_id,
    'auth_linked', u.auth_user_id is not null,
    'last_sign_in_at', last_login,
    'active_super_admin_count', public.admin_active_super_admin_count(),
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
    ), '[]'::jsonb),
    'recent_audit', coalesce((
      select jsonb_agg(item)
      from (
        select jsonb_build_object(
          'id', a.id,
          'action', a.action,
          'actor_user_id', a.actor_user_id,
          'actor_email', actor.email,
          'entity_type', a.entity_type,
          'entity_id', a.entity_id,
          'metadata', a.metadata,
          'created_at', a.created_at
        ) as item
        from public.audit_logs a
        left join public.users actor on actor.id = a.actor_user_id
        where a.entity_id = u.id
           or coalesce(a.metadata->>'target_user_id', '') = u.id::text
        order by a.created_at desc
        limit 10
      ) recent
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
      'metadata', a.metadata,
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
