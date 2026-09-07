-- Sprint 2 보안 수정: approved_valuation_benchmarks WRITE를 "배정 Deal의 매각 회사"로 제한.
--
-- 배경(발견된 결함):
--   0016의 INSERT/UPDATE/DELETE 정책은 has_staff_platform_role()만 확인했다.
--   그런데 EXPERT_USER는 onboarding에서 누구나 self-등록할 수 있고, deal_participants는
--   self-배정이 불가(0004에서 select만 grant)하지만 배정 여부를 write 정책이 검사하지 않았다.
--   결과적으로 임의 사용자가 스스로 EXPERT_USER가 된 뒤 anon key + PostgREST로 서버 액션을
--   우회해 아무 회사의 승인 비교배수를 INSERT/UPDATE/DELETE할 수 있었다.
--   이는 MASTER_SPEC "Expert는 assigned scope만" 및 valuation 무결성(승인 배수는 배정된
--   staff만 관리)과 충돌한다. 앱 레이어 canWriteApprovedBenchmarkForAssignedSeller는
--   배정 범위를 강제하지만 DB RLS가 이를 강제하지 않아 우회가 가능했다.
--
-- 수정:
--   staff write(INSERT/UPDATE/DELETE)를 has_staff_platform_role() AND
--   "해당 company_id를 seller_company_id로 하는 deal의 참여자"로 좁힌다.
--   deal_participants는 self-배정이 불가하므로 배정되지 않은 self-expert의 write가 차단된다.
--   SELECT 정책(staff 전체 조회, seller 자기회사 조회)은 변경하지 않는다.
--   계산 결과를 만들지 않으며 default 배수/PLACEHOLDER를 넣지 않는다.

create or replace function public.is_staff_assigned_to_seller_company(target_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_staff_platform_role()
    and exists (
      select 1
      from public.deal_participants dp
      join public.deals d on d.id = dp.deal_id
      where dp.user_id = public.current_app_user_id()
        and d.seller_company_id = target_company_id
    );
$$;

revoke all on function public.is_staff_assigned_to_seller_company(uuid) from public;
grant execute on function public.is_staff_assigned_to_seller_company(uuid) to authenticated;

drop policy if exists approved_benchmarks_insert_staff
  on public.approved_valuation_benchmarks;
create policy approved_benchmarks_insert_staff
  on public.approved_valuation_benchmarks
  for insert to authenticated
  with check (
    public.is_staff_assigned_to_seller_company(company_id)
    and created_by = public.current_app_user_id()
  );

drop policy if exists approved_benchmarks_update_staff
  on public.approved_valuation_benchmarks;
create policy approved_benchmarks_update_staff
  on public.approved_valuation_benchmarks
  for update to authenticated
  using (public.is_staff_assigned_to_seller_company(company_id))
  with check (public.is_staff_assigned_to_seller_company(company_id));

drop policy if exists approved_benchmarks_delete_staff
  on public.approved_valuation_benchmarks;
create policy approved_benchmarks_delete_staff
  on public.approved_valuation_benchmarks
  for delete to authenticated
  using (public.is_staff_assigned_to_seller_company(company_id));

comment on function public.is_staff_assigned_to_seller_company(uuid) is
  'Sprint 2 보안: staff(EXPERT/INTERNAL/ADMIN) 이면서 해당 매각 회사의 배정 Deal 참여자일 때만 승인 비교배수를 write할 수 있다. self-등록 expert의 임의 회사 write를 차단한다.';
