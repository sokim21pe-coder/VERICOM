-- 로그인 사용자 TOM 상담을 한 트랜잭션으로 저장한다. 모델 연결은 하지 않는다.

create or replace function public.get_or_create_tom_conversation(p_intent text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid;
  cid uuid;
  conv_id uuid;
  opening text;
begin
  uid := public.current_app_user_id();
  if uid is null then
    raise exception 'not authenticated';
  end if;
  if p_intent not in ('sell', 'buy') then
    raise exception 'invalid intent';
  end if;

  select id into conv_id
  from public.tom_conversations
  where user_id = uid
    and intent = p_intent
    and status = 'active'
  order by created_at desc
  limit 1;

  if conv_id is not null then
    return conv_id;
  end if;

  select company_id into cid
  from public.company_memberships
  where user_id = uid
    and status in ('active', 'pending')
  order by created_at desc
  limit 1;

  insert into public.tom_conversations (user_id, company_id, intent, status)
  values (uid, cid, p_intent, 'active')
  returning id into conv_id;

  if p_intent = 'buy' then
    opening := '어떤 회사를 찾고 계신가요?';
  else
    opening := '회사와 관련해 요즘 가장 고민되는 것이 무엇인가요?';
  end if;

  insert into public.tom_messages (conversation_id, author_role, body)
  values (conv_id, 'tom', opening);

  return conv_id;
end;
$$;

create or replace function public.append_tom_user_message(
  p_conversation_id uuid,
  p_body text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid;
  owned uuid;
begin
  uid := public.current_app_user_id();
  if uid is null then
    raise exception 'not authenticated';
  end if;
  if p_body is null or length(trim(p_body)) = 0 then
    raise exception 'empty message';
  end if;

  select id into owned
  from public.tom_conversations
  where id = p_conversation_id
    and user_id = uid
  limit 1;

  if owned is null then
    raise exception 'forbidden';
  end if;

  insert into public.tom_messages (conversation_id, author_role, body)
  values (p_conversation_id, 'user', trim(p_body));

  insert into public.tom_messages (conversation_id, author_role, body)
  values (
    p_conversation_id,
    'tom',
    '입력은 계정에 저장했습니다. TOM 모델 연결은 후속 단계입니다.'
  );
end;
$$;

revoke all on function public.get_or_create_tom_conversation(text) from public;
grant execute on function public.get_or_create_tom_conversation(text) to authenticated;
revoke all on function public.append_tom_user_message(uuid, text) from public;
grant execute on function public.append_tom_user_message(uuid, text) to authenticated;
