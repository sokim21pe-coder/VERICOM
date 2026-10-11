-- SUPER ADMIN v1.2 Company Management.
-- Additive operational layer. No permanent Seller/Buyer company type.
-- Existing RLS SELECT policies remain narrow; admin access stays behind security-definer RPCs.

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
  verification_filter text := nullif(trim(coalesce(p_verification, '')), '');
  total integer := 0;
  rows jsonb := '[]'::jsonb;
begin
  perform public.admin_assert_super_admin();

  if verification_filter is not null
     and verification_filter not in ('unverified', 'pending', 'verified') then
    raise exception 'ADMIN_INVALID_COMPANY_VERIFICATION' using errcode = 'P0001';
  end if;

  select count(*)::int into total
  from public.companies c
  where (
      q is null
      or c.name ilike '%' || q || '%'
      or coalesce(c.legal_name, '') ilike '%' || q || '%'
      or coalesce(c.business_registration_number, '') ilike '%' || q || '%'
    )
    and (verification_filter is null or c.verification_status = verification_filter);

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
      'updated_at', c.updated_at,
      'member_count', (
        select count(*)::int
        from public.company_memberships m
        where m.company_id = c.id and m.status = 'active'
      ),
      'deal_count', (
        select count(*)::int
        from public.deals d
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
      ),
      'last_activity_at', greatest(
        c.updated_at,
        coalesce((select max(m.updated_at) from public.company_memberships m where m.company_id = c.id), c.updated_at),
        coalesce((select max(d.updated_at) from public.deals d where d.seller_company_id = c.id), c.updated_at)
      )
    ) as item
    from public.companies c
    where (
        q is null
        or c.name ilike '%' || q || '%'
        or coalesce(c.legal_name, '') ilike '%' || q || '%'
        or coalesce(c.business_registration_number, '') ilike '%' || q || '%'
      )
      and (verification_filter is null or c.verification_status = verification_filter)
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
begin
  perform public.admin_assert_super_admin();
  if p_company_id is null then
    return null;
  end if;

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
        'membership_id', m.id,
        'user_id', u.id,
        'display_name', u.display_name,
        'email', u.email,
        'membership_role', m.membership_role,
        'status', m.status,
        'verification_status', m.verification_status,
        'created_at', m.created_at
      ) order by m.created_at)
      from public.company_memberships m
      join public.users u on u.id = m.user_id
      where m.company_id = c.id
    ), '[]'::jsonb),
    'deals', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', d.id,
        'title', d.title,
        'status', d.status,
        'seller_stage_key', d.seller_stage_key,
        'created_at', d.created_at,
        'updated_at', d.updated_at
      ) order by d.created_at desc)
      from public.deals d
      where d.seller_company_id = c.id
    ), '[]'::jsonb),
    'recent_audit', coalesce((
      select jsonb_agg(item)
      from (
        select jsonb_build_object(
          'id', a.id,
          'action', a.action,
          'actor_user_id', a.actor_user_id,
          'actor_email', u.email,
          'entity_type', a.entity_type,
          'entity_id', a.entity_id,
          'metadata', a.metadata,
          'created_at', a.created_at
        ) as item
        from public.audit_logs a
        left join public.users u on u.id = a.actor_user_id
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
  p_verification_status text,
  p_reason_type text,
  p_reason_detail text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  target public.companies%rowtype;
  new_status text := trim(coalesce(p_verification_status, ''));
  reason_type text;
begin
  perform public.admin_assert_super_admin();
  reason_type := public.admin_normalize_reason(p_reason_type, p_reason_detail);

  if new_status not in ('unverified', 'pending', 'verified') then
    raise exception 'ADMIN_INVALID_COMPANY_VERIFICATION' using errcode = 'P0001';
  end if;

  select * into target from public.companies where id = p_company_id;
  if target.id is null then
    raise exception 'ADMIN_COMPANY_NOT_FOUND' using errcode = 'P0001';
  end if;

  if target.verification_status = new_status then
    raise exception 'ADMIN_COMPANY_VERIFICATION_UNCHANGED' using errcode = 'P0001';
  end if;

  update public.companies
  set verification_status = new_status,
      updated_at = now()
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
      'previous_verification_status', target.verification_status,
      'new_verification_status', new_status
    )
  );

  return jsonb_build_object('ok', true, 'id', target.id, 'verification_status', new_status);
end;
$$;

revoke all on function public.admin_update_company_verification(uuid, text, text, text) from public;
grant execute on function public.admin_update_company_verification(uuid, text, text, text) to authenticated;

create or replace function public.admin_update_company_status(
  p_company_id uuid,
  p_company_status text,
  p_reason_type text,
  p_reason_detail text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  target public.companies%rowtype;
  new_status text := trim(coalesce(p_company_status, ''));
  reason_type text;
begin
  perform public.admin_assert_super_admin();
  reason_type := public.admin_normalize_reason(p_reason_type, p_reason_detail);

  if new_status not in ('draft', 'active', 'inactive') then
    raise exception 'ADMIN_INVALID_COMPANY_STATUS' using errcode = 'P0001';
  end if;

  select * into target from public.companies where id = p_company_id;
  if target.id is null then
    raise exception 'ADMIN_COMPANY_NOT_FOUND' using errcode = 'P0001';
  end if;

  if target.company_status = new_status then
    raise exception 'ADMIN_COMPANY_STATUS_UNCHANGED' using errcode = 'P0001';
  end if;

  update public.companies
  set company_status = new_status,
      updated_at = now()
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
      'previous_company_status', target.company_status,
      'new_company_status', new_status
    )
  );

  return jsonb_build_object('ok', true, 'id', target.id, 'company_status', new_status);
end;
$$;

revoke all on function public.admin_update_company_status(uuid, text, text, text) from public;
grant execute on function public.admin_update_company_status(uuid, text, text, text) to authenticated;
