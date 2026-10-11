-- Super Admin Control Tower — additive read RPCs.
-- 기존 0022/0023/0024 파일·RLS·Auth·Seller/TOM/Teaser 데이터를 변경·삭제하지 않는다.
-- TOM 메시지 본문, Teaser content, Valuation provenance/계산식, Company Type은 반환하지 않는다.
-- Investor / Workflow / VDR schema는 만들지 않는다.

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
  roles_json jsonb := '{}'::jsonb;
  recent_users_json jsonb := '[]'::jsonb;
  recent_deals_json jsonb := '[]'::jsonb;
  recent_admin_json jsonb := '[]'::jsonb;
  tom_total int := 0;
  tom_active int := 0;
  valuation_count int := 0;
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

  select coalesce(jsonb_object_agg(k, c), '{}'::jsonb)
    into roles_json
  from (
    select platform_role::text as k, count(*)::int as c
    from public.user_platform_roles
    group by 1
  ) r;

  if to_regclass('public.tom_conversations') is not null then
    select count(*)::int into tom_total from public.tom_conversations;
    select count(*)::int into tom_active
      from public.tom_conversations
      where status = 'active';
  end if;

  if to_regclass('public.approved_valuation_benchmarks') is not null then
    select count(*)::int into valuation_count
      from public.approved_valuation_benchmarks;
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', u.id,
        'display_name', u.display_name,
        'email', u.email,
        'created_at', u.created_at
      )
      order by u.created_at desc
    ),
    '[]'::jsonb
  )
    into recent_users_json
  from (
    select id, display_name, email, created_at
    from public.users
    order by created_at desc
    limit 5
  ) u;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', d.id,
        'title', d.title,
        'seller_stage_key', d.seller_stage_key,
        'created_at', d.created_at
      )
      order by d.created_at desc
    ),
    '[]'::jsonb
  )
    into recent_deals_json
  from (
    select id, title, seller_stage_key, created_at
    from public.deals
    order by created_at desc
    limit 5
  ) d;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', a.id,
        'action', a.action,
        'entity_type', a.entity_type,
        'created_at', a.created_at,
        'actor_email', u.email
      )
      order by a.created_at desc
    ),
    '[]'::jsonb
  )
    into recent_admin_json
  from (
    select id, action, entity_type, created_at, actor_user_id
    from public.audit_logs
    where action like 'ADMIN_%'
    order by created_at desc
    limit 5
  ) a
  left join public.users u on u.id = a.actor_user_id;

  return jsonb_build_object(
    'total_users', (select count(*)::int from public.users),
    'active_users', (select count(*)::int from public.users where status = 'active'),
    'total_companies', (select count(*)::int from public.companies),
    'total_deals', (select count(*)::int from public.deals),
    'deals_by_seller_stage', stages_json,
    'teasers_by_status', teasers_json,
    'users_by_role', roles_json,
    'tom_conversations', tom_total,
    'tom_active', tom_active,
    'valuation_benchmarks', valuation_count,
    'recent_users', recent_users_json,
    'recent_deals', recent_deals_json,
    'recent_admin_actions', recent_admin_json
  );
end;
$$;

revoke all on function public.admin_dashboard_kpis() from public;
grant execute on function public.admin_dashboard_kpis() to authenticated;

create or replace function public.admin_search(p_query text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  q text := trim(coalesce(p_query, ''));
  users_json jsonb := '[]'::jsonb;
  companies_json jsonb := '[]'::jsonb;
  deals_json jsonb := '[]'::jsonb;
begin
  perform public.admin_assert_super_admin();

  if char_length(q) < 2 then
    return jsonb_build_object(
      'users', users_json,
      'companies', companies_json,
      'deals', deals_json
    );
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', u.id,
        'display_name', u.display_name,
        'email', u.email,
        'status', u.status
      )
      order by u.created_at desc
    ),
    '[]'::jsonb
  )
    into users_json
  from (
    select id, display_name, email, status, created_at
    from public.users
    where display_name ilike '%' || q || '%'
       or email ilike '%' || q || '%'
    order by created_at desc
    limit 5
  ) u;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', c.id,
        'name', c.name,
        'verification_status', c.verification_status
      )
      order by c.created_at desc
    ),
    '[]'::jsonb
  )
    into companies_json
  from (
    select id, name, verification_status, created_at
    from public.companies
    where name ilike '%' || q || '%'
       or coalesce(legal_name, '') ilike '%' || q || '%'
       or coalesce(business_registration_number, '') ilike '%' || q || '%'
    order by created_at desc
    limit 5
  ) c;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', d.id,
        'title', d.title,
        'seller_stage_key', d.seller_stage_key
      )
      order by d.created_at desc
    ),
    '[]'::jsonb
  )
    into deals_json
  from (
    select id, title, seller_stage_key, created_at
    from public.deals
    where coalesce(title, '') ilike '%' || q || '%'
    order by created_at desc
    limit 5
  ) d;

  return jsonb_build_object(
    'users', users_json,
    'companies', companies_json,
    'deals', deals_json
  );
end;
$$;

revoke all on function public.admin_search(text) from public;
grant execute on function public.admin_search(text) to authenticated;

create or replace function public.admin_list_teasers(
  p_status text default null,
  p_limit int default 20,
  p_offset int default 0
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  lim int := greatest(1, least(coalesce(p_limit, 20), 50));
  off int := greatest(0, coalesce(p_offset, 0));
  total_count int := 0;
  rows_json jsonb := '[]'::jsonb;
begin
  perform public.admin_assert_super_admin();

  if to_regclass('public.teasers') is null then
    return jsonb_build_object('total', 0, 'limit', lim, 'offset', off, 'rows', '[]'::jsonb);
  end if;

  if p_status is not null
     and p_status not in ('DRAFT', 'IN_REVIEW', 'APPROVED') then
    raise exception 'ADMIN_INVALID_TEASER_STATUS';
  end if;

  select count(*)::int into total_count
  from public.teasers t
  where p_status is null or t.status = p_status;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', x.id,
        'company_id', x.company_id,
        'company_name', x.company_name,
        'deal_id', x.deal_id,
        'status', x.status,
        'current_version', x.current_version,
        'approved_version', x.approved_version,
        'identity_masked', x.identity_masked,
        'masked_descriptor', x.masked_descriptor,
        'headline', x.headline,
        'created_at', x.created_at
      )
      order by x.created_at desc
    ),
    '[]'::jsonb
  )
    into rows_json
  from (
    select
      t.id,
      t.company_id,
      c.name as company_name,
      t.deal_id,
      t.status,
      t.current_version,
      t.approved_version,
      t.identity_masked,
      t.masked_descriptor,
      t.headline,
      t.created_at
    from public.teasers t
    join public.companies c on c.id = t.company_id
    where p_status is null or t.status = p_status
    order by t.created_at desc
    limit lim offset off
  ) x;

  return jsonb_build_object(
    'total', total_count,
    'limit', lim,
    'offset', off,
    'rows', rows_json
  );
end;
$$;

revoke all on function public.admin_list_teasers(text, int, int) from public;
grant execute on function public.admin_list_teasers(text, int, int) to authenticated;

create or replace function public.admin_list_tom_conversations(
  p_intent text default null,
  p_status text default null,
  p_limit int default 20,
  p_offset int default 0
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  lim int := greatest(1, least(coalesce(p_limit, 20), 50));
  off int := greatest(0, coalesce(p_offset, 0));
  total_count int := 0;
  rows_json jsonb := '[]'::jsonb;
begin
  perform public.admin_assert_super_admin();

  if to_regclass('public.tom_conversations') is null then
    return jsonb_build_object('total', 0, 'limit', lim, 'offset', off, 'rows', '[]'::jsonb);
  end if;

  if p_intent is not null and p_intent not in ('sell', 'buy') then
    raise exception 'ADMIN_INVALID_TOM_INTENT';
  end if;
  if p_status is not null and p_status not in ('active', 'archived') then
    raise exception 'ADMIN_INVALID_TOM_STATUS';
  end if;

  select count(*)::int into total_count
  from public.tom_conversations c
  where (p_intent is null or c.intent = p_intent)
    and (p_status is null or c.status = p_status);

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', x.id,
        'user_id', x.user_id,
        'display_name', x.display_name,
        'email', x.email,
        'company_id', x.company_id,
        'company_name', x.company_name,
        'deal_id', x.deal_id,
        'intent', x.intent,
        'status', x.status,
        'created_at', x.created_at,
        'last_message_at', x.last_message_at,
        'message_count', x.message_count
      )
      order by x.created_at desc
    ),
    '[]'::jsonb
  )
    into rows_json
  from (
    select
      c.id,
      c.user_id,
      u.display_name,
      u.email,
      c.company_id,
      co.name as company_name,
      c.deal_id,
      c.intent,
      c.status,
      c.created_at,
      (
        select max(m.created_at)
        from public.tom_messages m
        where m.conversation_id = c.id
      ) as last_message_at,
      (
        select count(*)::int
        from public.tom_messages m
        where m.conversation_id = c.id
      ) as message_count
    from public.tom_conversations c
    join public.users u on u.id = c.user_id
    left join public.companies co on co.id = c.company_id
    where (p_intent is null or c.intent = p_intent)
      and (p_status is null or c.status = p_status)
    order by c.created_at desc
    limit lim offset off
  ) x;

  return jsonb_build_object(
    'total', total_count,
    'limit', lim,
    'offset', off,
    'rows', rows_json
  );
end;
$$;

revoke all on function public.admin_list_tom_conversations(text, text, int, int) from public;
grant execute on function public.admin_list_tom_conversations(text, text, int, int) to authenticated;

create or replace function public.admin_list_valuation_benchmarks(
  p_status text default null,
  p_limit int default 20,
  p_offset int default 0
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  lim int := greatest(1, least(coalesce(p_limit, 20), 50));
  off int := greatest(0, coalesce(p_offset, 0));
  total_count int := 0;
  rows_json jsonb := '[]'::jsonb;
begin
  perform public.admin_assert_super_admin();

  if to_regclass('public.approved_valuation_benchmarks') is null then
    return jsonb_build_object('total', 0, 'limit', lim, 'offset', off, 'rows', '[]'::jsonb);
  end if;

  if p_status is not null
     and p_status not in ('APPROVED', 'TEST_ONLY', 'UNVERIFIED') then
    raise exception 'ADMIN_INVALID_VALUATION_STATUS';
  end if;

  select count(*)::int into total_count
  from public.approved_valuation_benchmarks b
  where p_status is null or b.approval_status = p_status;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', x.id,
        'company_id', x.company_id,
        'company_name', x.company_name,
        'deal_id', x.deal_id,
        'method', x.method,
        'source', x.source,
        'source_type', x.source_type,
        'as_of_date', x.as_of_date,
        'industry', x.industry,
        'confidence', x.confidence,
        'approval_status', x.approval_status,
        'created_at', x.created_at
      )
      order by x.created_at desc
    ),
    '[]'::jsonb
  )
    into rows_json
  from (
    select
      b.id,
      b.company_id,
      c.name as company_name,
      b.deal_id,
      b.method,
      b.source,
      b.source_type,
      b.as_of_date,
      b.industry,
      b.confidence,
      b.approval_status,
      b.created_at
    from public.approved_valuation_benchmarks b
    join public.companies c on c.id = b.company_id
    where p_status is null or b.approval_status = p_status
    order by b.created_at desc
    limit lim offset off
  ) x;

  return jsonb_build_object(
    'total', total_count,
    'limit', lim,
    'offset', off,
    'rows', rows_json
  );
end;
$$;

revoke all on function public.admin_list_valuation_benchmarks(text, int, int) from public;
grant execute on function public.admin_list_valuation_benchmarks(text, int, int) to authenticated;
