-- 일반 사용자는 Seller/Buyer/Expert만 스스로 추가한다.
-- INTERNAL / ADMIN은 SQL(postgres)로만 부여한다.

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
