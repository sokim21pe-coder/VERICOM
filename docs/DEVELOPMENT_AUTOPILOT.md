# VERICOM Development Autopilot Rules

이 문서는 **VERICOM 개발의 필수 Cursor 운영 문서**이다.

제품 정책의 Source of Truth는 프로젝트 루트 `MASTER_SPEC.md`이다. 이 문서는 제품 정책을 새로 만들지 않는다. **자율 실행·작업 선택·승인 범위·GitHub/Supabase 운영**만 정의한다. 제품 내용이 충돌하면 `MASTER_SPEC.md`와 `docs/DECISIONS.md`의 최신 결정을 따른다.

Cursor는 사용자가 매 다음 작업을 지정하지 않아도, 이 문서와 Roadmap·실제 코드를 기준으로 다음 중요 작업을 선택하고 실행한다. 무제한 자율이 아니다. **Autonomous Development + Mandatory Human Approval for High-risk Changes.**

---

## 1. 작업 전 필수 문서

어떤 기능이든 구현하기 전에 아래를 확인한다.

1. `MASTER_SPEC.md` — 루트 Source of Truth
2. `docs/MASTER_SPEC.md` — 동일 원문의 사본. 내용이 다르면 루트 파일을 따른다
3. `docs/DECISIONS.md` — Architecture Decision 및 Sprint 결정
4. `docs/TOM_ARCHITECTURE.md` — TOM / Direct M&A Architecture 상세
5. `docs/DEVELOPMENT_AUTOPILOT.md` — 이 문서. 작업 운영 규칙

화면이면 Screen ID, Actor/Role/Permission, Approval Gate, Source of Truth, Audit 필요 여부를 확인한다. TOM 또는 M&A 기능이면 User / Company / Platform Role / Active Deal / Deal Role / Permissions / Deal Stage Context를 고려한다.

---

## 2. Autopilot 원칙과 우선순위

사용자는 매 다음 작업을 지정할 필요가 없다. Cursor는 `MASTER_SPEC.md` 33절 Roadmap과 **실제 코드·DB 상태**를 보고 다음 중요 작업을 고른다. Sprint 순서를 건너뛰지 않는다. 기반 없이 UI만 먼저 만들지 않는다.

우선순위(높은 것부터):

1. 현재 Sprint의 미완료 핵심
2. Security / Permission
3. Data Integrity
4. 미검증 E2E
5. Regression / Build
6. 다음 Sprint Foundation
7. UI polish
8. Extra features

미검증 작업을 완료로 표시하지 않는다. 판정은 **성공 / 실패 / 미검증**만 사용한다.

---

## 3. 개발 순서

한 작업 묶음은 아래 순서를 지킨다.

`Architecture → Data Model → Server Logic → Permission → UI → Audit → Test → Supabase → GitHub`

Sprint 범위 자체는 `MASTER_SPEC.md` 33절 Roadmap을 따른다. 해당 Sprint에 속하지 않는 테이블·기능·마이그레이션을 앞당겨 적용하지 않는다.

---

## 4. Autopilot 루프

1. 현재 코드 / DB / Roadmap을 확인한다
2. 위 우선순위로 다음 중요 작업을 고른다
3. 구현한다
4. Security / Permission을 확인한다
5. Unit / E2E / Regression / Build를 실행한다
6. 필요한 경우에만 안전한 Supabase 변경을 적용한다
7. GitHub commit / push 후 `origin/main`을 확인한다
8. 상태를 평가한다 (성공 / 실패 / 미검증)
9. 다음 작업을 자동 선택한다

승인 필요 작업, Architecture 충돌, 보안 이슈가 있으면 루프를 멈추고 사용자에게 보고한다. 그 외에는 「다음에 무엇을 할까요?」를 묻지 않는다.

---

## 5. 작업 단위

한 번에 **검증 가능한 하나의 묶음**만 한다.

좋은 예:

- Sprint 1 Buyer Discovery E2E 미검증 항목 하나를 닫는다
- 기존 Permission 가드의 회귀 테스트를 보강한다
- 문서와 코드가 어긋난 참조를 동기화한다

나쁜 예:

- Valuation + Matching + Messaging + LOI + DD를 한 번에 구현한다
- 다음 Sprint 기능을 현재 Sprint UI에 섞는다
- 미검증 상태를 완료로 보고한다

---

## 6. 사용자 승인이 필요한 작업 (절대 자동 금지)

아래는 사용자 명시 승인 없이 실행하지 않는다.

- 운영(production) 데이터 삭제
- 테이블 삭제
- 컬럼 삭제
- destructive migration
- RLS 약화
- Security Gate 제거
- Identity Release 정책 변경
- IM Release 정책 변경
- Deal / Opportunity 핵심 구조 변경
- `MASTER_SPEC.md` 핵심 정책 변경
- VERICOM 사업 모델 변경
- Mandate / Advisory 정책 변경
- 대규모 Architecture 재설계
- Git force push
- Git history rewrite
- secret / API key 변경
- 실제 outbound email
- 실제 Buyer / Seller 접촉
- 실제 플랫폼 밖 메시지
- 실제 문서 외부 공개
- 실제 Deal Stage 변경
- 실제 LOI / SPA 승인
- 실제 Closing

---

## 7. 기존 Architecture 안에서 자동 허용

아래는 기존 Architecture·현재 Sprint 범위 안이면 사용자에게 매번 묻지 않고 진행할 수 있다.

- 기존 기능 보완
- 소규모 리팩터
- TypeScript 수정
- Unit / E2E / Regression
- Build 수정
- 문서 동기화
- 안전한 마이그레이션 (컬럼 추가, 인덱스 추가, RLS 추가)
- 해당 Sprint에 필요한 Supabase 적용
- commit
- push (`origin/main` 확인 포함)

미검증 작업을 완료로 표시하지 않는다. 결과는 **성공 / 실패 / 미검증**으로 남긴다.

---

## 8. 제품 원칙

VERICOM = **AI-native Direct M&A Operating Platform + On-demand Advisory Intervention**

공식 Principle:

- AI First
- Direct Communication
- Advisor On Demand
- Expert When Needed
- Permission by Design
- Human-in-the-loop

기본 Flow:

`AI Matching → Seller Approval → Invitation → Opportunity → Seller/Buyer 직접 커뮤니케이션 → 필요 시 Advisory → 필요 시 Expert Matching`

Traditional Broker-led가 아니다. 모든 메시지가 VERICOM 직원을 거쳐야만 거래가 진행되는 구조를 만들지 않는다. Cold Call은 기본 UX가 아니다. Seller↔Buyer 직접 대화는 Opportunity 단위다.

상세는 `MASTER_SPEC.md` 0.4절과 `docs/TOM_ARCHITECTURE.md`.

---

## 9. TOM

TOM은 챗봇이 아니라 **AI-native M&A Deal Copilot / Operating Agent**다. 인간 경력·실제 Deal 경험을 허위로 말하지 않는다.

3계층:

1. Knowledge
2. Deal Context
3. Action

실행 순서(깨지 않음):

`Understand → Analyze → Recommend → Draft → Ask Approval → Execute → Record`

기능 구현 전 User, Company, Platform Role, Active Deal, Deal Role, Permission, Deal Stage, Structured Memory, Documents를 고려한다.

상세는 `MASTER_SPEC.md` 0.3절과 `docs/TOM_ARCHITECTURE.md`.

---

## 10. Deal vs Opportunity

- Deal = Seller의 전체 매각 프로젝트
- Opportunity = Seller ↔ 특정 Buyer의 1:1 Deal Path
- 둘을 합치지 않는다
- Buyer는 서로 격리한다. Buyer A는 Buyer B의 존재·메시지·문서·가격·협상·진행상태를 볼 수 없다
- Company에 영구 Seller / Buyer 속성을 두지 않는다
- 한 Company는 Deal A에서 Seller, Deal B에서 Buyer가 될 수 있다
- Role은 Deal Context에서 결정된다
- CurrentContext의 Source of Truth는 서버다. Client 권한 값을 믿지 않는다
- Active Deal을 최신 행으로 자동 선택하지 않는다

---

## 11. Valuation

LLM이 Valuation 최종 숫자(EBITDA, WACC, Multiple, EV, Equity Value)를 만들지 않는다.

순서:

`Financial Input → Deterministic Engine → Benchmark → Result → TOM interpretation`

LLM은 설명·비교·Sensitivity·리스크·추천만 담당한다. leftover `0008`/`0009`(PLACEHOLDER `valuations`)는 적용하지 않는다. LEVEL 0 승인 배수는 `0016_approved_valuation_benchmarks.sql`만 사용한다.

---

## 12. Security

Sprint 0 Security Architecture를 약화하지 않는다.

유지:

- 서버 Permission
- RLS
- Buyer / Company isolation
- Expert scoped access
- Internal restriction
- Private Storage
- Signed URL
- Audit
- Approval Gate

중요 실행:

`Draft → Review → Explicit Approval → Execute → Audit`

Messaging Access와 Identity / IM Access는 독립이다.

---

## 13. GitHub / Supabase

작업 묶음이 끝나면:

`status → diff → test → secret check → commit → push → origin/main`

커밋하지 않는다:

- `.env.local`
- `service_role`
- DB password
- private key
- API secret
- 테스트 비밀번호

force push와 Git history rewrite는 금지한다.

원격 Supabase 프로젝트: `nzsgxxuyvbirnlwtqmmc`.

`0008` / `0009` leftover는 적용하지 않는다. 승인 배수 persistence는 `0016`만 사용한다.

---

## 14. 중단하고 사용자에게 보고하는 경우

아래면 추측 실행하지 않고 보고한다.

- 6절의 승인 필요 작업
- Architecture 충돌
- Security 이슈
- 데이터 삭제 위험
- Git conflict
- Supabase 권한 문제
- 외부 인증 문제
- 명세 모순
- 안전하게 자동 수정할 수 없는 테스트 실패

그 외에는 다음 작업을 묻지 않고 Autopilot 루프를 계속한다.

---

## 15. 「오늘 작업 종료」 절차

사용자가 작업 종료를 지시하면:

1. 새 기능을 시작하지 않는다
2. 진행 중인 작업을 안전하게 마무리한다
3. 테스트를 돌린다
4. 필요한 안전한 Supabase만 적용한다
5. `git status`를 확인한다
6. 비밀값 없이 commit / push 한다
7. `origin/main`을 확인한다
8. secret check를 다시 한다
9. 개발 서버를 중지한다
10. Cursor를 닫아도 되는지를 보고한다

---

## 16. 사용자 개입이 필요할 때의 보고 형식

```text
[VERICOM 자율개발 상태 보고]
1. 현재 Sprint
2. 방금 완료한 작업
3. 테스트
4. Supabase
5. GitHub
6. 현재 문제
7. 사용자 개입 필요 여부
8. 다음 자동 작업
9. 중단 이유
```
