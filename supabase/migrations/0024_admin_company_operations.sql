-- SUPER ADMIN v1.2 Company 운영.
-- Additive only. 0022/0023 수정 없음. 기존 RLS SELECT 확대 없음.
-- companies는 중립 객체. Seller/Buyer Type 컬럼 추가 없음.
-- verification_status / company_status는 0002 기존 값만 사용.
-- Membership mutation은 마지막 OWNER 위험으로 v1.2에서 하지 않는다.

drop function if exists public.admin_list_companies(text, integer, integer);

create or replace function public.admin_list_companies(
  p_query text default null,
  p_verification text default null,
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
  ver text := nullif(trim(coalesce(p_verification, '')), '');
  total integer := 0;
  rows jsonb := '[]'::jsonb;
begin
  perform public.admin_assert_super_admin();

  if ver is not null and ver not in ('unverified', 'pending', 'verified') then
    raise exception 'ADMIN_INVALID_VERIFICATION' using errcode = 'P0001';
  end if;

  select count(*)::int into total
  from public.companies c
  where (ver is null or c.verification_status = ver)
    and (
      q is null
      or c.name ilike '%' || q || '%'
      or coalesce(c.legal_name, '') ilike '%' || q || '%'
      or coalesce(c.business_registration_number, '') ilike '%' || q || '%'
    );

  select coalesce(jsonb_agg(item), '[]'::jsonb)
    into rows
  from (
    select jsonb_build_object(
      'id', c.id,
      'name', c.name,
      'legal_name', c.legal_name,
      'business_registration_number', c.business_registration_number,
      'company_status', c.company_status,
      'verification_status', c.verification_status,
      'created_at', c.created_at,
      'last_activity_at', greatest(
        c.updated_at,
        (
          select max(m.updated_at) from public.company_memberships m
          where m.company_id = c.id
        ),
        (
          select max(d.updated_at) from public.deals d
          where d.seller_company_id = c.id
        )
      ),
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
    where (ver is null or c.verification_status = ver)
      and (
        q is null
        or c.name ilike '%' || q || '%'
        or coalesce(c.legal_name, '') ilike '%' || q || '%'
        or coalesce(c.business_registration_number, '') ilike '%' || q || '%'
      )
    order by c.created_at desc
    limit lim offset off
  ) listed;

  return jsonb_build_object('total', total, 'limit', lim, 'offset', off, 'rows', rows);
end;
$$;

revoke all on function public.admin_list_companies(text, text, integer, integer) from public;
grant execute on function public.admin_list_companies(text, text, integer, integer) to authenticated;

create or replace function public.admin_get_company(p_company_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  result jsonb;
  has_stage boolean := false;
begin
  perform public.admin_assert_super_admin();
  if p_company_id is null then
    return null;
  end if;

  has_stage := exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'deals'
      and column_name = 'seller_stage_key'
  );

  select jsonb_build_object(
    'id', c.id,
    'name', c.name,
    'legal_name', c.legal_name,
    'business_registration_number', c.business_registration_number,
    'website', c.website,
    'industry', c.industry,
    'company_status', c.company_status,
    'verification_status', c.verification_status,
    'created_at', c.created_at,
    'updated_at', c.updated_at,
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
        'email', u.email,
        'membership_role', m.membership_role,
        'status', m.status
      ) order by m.created_at)
      from public.company_memberships m
      join public.users u on u.id = m.user_id
      where m.company_id = c.id
    ), '[]'::jsonb),
    'deals', case
      when has_stage then (
        select coalesce(jsonb_agg(item), '[]'::jsonb)
        from (
          select jsonb_build_object(
            'id', d.id,
            'title', d.title,
            'seller_stage_key', d.seller_stage_key,
            'status', d.status,
            'created_at', d.created_at
          ) as item
          from public.deals d
          where d.seller_company_id = c.id
          order by d.created_at desc
          limit 20
        ) listed
      )
      else (
        select coalesce(jsonb_agg(item), '[]'::jsonb)
        from (
          select jsonb_build_object(
            'id', d.id,
            'title', d.title,
            'seller_stage_key', null,
            'status', d.status,
            'created_at', d.created_at
          ) as item
          from public.deals d
          where d.seller_company_id = c.id
          order by d.created_at desc
          limit 20
        ) listed
      )
    end,
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
        where a.entity_id = c.id
           or coalesce(a.metadata->>'target_company_id', '') = c.id::text
        order by a.created_at desc
        limit 10
      ) recent
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

create or replace function public.admin_update_company_verification(
  p_company_id uuid,
  p_verification text,
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
  target public.companies%rowtype;
  reason_type text;
  new_status text := trim(coalesce(p_verification, ''));
begin
  perform public.admin_assert_super_admin();
  reason_type := public.admin_normalize_reason(p_reason_type, p_reason_detail);

  if new_status not in ('unverified', 'pending', 'verified') then
    raise exception 'ADMIN_INVALID_VERIFICATION' using errcode = 'P0001';
  end if;
  if p_company_id is null then
    raise exception 'ADMIN_COMPANY_NOT_FOUND' using errcode = 'P0001';
  end if;

  select * into target from public.companies where id = p_company_id;
  if target.id is null then
    raise exception 'ADMIN_COMPANY_NOT_FOUND' using errcode = 'P0001';
  end if;
  if target.verification_status = new_status then
    raise exception 'ADMIN_VERIFICATION_UNCHANGED' using errcode = 'P0001';
  end if;

  update public.companies
    set verification_status = new_status
    where id = target.id;

  perform public.admin_write_audit(
    'ADMIN_COMPANY_VERIFICATION_CHANGED',
    'company',
    target.id,
    jsonb_build_object(
      'target_company_id', target.id,
      'target_company_name', target.name,
      'reason_type', reason_type,
      'reason_detail', trim(p_reason_detail),
      'previous_value', target.verification_status,
      'new_value', new_status,
      'actor_user_id', actor
    )
  );

  return jsonb_build_object('ok', true, 'id', target.id, 'verification_status', new_status);
end;
$$;

revoke all on function public.admin_update_company_verification(uuid, text, text, text) from public;
grant execute on function public.admin_update_company_verification(uuid, text, text, text) to authenticated;

create or replace function public.admin_update_company_status(
  p_company_id uuid,
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
  target public.companies%rowtype;
  reason_type text;
  new_status text := trim(coalesce(p_status, ''));
begin
  perform public.admin_assert_super_admin();
  reason_type := public.admin_normalize_reason(p_reason_type, p_reason_detail);

  if new_status not in ('draft', 'active', 'inactive') then
    raise exception 'ADMIN_INVALID_COMPANY_STATUS' using errcode = 'P0001';
  end if;
  if p_company_id is null then
    raise exception 'ADMIN_COMPANY_NOT_FOUND' using errcode = 'P0001';
  end if;

  select * into target from public.companies where id = p_company_id;
  if target.id is null then
    raise exception 'ADMIN_COMPANY_NOT_FOUND' using errcode = 'P0001';
  end if;
  if target.company_status = new_status then
    raise exception 'ADMIN_STATUS_UNCHANGED' using errcode = 'P0001';
  end if;

  update public.companies
    set company_status = new_status
    where id = target.id;

  perform public.admin_write_audit(
    'ADMIN_COMPANY_STATUS_CHANGED',
    'company',
    target.id,
    jsonb_build_object(
      'target_company_id', target.id,
      'target_company_name', target.name,
      'reason_type', reason_type,
      'reason_detail', trim(p_reason_detail),
      'previous_value', target.company_status,
      'new_value', new_status,
      'actor_user_id', actor
    )
  );

  return jsonb_build_object('ok', true, 'id', target.id, 'company_status', new_status);
end;
$$;

revoke all on function public.admin_update_company_status(uuid, text, text, text) from public;
grant execute on function public.admin_update_company_status(uuid, text, text, text) to authenticated;
