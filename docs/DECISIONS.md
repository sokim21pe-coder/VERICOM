# 2026-08-25

Sprint 0 기초: 명세 29절 권장 폴더 구조를 만들고 Supabase 클라이언트 뼈대와 로그인·회원가입 화면 틀을 추가했다. 실제 Auth 연동·RLS·테이블 CREATE는 프로젝트 URL/키가 준비된 뒤 진행한다. Business Rule은 변경하지 않았다.

로그인 경로는 `app/(auth)/login`만 사용한다 (`/login`). 빈 `app/login` 폴더는 `/login` 충돌을 일으켜 제거한다. `/auth/login`은 `/login`으로 리다이렉트한다.

2026-08-25 Phase 1: Seller 워크스페이스에 표준 M&A 10단계 Macro Process UI를 추가했다. 기존 Deal Stage / Opportunity Stage는 유지한다. 데이터는 PLACEHOLDER이며 Auth·Audit·문서 연동은 TODO이다.

2026-08-25 Phase 1 Auth: Supabase Identity Core(users/persons/companies/memberships/platform roles)와 회원가입·로그인·이용목적·회사연결·Workspace 진입을 연결했다. Valuation/NDA/IM/DD 및 TOM 모델 연결은 하지 않았다.

2026-08-25 S01 UX: 게스트 익명 TOM을 중단하고, 핵심 CTA를 기업 매각 시작/기업 인수 시작으로 단순화했다. 상담은 로그인 계정에 저장하며 Teaser·NDA·IM·LOI·DD 연결 테이블만 준비했다.

2026-08-25 Sprint 0 정책: Guest 익명 TOM을 명세에서 제거했다. 진입은 Landing → 가입/로그인 → 이용목적 → 회사 연결 → Workspace → TOM이다. 가입 전 가치 제공(Show Value Early의 익명 상담)은 현재 제품 정책과 충돌하여 계정 연결 이후로 옮겼다. Deal 생성 UI는 열지 않고 deal_participants / audit / expert 스키마만 준비했다.

2026-08-25 Sprint 0 마감: Guest Session → Signup Linking은 구현하지 않는다. 실DB E2E·RLS·Storage·Test Seed 적용은 `.env.local`의 `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`가 준비된 뒤에만 검증한다. 키는 임의 생성하지 않는다.

2026-08-26 Sprint 1 Intent: 로그인 TOM 대화에서 규칙 기반으로 Intent Router(SELL/BUY/FUNDRAISE/SUCCESSION/PARTNERSHIP/UNDECIDED)를 추출해 tom_memory_items에 저장한다. Information State를 붙이며 매각 확정 의사 등 Critical Fact는 추정하지 않는다. LLM은 사용하지 않는다.
