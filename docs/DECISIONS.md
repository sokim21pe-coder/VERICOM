# 2026-08-25

Sprint 0 기초: 명세 29절 권장 폴더 구조를 만들고 Supabase 클라이언트 뼈대와 로그인·회원가입 화면 틀을 추가했다. 실제 Auth 연동·RLS·테이블 CREATE는 프로젝트 URL/키가 준비된 뒤 진행한다. Business Rule은 변경하지 않았다.

로그인 경로는 `app/(auth)/login`만 사용한다 (`/login`). 빈 `app/login` 폴더는 `/login` 충돌을 일으켜 제거한다. `/auth/login`은 `/login`으로 리다이렉트한다.

2026-08-25 Phase 1: Seller 워크스페이스에 표준 M&A 10단계 Macro Process UI를 추가했다. 기존 Deal Stage / Opportunity Stage는 유지한다. 데이터는 PLACEHOLDER이며 Auth·Audit·문서 연동은 TODO이다.

2026-08-25 Phase 1 Auth: Supabase Identity Core(users/persons/companies/memberships/platform roles)와 회원가입·로그인·이용목적·회사연결·Workspace 진입을 연결했다. Valuation/NDA/IM/DD 및 TOM 모델 연결은 하지 않았다.

2026-08-25 S01 UX: 게스트 익명 TOM을 중단하고, 핵심 CTA를 기업 매각 시작/기업 인수 시작으로 단순화했다. 상담은 로그인 계정에 저장하며 Teaser·NDA·IM·LOI·DD 연결 테이블만 준비했다.

2026-08-25 Sprint 0 정책: Guest 익명 TOM을 명세에서 제거했다. 진입은 Landing → 가입/로그인 → 이용목적 → 회사 연결 → Workspace → TOM이다. 가입 전 가치 제공(Show Value Early의 익명 상담)은 현재 제품 정책과 충돌하여 계정 연결 이후로 옮겼다. Deal 생성 UI는 열지 않고 deal_participants / audit / expert 스키마만 준비했다.

2026-08-25 Sprint 0 마감: Guest Session → Signup Linking은 구현하지 않는다. 실DB E2E·RLS·Storage·Test Seed 적용은 `.env.local`의 `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`가 준비된 뒤에만 검증한다. 키는 임의 생성하지 않는다.

2026-08-26 Sprint 1 Intent: 로그인 TOM 대화에서 규칙 기반으로 Intent Router(SELL/BUY/FUNDRAISE/SUCCESSION/PARTNERSHIP/UNDECIDED)를 추출해 tom_memory_items에 저장한다. Information State를 붙이며 매각 확정 의사 등 Critical Fact는 추정하지 않는다. LLM은 사용하지 않는다.

2026-08-28 Seller TOM 후속 질문: 매각 상담은 한 번에 질문 하나(업종 → 매출). 회사 프로필 업종이 있으면 업종을 다시 묻지 않는다. 화면 표시명은 LEVEL 1(32.6 티저·LEVEL 1 가치평가)이다. 계산은 EV/Sales 간단 Proxy이며, 배수 0.5~2.0은 시장 비교가 아닌 내부 PLACEHOLDER다. 현금·차입 미확인 시 Equity Value는 계산하지 않는다. 3년 실적·현금·차입 정밀평가와 Buyer Top3는 하지 않았다.

2026-08-28 표시명: 사용자 요청으로 예비평가 표기를 LEVEL 0에서 LEVEL 1로 통일했다. 명세 9.2 엔진 단계 정의(LEVEL 0 입력/LEVEL 1 3년·현금·차입)는 바꾸지 않았다.

2026-08-28 Sprint 0 Private Storage: 버킷 `vericom-private`(비공개)와 회사 Membership RLS를 추가한다. 업로드·받기는 서버 Action과 만료 서명 URL만 사용한다. Deal/NDA/VDR 공개 규칙과 가짜 거래 상태는 넣지 않는다.

2026-08-28 원격 Private Storage: 프로젝트 `nzsgxxuyvbirnlwtqmmc`에 `0010_private_storage.sql`을 적용했다. `vericom-private` Public=false, Storage RLS 4개, Seller 업로드·Signed URL 60초·재로그인 유지·Audit는 검증했다. 두 번째 회사 계정으로 교차 접근 E2E는 하지 않았다.

2026-08-29 원격 Private Storage 재확인: `0010`은 재실행하지 않았다. `storage.buckets`에서 `vericom-private` public=false, `can_access_vericom_private_object` 존재, Storage policy 4개(`select/insert/update/delete`), 기존 object 1건 유지. public object URL은 HTTP 400. 교차회사 계정 E2E는 미검증이다.

2026-08-30 Sprint 0 Test Seed + Role/Permission E2E: 운영 데이터와 구분되는 `TEST_DEV_*` Actor·Company·Deal을 `0011_sprint0_test_seed.sql`로 넣었다. Auth 사용자는 `scripts/sprint0-seed-auth.mjs`로 만들고 비밀번호는 git에 넣지 않는다. `0012_restrict_self_platform_roles.sql`로 INTERNAL/ADMIN 자가부여를 막는다. `/internal`은 Workspace 가드를 탄다. 교차회사 Private Storage(Buyer B 목록 0·서명 URL 거부·public URL HTTP 400)와 Workspace Switcher(보유 Role만)·Buyer 격리를 검증했다. ROLE_ADDED와 앱 Action 경로의 UPLOAD_PRIVATE_FILE은 TEST Actor에서 미기록이다.

2026-08-30 Sprint 0 최종 종료: CurrentContext는 최신 deal_participants를 자동 선택하지 않는다. Active Deal은 httpOnly 쿠키 `vericom_active_deal_id`이며, 서버가 participant·회사 역할·permissions를 검증한다. 미선택 시 deal/dealRole/permissions는 null/빈 배열. `0013_sprint0_company_deal_roles.sql`로 TEST_DEV_SELLER_CO가 DEAL_A Seller / DEAL_Y Buyer가 됨을 검증했다. Company 테이블에 영구 Seller/Buyer 속성은 없다. Seller 자료실 UI 업로드로 UPLOAD_PRIVATE_FILE을 남겼다. SELECT_PLATFORM_ROLE은 이용목적 화면, WORKSPACE_SWITCHED는 Switcher. ROLE_ADDED는 현재 제품 Flow에서 검증 대상이 아니다. 브라우저에서 httpOnly Role/Deal 쿠키 직접 수정은 불가하여 Unit으로 검증한다.

2026-08-30 Sprint 1 TOM Foundation: PurposePage는 서버 Action `redirect`로 Role을 저장해 hydration 이후 세션 유실을 막는다. WorkspaceHeader Switcher는 한 번만 렌더한다. 로그인 Seller TOM은 LLM 없이 `lib/tom/intent-router.ts` 규칙으로 Intent를 추출해 기존 `tom_memory_items`에 upsert한다. Valuation LEVEL 0/1·Buyer Matching·티저 생성은 하지 않는다. 필요한 컬럼만 `0014_tom_intent_memory.sql`로 추가한다.

2026-08-30 경영진 미팅(MM): Macro Process에 Q&A와 MM을 CIM/IM과 LOI 사이에 넣었다. MM은 Buyer Participant 단위이며 생략 시 사유가 필요하다. `0015_management_meetings.sql`과 `/seller/mm` `/buyer/mm` Workspace는 구조·권한·템플릿이다. 가짜 Buyer 실적·LLM·실제 LOI 문서는 넣지 않았다.

2026-08-30 TOM AI M&A Operating Principles: `MASTER_SPEC` 0.3절과 `docs/TOM_ARCHITECTURE.md`를 공식 Architecture로 확정했다. TOM은 챗봇이 아니라 Deal Copilot / Operating Agent이다. 3계층(Knowledge / Deal Context / Action)과 `Understand → Analyze → Recommend → Draft → Ask Approval → Execute → Record`를 깨지 않는다. CurrentContext는 서버가 Source of Truth이며 Active Deal 자동 선택은 금지. Deal과 Opportunity는 분리. Company에 영구 Seller/Buyer 속성 금지. 구현 전 명세·Architecture를 읽고 Context를 고려한다. 충돌 시 코드를 먼저 쓰지 않고 보고한다. 이번 작업은 문서화만 하며 기능 대규모 구현은 하지 않았다.

충돌·우선 기록:

- Intent: 8.1 이용목적 FUNDRAISE/SUCCESSION/PARTNERSHIP/UNDECIDED는 유지. 목표 taxonomy(0.3)가 앞으로의 확장 기준. Sprint 1 `DEAL_PROGRESS` → 목표 `DEAL_STATUS`, `DOCUMENT` → `DOCUMENT_REVIEW`/`DOCUMENT_DRAFT`. 코드 enum은 해당 Sprint에서 바꾼다.
- Information State: CONFIRMED/ESTIMATED/UNKNOWN은 표시용으로 유지. 저장 성격 FACT/USER_CLAIM/ASSUMPTION/INFERENCE를 병행. 불확실 정보는 FACT 금지.
- 질문 정책: 2026-08-28 「한 번에 질문 하나」보다 0.3절 「핵심 1~3개」가 우선. Memory/DB에 있는 값은 다시 묻지 않는다.
- Agent Loop: 20.2의 Identify Context/Retrieve/상태 분리는 7단계 North Star 안의 세부일 뿐, 순서를 대체하지 않는다.
- 범위: 1.1 MVP는 Management Meeting까지 실행, Architecture는 SPA/Closing/PMI까지 설계. 구현은 33절 Sprint를 건너뛰지 않는다.
2026-08-30 Sprint 1 TOM Question Policy: Seller `/consult`는 LLM 없이 Discovery Field를 한 질문씩 수집한다. 이미 DB·CurrentContext·Memory에 있는 값은 다시 묻지 않는다. 사용자 답변은 `tom_memory_items`에 USER_CLAIM으로 저장하고, 불확실하면 UNKNOWN이며 FACT로 추정하지 않는다. 질문 엔진은 `lib/tom/question-policy.ts`. Valuation·Buyer Matching·Teaser는 하지 않는다.

2026-08-30 Sprint 1 Buyer Discovery: 공통 Question Engine에 `DiscoveryProfile` BUYER를 추가했다. Buyer `/consult`는 인수조건을 한 질문씩 모아 `tom_memory_items`에 Acquisition Criteria로 저장한다. Buyer 회사 업종과 Target 산업은 분리한다. multi-value는 JSON `values`로 병합하고, 숫자는 명시된 억 단위만 KRW로 정규화한다. Matching·Valuation·LLM은 하지 않는다. 새 테이블·0008/0009는 적용하지 않았다.

2026-08-31 Direct M&A / Hybrid Advisory Architecture: VERICOM은 Traditional Broker-led가 아니라 **AI-native Direct M&A Operating Platform + On-demand Advisory Intervention**이다. 공식 Principle: AI First, Direct Communication, Advisor On Demand, Expert When Needed, Permission by Design, Human-in-the-loop. Cold Call은 기본 UX가 아니고 보조 Flow다. Seller↔Buyer 직접 커뮤니케이션은 Opportunity 단위이며 MM/LOI 이전에도 가능하다. Messaging Access와 Identity/IM/Document Access는 분리. 중개자문 요청은 실패 버튼이 아니라 Hybrid Mode. 플랫폼 이용과 Exclusive Mandate는 구분. Messaging·AdvisoryRequest 기능과 DB Table은 이번 작업에서 만들지 않았다. `MASTER_SPEC` 0.4절.

충돌·정리:

- Hard Gate 「Mandate 없으면 Buyer 외부접촉 불가」: **플랫폼 밖** Cold Call / 전통 외부접촉에만 적용. 플랫폼 안 Matching→승인→Invitation→Opportunity Messaging은 Self-Service 가능.
- 「Execution Mandate 전 외부접촉 권한 없음」(11절): 플랫폼 밖 접촉으로 한정.
- Macro Process 10단계·MM 권장 순서는 유지. Stage 사이 Messaging을 금지하지 않음.
- 「LOI 전 중개자만 커뮤니케이션」 구조는 채택하지 않음.
- 처음부터 Exclusive Mandate 필수 아님. Mandate는 Advisory Engagement 별도 Process.
- 0.3 TOM Copilot 정의는 유지. TOM은 메시지 전달 중개자가 아님을 0.4·TOM_ARCHITECTURE에 명시.

2026-08-31 Buyer Acquisition Criteria Normalization: Buyer Discovery의 `tom_memory_items` USER_CLAIM 위에 LLM 없는 계산형 정규화 스냅샷을 둔다. 원본 Memory는 수정·삭제하지 않고, 별도 `normalized_acquisition_criteria` 테이블도 만들지 않는다. Matching·Score·추천은 하지 않는다. 서버 `getNormalizedAcquisitionCriteria`는 CurrentContext의 authenticated user / active company / BUYER platform role / conversation ownership만 사용한다.

2026-08-31 Sprint 1 TOM Conversation 종료: Buyer 로그인 E2E로 Memory → Normalization → deterministic Summary → 재질문 방지 → 재로그인 유지를 검증했다. 투자 금액 단서(`생각하고`/`까지`)는 직전 매출 질문보다 우선한다. Matching·Valuation은 시작하지 않았다.

2026-08-31 Sprint 2 Financial Input Normalization: Seller Discovery Memory 위에 계산형 재무 입력 스냅샷을 둔다. Buyer Criteria·Seller 희망가와 섞지 않는다. Cash/Debt 분할을 추정하지 않는다. EV/Multiple/DCF와 0008/0009는 적용하지 않았다.

2026-08-31 Sprint 2 LEVEL 0 EV/Sales Foundation: `Financial Input → Method Eligibility → Benchmark Input → Deterministic Calculation → Valuation Result → TOM interpretation`. EV = 정규화 매출 × 승인된 EV/Sales 배수. 둘 다 있을 때만 계산한다. Production/UI는 APPROVED만. TEST_ONLY는 단위 테스트 전용이며 Seller UI에 노출하지 않는다. UNVERIFIED는 production 계산을 거부한다. PLACEHOLDER 0.5–2.0 배수를 사용자에게 쓰지 않는다. Equity Value·DCF·WACC는 하지 않는다. 새 valuation 테이블과 0008/0009 적용은 하지 않았다.

2026-08-31 Sprint 2 LEVEL 0 Equity Value Foundation: Equity = Enterprise Value − Net Debt. EV status가 CALCULABLE이고 벤치마크가 APPROVED(단위 테스트는 TEST_ONLY)이며, Seller Financial Normalization의 `net_debt`가 명시 숫자·충분한 confidence일 때만 `equityValueRange`를 계산한다. Cash/Debt를 추정하거나 분할하지 않는다. 순차입이 없거나 unresolved이면 `equityValueRange`는 null이다. EV가 CALCULABLE이 아니면 순차입이 있어도 Equity는 null이다. Seller 희망가·Buyer 투자규모는 사용하지 않는다. 음수 Equity는 0으로 올리지 않고 계산된 정수 원과 `negative_equity` warning을 반환한다. Production/UI는 APPROVED EV + 확인된 순차입 없이 지분가치 숫자를 보여주지 않는다. TEST_ONLY는 Seller UI에 노출하지 않는다. 전체 Net Debt 엔진·DCF·WACC·새 valuation 테이블·0008/0009 적용은 하지 않았다.

2026-08-31 Sprint 2 LEVEL 0 Approved Benchmark Foundation: EV/Sales 배수는 코드 레이어 `resolveApprovedEvSalesBenchmark`만 사용한다. 기본 저장소는 비어 있으며 없으면 `MISSING_BENCHMARK`다. 업종 PLACEHOLDER 배수·인터넷 스크랩·LLM 생성 배수를 쓰지 않는다. Production/UI는 APPROVED + provenance만 허용한다. TEST_ONLY는 주입·resolver·Seller UI에서 거부한다. UNVERIFIED도 거부한다. Client/TOM이 보낸 배수는 무시한다. 단위 테스트와 이후 Expert는 `injectApprovedEvSalesBenchmark`로 회사(및 선택적 conversation) 단위 APPROVED만 넣을 수 있으며, 전 Seller 기본값이 되지 않는다. `0009` valuations 테이블은 `multiple_source default PLACEHOLDER`라 MASTER_SPEC과 충돌하므로 적용하지 않았고 새 테이블도 만들지 않았다. Persistence는 후속이다.

2026-08-31 Sprint 2 LEVEL 0 Approved Benchmark Persistence: 승인된 EV/Sales 배수는 `approved_valuation_benchmarks`(0016)에 저장한다. default 배수와 PLACEHOLDER source는 없다. Production `getSellerLevel0Valuation`은 DB에서 회사 단위로 로드한 뒤 resolver에 넘긴다. in-memory inject는 단위 테스트 전용이다. WRITE는 Expert/Internal/Admin + `created_by` audit. Seller는 자기 회사 APPROVED 행만 READ. Buyer는 타사 배수를 읽지 못한다. leftover `0008`/`0009`/`0015`는 적용하지 않는다.

2026-08-31 Sprint 2 LEVEL 0 Seller UI Integration: Seller 가치평가 화면·홈·TOM은 `getSellerLevel0Valuation` 결과를 그대로 보여 준다. APPROVED가 있을 때만 Indicative EV Range(억 원)를 표시한다. TEST_ONLY·UNVERIFIED·Placeholder 배수는 금액 영역에 넣지 않는다. EV와 Equity Value를 구분한다. VALUATION_CALCULATED Audit은 화면 조회에 남기지 않는다.

2026-08-31 Architecture Decision: VERICOM은 Cursor 자율 개발(Autonomous Development)을 공식 채택한다. 무제한 자율이 아니다. **Autonomous Development + Mandatory Human Approval for High-risk Changes.**

왜: 새 Cursor 세션·다른 PC에서도 동일한 작업 운영을 유지한다. 사용자가 매 다음 작업을 지정하지 않아도 Cursor는 `MASTER_SPEC.md` Roadmap과 실제 코드를 기준으로 다음 중요 작업을 고른다. 고위험 변경은 자동 실행하지 않는다.

자동 허용: 기존 Architecture 안의 기존 기능 보완, 소규모 리팩터, TypeScript 수정, Unit/E2E/Regression, Build 수정, 문서 동기화, 안전한 마이그레이션(컬럼·인덱스·RLS 추가), 해당 Sprint Supabase 적용, commit, push, `origin/main` 확인.

승인 필요: 운영 데이터/테이블/컬럼 삭제, destructive migration, RLS 약화, Security Gate 제거, Identity Release / IM Release 정책 변경, Deal/Opportunity 핵심 구조 변경, `MASTER_SPEC` 핵심 정책 변경, 사업 모델 변경, Mandate/Advisory 정책 변경, 대규모 Architecture 재설계, force push, Git history rewrite, secret/API key 변경, 실제 외부 이메일·당사자 접촉·오프플랫폼 메시지·문서 외부 공개, 실제 Deal Stage 변경, 실제 LOI/SPA 승인, 실제 Closing.

공식 운영 문서: `docs/DEVELOPMENT_AUTOPILOT.md`. `MASTER_SPEC.md` 0절·37절이 이를 참조한다. 제품 정책은 바꾸지 않는다.

2026-08-31 Public 매각/인수 이어가기: 랜딩 「기업 매각」「기업 인수」와 CTA는 `/start?intent=`로 보낸다. 미로그인은 로그인(열린 리다이렉트 방지된 `next`) 후 Seller/Buyer 상담(`/consult?intent=sell|buy`)으로 이어가고, 온보딩이 남으면 httpOnly `vericom_post_auth_next`에 목적지를 잠시 둔다. 이미 로그인이면 로그인으로 튕기지 않는다. CurrentContext가 SoT이며 새 Memory 시스템은 만들지 않는다.


