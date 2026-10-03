# 2026-10-02 Seller Teaser Foundation (Draft → Review → Explicit Approval → Audit)

Seller가 NDA 전에 쓰는 익명·제한정보 Teaser를 Rule 기반(LLM 아님)으로 만들고, 직접 검토한 뒤 명시적으로 승인하는 수직 슬라이스를 추가했다. 표준 M&A Workflow 순서(초기상담→티저→NDA→…)는 바꾸지 않았고, Teaser는 Valuation보다 앞 단계라 Valuation이 없어도 Draft를 만들 수 있다(있으면 매출 구간만 참조).

원칙: 확인된 구조화 사실만 사용하고 없는 정보는 창작하지 않고 "확인 필요"로 남긴다. 회사명은 식별정보 공개 승인 전 노출하지 않고 마스킹 descriptor(예: "국내 산업용 배터리팩 전문기업")로 헤드라인을 만든다. 기업가치(EV)·배수·Multiple은 Teaser에 넣지 않으며 재무 섹션은 매출 구간과 "상세 재무·기업가치는 NDA 이후 IM 단계에서 제공" 면책 문구만 둔다. Buyer 배포/매칭/Opportunity/다운로드/관심 추적은 이번 Phase 범위에서 제외했다.

상태는 최소(DRAFT → IN_REVIEW → APPROVED)로 둔다. 승인은 오직 approve_teaser RPC(IN_REVIEW에서만)로만 일어나고, 저장=승인/미리보기=승인/AI 자동승인은 없다. 승인된 내용을 수정하면 save_teaser_version이 상태를 DRAFT로 되돌려 승인을 무효화하되, 기존 승인 버전 스냅샷(teaser_versions)은 보존한다.

저장소: `0020_seller_teaser_foundation.sql`(additive)로 `teasers` 헤더 + `teaser_versions` 불변 스냅샷 테이블과 RLS, security-definer RPC(create_teaser_draft/save_teaser_version/submit_teaser_for_review/approve_teaser)를 추가했다. 보안 헬퍼는 0016의 has_staff_platform_role()/is_seller_member_of_company(uuid)를 재사용한다. SELECT는 (해당 회사 Seller) 또는 (Staff)만, 모든 쓰기는 RPC로만 한다. Buyer는 승인 전·후 모두 접근 불가, 타 Seller Company도 불가, Staff는 조회만. Audit는 TEASER_DRAFT_CREATED/UPDATED/REVIEWED/APPROVED를 기록한다.

마이그레이션 게이트: 명세대로 0020은 파일만 작성했고 Production에 자동 적용하지 않는다. 데이터 레이어는 테이블 미적용 상태에서도 깨지지 않게(storageReady=false) 프리뷰만 제공하도록 했다. 승인 단계 Stage 자동 변경·NDA 워크플로는 구현하지 않았다. 오프라인 게이트(단위 223 PASS/lint/tsc/build)는 통과했고, LIVE RLS 검증은 0020 적용 후로 남긴다.

2026-10-03 Seller Teaser Foundation — Production 0020 적용 + LIVE E2E: 사용자가 Supabase Production(`nzsgxxuyvbirnlwtqmmc`) SQL Editor에서 `0020_seller_teaser_foundation.sql` 원문만 실행했고 `Success. No rows returned`를 확인했다(전체 `db push` 미실행, 0008/0009/0015/0016/0017/0018/0019 재적용 없음). 적용 후 실제 JWT 세션으로 확인: `teasers`/`teaser_versions` SELECT 200, RPC `create_teaser_draft`/`save_teaser_version`/`submit_teaser_for_review`/`approve_teaser` 존재. Seller A(`테스트배터리`, Valuation 없음) LIVE UI: 작성 전(amber 배너 소멸, 초안 만들기 활성) → Draft v1(`TEASER_DRAFT_CREATED`) → 편집 저장 v2(`TEASER_UPDATED`, 상태 유지 DRAFT, 저장≠승인) → 검토 요청 IN_REVIEW(`TEASER_REVIEWED`) → 명시 승인 APPROVED v2(`TEASER_APPROVED`, approved_at/approved_by 기록) → 승인 후 수정 DRAFT v3(승인 무효, `approved_version=2` 스냅샷 유지, v1/v2/v3 삭제 없음). 헤드라인 `국내 산업용 배터리팩 제조 전문기업`, 회사명 미노출, 미확인 항목은 `확인 필요`, 재무는 NDA/IM 면책만. Audit는 `audit_logs`+`activities` dual-write(4종 모두, actor=Seller A). RLS(실제 JWT, service_role 우회 아님): 타 Seller Company select 0건·RPC 거부(`not permitted`), Buyer select 0건·RPC 거부(승인 후에도 차단), Staff(EXPERT) select 1건·create/edit/approve RPC 거부, 직접 INSERT 42501, 직접 UPDATE로 상태 강제 변경 실패(행 유지 DRAFT v3). Seller Stage/Deal Stage 자동 변경 코드 없음. Buyer email/messaging/matching/opportunity/download/external release 없음. 0018 helper `is_staff_assigned_to_seller_company`는 Production에 이미 존재(함수 200)하나 마이그레이션 파일은 PR #7에만 있고 `origin/main`에는 아직 없다. leftover `valuations`(0008/0009)는 Production에 없음. `management_meetings`는 기존 drift로 존재하나 이번 작업에서 생성/삭제/재적용하지 않았다. Vercel Production 반영·PR #15 main merge는 이 기록 시점의 후속 게이트다.

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

2026-09-01 Sprint 2 0016 Remote Apply: 프로젝트 `nzsgxxuyvbirnlwtqmmc`에 `0016_approved_valuation_benchmarks.sql`만 적용했다. 테이블·컬럼·인덱스 3개·RLS·policy 5개가 존재하고 행은 0이다. leftover `0008`/`0009` `valuations`는 적용하지 않았다. `management_meetings`는 이전 MM 작업으로 이미 있었고 이번에 재실행하지 않았다. 가짜 배수를 INSERT하지 않았다. TOM은 LLM 없이 결정론 설명만 한다.

2026-09-01 Sprint 2 LEVEL 0 Staff Approved Benchmark Write UI: Expert/Internal(E-BENCHMARK / I-BENCHMARK)만 배정 Deal의 매각 회사에 APPROVED EV/Sales를 저장한다. 출처·출처 유형(INTERNAL_REVIEW|MARKET_PROVIDER)·기준일·확인 체크가 필요하다. 업종 필드는 참고이며 기본 배수가 아니다. TEST_ONLY·UNVERIFIED·PLACEHOLDER·TEST_FIXTURE는 이 화면에서 거부한다. 0016 INSERT RLS는 Deal 범위가 아니므로 앱이 배정 `seller_company_id`만 허용한다. 가짜 1.5x를 production에 INSERT하지 않았다.

2026-09-01 Sprint 2 LEVEL 0 Net Debt Engine: `Net Debt = Debt − Cash`. 현금과 차입이 모두 명시 숫자일 때만 공식으로 계산한다. 한쪽만 있으면 다른 쪽을 0으로 두지 않는다. 공식을 쓸 수 없으면 사용자가 명시한 `net_debt`만 쓴다. 충돌 시 공식을 쓰고 `net_debt_conflict_used_formula`를 남긴다. Equity는 확인된 순차입이 있을 때만 EV − Net Debt. DCF·WACC·0008/0009는 적용하지 않았다.

2026-09-01 Sprint 2 LEVEL 1 EV/EBITDA Foundation: EV = 정규화 EBITDA × 승인된 EV/EBITDA 배수. 둘 다 있을 때만 계산한다. EV/Sales 레코드·PLACEHOLDER·TEST_ONLY·UNVERIFIED는 production/UI 금액에 쓰지 않는다. DCF·WACC·Precedent 스크랩은 하지 않는다. 0016 method 제약은 아직 EV_SALES라 EV/EBITDA persistence는 후속이다.

2026-09-01 Sprint 2 LEVEL 1 EV/EBITDA Persistence: `0017`로 `approved_valuation_benchmarks.method`에 EV_EBITDA를 허용한다. Staff WRITE UI는 배정 Deal 매각 회사에 APPROVED EV/Sales 또는 EV/EBITDA를 저장한다. 가짜 기본 배수·DCF·0008/0009는 넣지 않는다. leftover 마이그레이션이 있어 전체 `db push`는 하지 않았다. CLI `--linked` 적용은 `SUPABASE_ACCESS_TOKEN` 부재로 실패했다. 원격 CHECK는 SQL Editor에서 `0017_approved_ev_ebitda_method.sql`만 실행해야 한다.

2026-09-01 Sprint 2 LEVEL 1 Feature Slice: Seller 3개년 매출·EBITDA Memory를 구조화한다. 없는 연도는 null이며 추정하지 않는다. `/seller/valuation`에 LEVEL 0/1 상태·진행상태·3개년 실적·부족 항목을 표시한다. 승인된 EV/EBITDA가 있을 때만 Indicative EV Range를 연다.

2026-08-31 Architecture Decision: VERICOM은 Cursor 자율 개발(Autonomous Development)을 공식 채택한다. 무제한 자율이 아니다. **Autonomous Development + Mandatory Human Approval for High-risk Changes.**

왜: 새 Cursor 세션·다른 PC에서도 동일한 작업 운영을 유지한다. 사용자가 매 다음 작업을 지정하지 않아도 Cursor는 `MASTER_SPEC.md` Roadmap과 실제 코드를 기준으로 다음 중요 작업을 고른다. 고위험 변경은 자동 실행하지 않는다.

자동 허용: 기존 Architecture 안의 기존 기능 보완, 소규모 리팩터, TypeScript 수정, Unit/E2E/Regression, Build 수정, 문서 동기화, 안전한 마이그레이션(컬럼·인덱스·RLS 추가), 해당 Sprint Supabase 적용, commit, push, `origin/main` 확인.

승인 필요: 운영 데이터/테이블/컬럼 삭제, destructive migration, RLS 약화, Security Gate 제거, Identity Release / IM Release 정책 변경, Deal/Opportunity 핵심 구조 변경, `MASTER_SPEC` 핵심 정책 변경, 사업 모델 변경, Mandate/Advisory 정책 변경, 대규모 Architecture 재설계, force push, Git history rewrite, secret/API key 변경, 실제 외부 이메일·당사자 접촉·오프플랫폼 메시지·문서 외부 공개, 실제 Deal Stage 변경, 실제 LOI/SPA 승인, 실제 Closing.

공식 운영 문서: `docs/DEVELOPMENT_AUTOPILOT.md`. `MASTER_SPEC.md` 0절·37절이 이를 참조한다. 제품 정책은 바꾸지 않는다.

2026-08-31 Public 매각/인수 이어가기: 랜딩 「기업 매각」「기업 인수」와 CTA는 `/start?intent=`로 보낸다. 미로그인은 로그인(열린 리다이렉트 방지된 `next`) 후 Seller/Buyer 상담(`/consult?intent=sell|buy`)으로 이어가고, 온보딩이 남으면 httpOnly `vericom_post_auth_next`에 목적지를 잠시 둔다. 이미 로그인이면 로그인으로 튕기지 않는다. CurrentContext가 SoT이며 새 Memory 시스템은 만들지 않는다.

2026-09-01 S01 서비스 소개·매각/인수 설명: 랜딩 01~04 카드는 `/about/valuation|matching|confidential|experts`로, 구역 제목 「기업 매각」「기업 인수」는 `/about/sell` `/about/buy`로 연결한다. Matching/Top3/NDA/LOI/DD를 가짜로 작동시키지 않으며 준비 중을 숨기지 않는다. 상세 페이지 CTA는 로그인·회원가입이며 `next`는 `safeNextPath`로 `/seller/valuation`, `/buyer`, `/consult?intent=` 등만 허용한다. 매각/인수 구역의 중복 시작 버튼은 제거하고, Hero와 Header의 `/start?intent=` 이어가기는 유지한다.

2026-09-01 S01 TOM(AI) 안내 패널: 랜딩 TOM 카드 제목·자세히 보기는 `/about/tom`으로 연결한다. 미로그인은 로그인·회원가입이며 `next`는 `/onboarding/purpose`다. Guest 익명 상담은 열지 않는다. Header에 「TOM과 상담 시작」은 넣지 않으며, 매각/인수 시작 CTA는 Hero `/start?intent=`를 유지한다. Teaser·NDA·IM·LOI·DD는 준비 중으로만 안내한다.

2026-09-01 공개 푸터 회사소개: 사용자가 제출한 사업자등록증을 Source of Truth로 회사명·대표·사업자등록번호·소재지만 넣는다. 증명서에 없는 연락처는 Placeholder로 둔다. 제품 표시명 베리컴/VERICOM과 법인명 주식회사 에프오비인베스트는 구분한다.

2026-09-01 Sprint 2 LEVEL 1 closeout: Expert WRITE UI에서 EV/EBITDA 저장 후 Seller `/seller/valuation` LEVEL 1이 비교배수 대기가 아니어야 한다. EBITDA가 없으면 금액을 만들지 않고 재무 입력 필요만 표시한다. 원격 CHECK가 EV_SALES만 허용하면 `0017`만 적용해야 하며 leftover `0008`/`0009`는 적용하지 않는다. Matching은 시작하지 않는다.

2026-10-01 Workspace/Profile 슬라이스 Production 반영(IN-PROGRESS, 아직 CLOSED 아님): App Workspace shell(sidebar·header·mobile drawer)·User Menu·회원 프로필 편집(`34938a1`), 로그인 E2E 상시 수행 설정(`8acbca5`), 공식 `npm test`(`764a265`)를 `origin/main`에 fast-forward 반영했다(main = `764a265`, PR #13 MERGED). 공식 `npm test`는 외부 프레임워크 없이 `node:test` + `scripts/test-register.mjs`/`test-resolve-hook.mjs`로 `tests/unit` 202개를 실행하며 임시 `/tmp` 로더 의존을 제거했다. 오프라인 게이트 PASS: `npm test` 202/202, `npm run lint` 0 errors, `npx tsc --noEmit`, `npm run build`. Vercel Production 배포를 확인했다: `/`·`/login` 200, `/seller`·`/account/profile` 307 auth-gate(신규 `/account/profile` route live), 0019 적용 전 graceful degrade. `0019_profile_job_title_and_company_update.sql`은 재검토 결과 SAFE(additive, `persons.job_title` nullable·default 없음, DROP/destructive 없음, `update_company_for_current_user`는 active membership guard·`security definer`·`set search_path=public`·public revoke·authenticated만 execute)이나 **Production 미적용**이다. 따라서 LIVE Profile read/write·company RPC·persistence·RLS·cross-user/cross-company·role isolation은 **미검증(BLOCKED)**이며 확인 전 PASS로 기록하지 않는다. 다음 필수 인간 작업은 Supabase Production SQL Editor에서 `0019` 원문만 실행하는 것이다(전체 `db push` 금지).

2026-10-01 Workspace/Profile 슬라이스 LIVE E2E CLOSED: 사용자가 Supabase Production(`nzsgxxuyvbirnlwtqmmc`) SQL Editor에서 `0019` 원문만 실행했고 `Success. No rows returned`를 확인했다(전체 `db push` 미실행). 실제 Production Supabase에 대한 검증 결과 모두 PASS. (1) **백엔드 보안(실제 사용자 JWT 세션, service_role 우회 아님) 17/17 PASS**: `persons` self read/write + `job_title` 저장·조회(0019 적용 확정), `register_company_for_current_user`/`update_company_for_current_user` 자기 회사 수정 허용 + DB 반영, cross-company 회사명 수정 차단(`not permitted to update this company`), 임의 `company_id` 차단, cross-user `persons` 조회/수정 차단(RLS 빈 결과·0행), cross-company `companies` 조회 차단(RLS), 타사 데이터 무결성 유지. (2) **브라우저 UI LIVE E2E 9/9 PASS**: 동일 커밋(`29d4d4e`)의 Next 서버를 VM 로컬에서 띄우고 실제 Production Supabase에 연결해 수행 — 로그인→온보딩(기업 매각)→워크스페이스(header+sidebar)→User Menu→내 프로필→read(이메일·회원유형 읽기 전용 확인)→이름/직책/연락처/회사명 수정 저장(`변경사항을 저장했습니다.`)→새로고침 persistence→route 이동 persistence→로그아웃→재로그인 persistence 유지→모바일 드로어(iPhone SE 375px: 햄버거 표시·사이드바 숨김·드로어 열림/오버레이·route 이동 시 자동 닫힘·overflow 없음)→Seller 회귀(`/seller`·`/seller/valuation`·`/seller/deals`·`/seller/documents` 정상). 주의: 외부 `www.vericom.kr`의 서버 HTML은 curl 16/16 정상 200·유효 로그인 폼으로 건강함을 확인했으나, 이 VM의 computerUse Chrome가 외부 SPA를 렌더하지 못하는 브라우저/프록시 한계가 있어 UI는 동일 커밋 로컬 Next 서버+실제 Production DB로 검증했다(서버 코드·DB 동일). 제한: Buyer/Expert/Internal 별도 role actor 세션은 개별 생성하지 않았다(Expert/Internal은 self-register 불가, seed 계정=`VERICOM_TEST_SEED_PASSWORD` 필요). 단 RLS 경계는 `current_app_user_id()`·company membership 기준이라 role 무관하게 동일 적용되며, 서로 다른 회사의 두 실제 세션으로 cross-user/cross-company 격리를 입증했고 buyer_criteria 격리는 단위 테스트가 커버한다. 코드 변경 없음(검증 전용). 오프라인 게이트 재확인 PASS: `npm test` 202/202, lint 0 errors, `tsc --noEmit`, `build` 성공.


