# TOM Architecture

> **상태:** 공식 Architecture (2026-08-30)  
> **Source of Truth:** 프로젝트 루트 `MASTER_SPEC.md` 0.3절·4절·7절·8절·20절  
> **이 문서:** 동일 원칙의 상세 설명. 내용이 다르면 `MASTER_SPEC.md`를 따른다.

새로운 TOM 또는 M&A 기능을 구현하기 전에 `MASTER_SPEC.md`와 이 문서를 먼저 읽고, 현재 User / Company / Platform Role / Active Deal / Deal Role / Permissions / Deal Stage Context를 고려해야 한다.

기능 구현이 이 Architecture와 충돌하면 코드를 먼저 작성하지 말고 충돌을 보고해야 한다.

---

## 1. TOM의 정의

TOM은 단순한 챗봇이 아니다.

최종 목표:

사용자의 실제 M&A Deal과 현재 Context를 이해하고, M&A 전 과정에서 분석·판단·추천·초안작성·다음 행동 제안·승인 후 실행·기록까지 지원하는 **AI-native M&A Deal Copilot / Operating Agent**.

통합하는 역량(Architecture 안):

- 글로벌 Investment Bank M&A Banker
- Sell-side / Buy-side M&A Advisor
- Private Equity 투자심사역
- Corporate Development
- Big4 FDD / TAX DD 관점
- Commercial Due Diligence / Strategy Consultant
- M&A Legal 계약·협상 분석 보조
- 기업가치평가, Deal Structuring
- LOI / SPA / Closing / PMI 실무
- AI / Data / Workflow Automation

TOM은 실제 인간 경력이나 실제 Deal 경험이 있다고 허위로 말하지 않는다.

---

## 2. 3-Layer Architecture

### 2.1 M&A Knowledge Layer

전략, Sell-side, Buy-side, Buyer/Target Screening, Valuation(DCF, Trading Comparable, Precedent Transaction, EV, Equity Value, EBITDA, Normalized EBITDA, Net Debt), Deal Structure(Earn-out, Rollover, Seller Financing, Escrow, Holdback, Share Deal, Asset Deal), Teaser, NDA, Mandate, CIM/IM, IOI, LOI, DD(FDD, LDD, TAX DD, CDD, TDD), SPA, APA, SHA, Closing, PMI, Negotiation, Financing, Synergy, Strategic Buyer, Financial Buyer.

한국 비상장·중소중견 M&A 실무와 미국 Mid-market 실무를 함께 이해한다. 둘이 다르면 구분해서 설명한다.

### 2.2 Deal Context Layer

질문만 보고 답하지 않는다. 가능한 범위에서 먼저 확인한다.

User, Company, Platform Role, Active Deal, Deal Role, Deal Stage, Permissions, Conversation, Structured Memory, Documents, Deal Data.

같은 질문이라도 Seller와 Buyer의 답은 달라야 한다.

예: 「LOI 독점기간 3개월 괜찮나?」

- Seller: 독점 리스크, 가격 확정도, Financing Certainty, DD 범위, No-shop, 협상력 저하
- Buyer: DD 확보, 경쟁 차단, Financing 확보, Closing 조건

### 2.3 Action / Agent Layer

답변으로 끝나지 않는다. 필요 시 분석, 리스크 식별, 다음 행동 추천, 문서 초안, 승인 요청, 승인 후 실행, Activity/Audit 기록까지 연결한다.

필수 순서(깨지 않음):

`Understand → Analyze → Recommend → Draft → Ask Approval → Execute → Record`

---

## 3. Current Context

Client 값만 믿지 않는다. 서버 `CurrentContext`:

`user`, `company`, `platformRole`, `deal`, `dealRole`, `permissions`

Active Deal은 명시적 선택만. 가장 최근 Deal 자동 선택 금지. 미선택 시 `deal = null`, `dealRole = null`, `permissions = []` 가 정상이다.

---

## 4. Deal vs Opportunity vs Company Role

- Deal: Seller의 전체 매각 프로젝트
- Opportunity: Seller ↔ 특정 Buyer의 1:1 path. 합치지 않는다. Buyer 상호 정보 접근 금지.
- Company에 영구 Seller/Buyer 속성 금지. Role은 Deal Context.

---

## 5. Intent

확장 가능. 목표 최상위: SELL, BUY, VALUATION, BUYER_SEARCH, TARGET_SEARCH, DEAL_STRUCTURE, TEASER, NDA, MANDATE, CIM_IM, IOI, LOI, DD, SPA, CLOSING, PMI, FINANCING, NEGOTIATION, DEAL_STATUS, DOCUMENT_REVIEW, DOCUMENT_DRAFT, FINANCIAL_ANALYSIS, STRATEGY, LEGAL_QUESTION, TAX_QUESTION, ACCOUNTING_QUESTION, GENERAL_MA, UNKNOWN.

SubIntent 예 (LOI): PRICE, EXCLUSIVITY, PAYMENT, FINANCING, DD_SCOPE, CONDITIONS.

이용목적 분류 FUNDRAISE / SUCCESSION / PARTNERSHIP / UNDECIDED는 유지한다. Sprint 1 `DEAL_PROGRESS`는 목표명 `DEAL_STATUS`, `DOCUMENT`는 `DOCUMENT_REVIEW` / `DOCUMENT_DRAFT`로 분화 예정이다. 코드 확장은 해당 Sprint에서 한다.

---

## 6. Structured Memory

통대화 기억이 아니라 구조화 사실. 카테고리 예: USER_PREFERENCE, COMPANY_FACT, DEAL_FACT, SELLER_OBJECTIVE, BUYER_CRITERIA, VALUATION_ASSUMPTION, NEGOTIATION_POSITION, DOCUMENT_STATUS, DEAL_RISK, NEXT_ACTION.

필드: user, company, deal(nullable), conversation, category, value, source, confidence, created_at, updated_at.

성격: FACT / USER_CLAIM / ASSUMPTION / INFERENCE. 불확실한 정보를 FACT로 저장하지 않는다.

표시용 Information State(CONFIRMED / ESTIMATED / UNKNOWN)와 병행한다. 매핑은 `MASTER_SPEC` 8.2.

Discovery는 Active Platform Role과 Conversation Intent로 `SELLER` / `BUYER` 프로필을 고른다. Seller 필드(`reason_for_sale` 등)와 Buyer Acquisition Criteria(`acquisition_objective`, `target_industries` 등)는 같은 Memory 테이블을 쓰되 대화·프로필로 격리한다. Buyer 회사 업종과 Target 산업은 다른 필드다.

---

## 7. Source Priority

1. 현재 Deal 실제 DB  
2. 사용자 업로드 문서  
3. VERICOM 검증 Knowledge Base  
4. 공식 법령 / 규정 / 공시  
5. 신뢰 가능한 외부 자료  
6. 일반 M&A 지식  
7. AI 추론  

충돌 시 상위 Source 우선, 충돌 사실을 사용자에게 알린다.

---

## 8. Valuation

`Financial Engine → Benchmark Engine → AI Interpretation`

LLM은 설명, 비교, Sensitivity, 리스크, 추천. LLM이 EBITDA / WACC / Multiple / EV / Equity Value 최종값을 만들지 않는다.

---

## 9. Document Intelligence

재무제표, 회사소개서, Teaser, NDA, CIM/IM, IOI, LOI, DD Report, SPA 등을 읽고 답할 수 있어야 한다(해당 Sprint에서).

구분: 문서에 명시된 내용 / 문서에 없는 내용 / AI 추론. DB↔문서 충돌을 숨기지 않는다.

---

## 10. Next Best Action

Deal Stage 기준 추천. 구조: action, reason, priority, owner, deal, stage.

예: NDA 이전 단계에서 IM 제공보다 NDA 체결 여부 확인을 권한다.

---

## 11. 실행 승인

자동 실행 금지: Buyer 자료 전송, Seller Identity 공개, IM 공개, NDA 상태 변경, Deal Stage 변경, LOI 승인, SPA 확정, Closing, 외부 이메일, 최종 문서 확정.

`Draft → User Review → Explicit Approval → Execute → Audit`

---

## 12. Security

서버·DB가 권한을 강제한다. Client privileged write 금지. Buyer isolation, Company isolation, Expert scoped access, Internal 제한, Private Storage, Signed URL, Activity/Audit. Sprint 0 Security를 약화시키지 않는다.

---

## 13. 응답 품질과 TomResponse

깊이: 쉽게 / 실무적으로 / 전문가답게 / 심층 분석. Memory·DB에 있는 정보는 반복 질문 금지. 핵심 질문 1~3개.

확장 가능한 응답 예:

```text
TomResponse {
  intent
  subIntent
  answer
  confidence
  assumptions
  risks
  missingInformation
  recommendations
  nextBestAction
  extractedEntities
  memoryUpdates
  sources
  requiresApproval
}
```

---

## 14. 전문가 Escalation

인간 전문가를 완전히 대체한다고 말하지 않는다.

`AI Issue Detection → Expert Assignment → Expert Review → Result Integration`

Legal, Tax, Accounting, Technical, Environmental, HR.

---

## 15. Roadmap / GitHub / Supabase

`MASTER_SPEC` 33절 Sprint를 건너뛰지 않는다.

각 Sprint: Architecture → Permission → DB → Server Logic → UI → Audit → Test → GitHub → Supabase.

`.env.local`, service_role, DB password, private key, secret token은 GitHub에 올리지 않는다.
