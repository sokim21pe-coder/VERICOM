# VERICOM — Agent 작업 가이드

## Source of Truth

- 최상위 기준은 루트 `MASTER_SPEC.md`. 작업 전 관련 절을 읽는다.
- 함께 참고: `docs/DECISIONS.md`, `docs/TOM_ARCHITECTURE.md`, `docs/DEVELOPMENT_AUTOPILOT.md`, `.cursor/rules/*`.
- 충돌 시 시스템/사용자 지시 > `MASTER_SPEC.md` > 기타 문서 순.

## 기본 명령

- 개발 서버: `npm run dev` (http://localhost:3000)
- 린트: `npm run lint`
- 타입체크: `npx tsc --noEmit`
- 빌드: `npm run build`

## 코드/문구 규칙

- 사용자에게 보이는 UI 문구와 답변은 한국어. 디자인은 navy(#002147)/white 유지.
- 명세에 없는 사실은 추측하지 말고 `TODO`/`PLACEHOLDER`/`UNKNOWN`으로 남긴다.
- `.env.local`, service_role, DB password, secret token은 커밋하지 않는다.

## Cursor Cloud specific instructions

### 환경 변수 / Secrets

이 앱은 Supabase anon 키로 동작한다. Cloud Agent VM에는 아래 Secret을 **Secrets 패널**에 등록해야 한다(1회). 등록하면 새 VM 부팅 시 환경변수로 주입된다.

- `NEXT_PUBLIC_SUPABASE_URL` (필수)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (필수)
- `VERICOM_TEST_SEED_PASSWORD` (선택: `0011` seed 계정 로그인용)
- `SUPABASE_SERVICE_ROLE_KEY` (선택: 관리 스크립트 전용, 브라우저/클라이언트 금지)

부팅 시 `.cursor/environment.json`이 `node scripts/cloud-bootstrap-env.mjs`를 실행해 주입된 Secret을 `.env.local`로 기록한다. 그래서 dev 서버와 `scripts/*-e2e.mjs`가 동일 자격으로 Supabase에 연결된다. 유효한 `.env.local`이 이미 있으면 덮어쓰지 않는다. Secret이 없으면 아무것도 쓰지 않고 안내만 출력한다(비파괴).

### 로그인 E2E 실행 (요청 시)

사용자가 "로그인 E2E 실행", "로그인 E2E 돌려줘" 등으로 요청하면 아래 SOP를 수행한다.

1. 사전 조건 확인
   - `.env.local`에 `NEXT_PUBLIC_SUPABASE_URL`/`ANON_KEY`가 있는지 확인. 없으면 `node scripts/cloud-bootstrap-env.mjs` 실행. 그래도 없으면 Secret 미등록이므로 사용자에게 Secret 등록(위 목록)만 1건 요청하고 멈춘다.
   - dev 서버 기동 확인: `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000` → 200. 아니면 `npm run dev`로 기동.
2. 테스트 계정 준비 (seed 비밀번호 불필요)
   - `node scripts/cloud-ensure-test-account.mjs` 실행. 이 프로젝트 Supabase는 가입 자동 확인(auto-confirm)이 켜져 있어 신규 가입 즉시 세션이 생성된다.
   - 출력의 `E2E_EMAIL` / `E2E_PASSWORD`를 로그인 자격으로 사용한다. `E2E_STATUS=created`(신규) 또는 `existing_login`(기존)이면 로그인 가능.
   - `E2E_STATUS=email_confirmation_required`가 나오면 자동 확인이 꺼진 것이므로 seed 계정(`VERICOM_TEST_SEED_PASSWORD` + `scripts/sprint0-seed-auth.mjs` 참고)으로 전환하거나 사용자에게 Auth 자동 확인 설정을 요청한다.
3. 브라우저 로그인 E2E — `computerUse` 서브에이전트 사용 (Chrome 경로: `/opt/google/chrome/chrome`)
   - `http://localhost:3000/signup` 또는 `/login`에서 2번의 자격으로 가입/로그인.
   - 신규 가입이면 `/onboarding/purpose`에서 역할(예: 기업 매각) 선택 → 워크스페이스 진입.
   - 검증 항목: (a) 로그인 성공 후 워크스페이스 진입, (b) 상단 Header의 사용자 Avatar/이름 표시, (c) 좌측 Sidebar 렌더, (d) `/account/profile`에서 이름/연락처 수정 후 저장 → 성공 메시지 → 새로고침 후 값 유지(persistence), (e) 로그아웃 동작.
   - 데모 영상/스크린샷은 `/opt/cursor/artifacts/`에 저장하고 최종 답변에 포함.
4. 헤드리스 스크립트(선택): `puppeteer-core`가 설치되어 있으면 `scripts/auth-continue-e2e.mjs`도 활용 가능(`VERICOM_TEST_SEED_PASSWORD` 필요). 기본 경로는 위 `computerUse` 방식이다.

### 테스트 데이터/보안 제약

- DB 리셋 금지, 기존 Seller/Deal 데이터 삭제·DROP 금지.
- 기존 migration 수정 금지. 신규는 timestamp 파일로만 추가하고, LIVE 적용이 필요하면 어떤 migration인지 먼저 보고한다.
- RLS 완화 금지. 테스트 계정은 `*@vericom.test` 등 식별 가능한 이메일을 사용한다.
- Secret 값은 로그/커밋/PR에 노출하지 않는다.
