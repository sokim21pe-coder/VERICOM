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
