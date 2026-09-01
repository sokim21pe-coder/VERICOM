-- Sprint 2 LEVEL 1: approved_valuation_benchmarks에 EV_EBITDA method를 허용한다.
-- 0008 / 0009 leftover와 PLACEHOLDER valuations는 적용하지 않는다.
-- 기본 배수·TEST_ONLY production INSERT는 넣지 않는다.

alter table public.approved_valuation_benchmarks
  drop constraint if exists approved_valuation_benchmarks_method_check;

alter table public.approved_valuation_benchmarks
  add constraint approved_valuation_benchmarks_method_check
  check (method in ('EV_SALES', 'EV_EBITDA'));

comment on table public.approved_valuation_benchmarks is
  'LEVEL 0 EV/Sales·LEVEL 1 EV/EBITDA 승인 비교배수. 계산 결과 테이블이 아니다. default 배수/PLACEHOLDER 없음.';
