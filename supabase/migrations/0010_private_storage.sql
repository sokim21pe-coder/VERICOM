-- Sprint 0 Private Storage. 버킷은 Public 해제. Deal/NDA/VDR 공개 규칙은 넣지 않는다.

insert into storage.buckets (id, name, public)
values ('vericom-private', 'vericom-private', false)
on conflict (id) do update
set public = false;

update storage.buckets
set
  file_size_limit = 10485760,
  allowed_mime_types = array['application/pdf', 'image/png', 'image/jpeg', 'text/plain']
where id = 'vericom-private';

create or replace function public.can_access_vericom_private_object(object_name text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  company_text text;
  company uuid;
begin
  if object_name is null or position('/' in object_name) = 0 then
    return false;
  end if;
  if object_name like '%..%' then
    return false;
  end if;
  company_text := split_part(object_name, '/', 1);
  begin
    company := company_text::uuid;
  exception
    when invalid_text_representation then
      return false;
  end;
  return exists (
    select 1
    from public.company_memberships m
    where m.user_id = public.current_app_user_id()
      and m.company_id = company
      and m.status in ('active', 'pending')
  );
end;
$$;

revoke all on function public.can_access_vericom_private_object(text) from public;
grant execute on function public.can_access_vericom_private_object(text) to authenticated;

drop policy if exists vericom_private_select on storage.objects;
create policy vericom_private_select
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'vericom-private'
    and public.can_access_vericom_private_object(name)
  );

drop policy if exists vericom_private_insert on storage.objects;
create policy vericom_private_insert
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'vericom-private'
    and public.can_access_vericom_private_object(name)
  );

drop policy if exists vericom_private_update on storage.objects;
create policy vericom_private_update
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'vericom-private'
    and public.can_access_vericom_private_object(name)
  )
  with check (
    bucket_id = 'vericom-private'
    and public.can_access_vericom_private_object(name)
  );

drop policy if exists vericom_private_delete on storage.objects;
create policy vericom_private_delete
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'vericom-private'
    and public.can_access_vericom_private_object(name)
  );
