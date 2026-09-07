# VERICOM Standard M&A Operating Workflow

> **문서 성격:** 사용자 확정 **Standard M&A Operating Flow**. VERICOM의 M&A **업무 단계(순서)** 에 관한 **최상위 기준(Source of Truth)**.
> **지정일:** 2026-09-07
> **적용 범위:** Seller-side / Buyer-side 제품 개발 전반 — 화면 구조, 메뉴, 단계 표시, Deal Stage, TOM 다음 행동 추천, Seller/Buyer Workspace, 문서 생성 순서, Approval Gate, Opportunity 진행상태, Notification, Checklist, VDR 공개시점, Expert/Advisor 개입시점, Analytics, Deal Timeline.
> **주의:** 이 문서는 **업무 단계 순서**에 한해 최상위이다. Architecture / Security / Permission / RLS / Audit 원칙은 `MASTER_SPEC.md`가 계속 최상위이며 **절대 약화하지 않는다**.

---

## 1. 목적과 위상

이 문서는 단순한 서비스소개 문구가 아니라, 앞으로 VERICOM의 M&A 업무 플로우를 설계·개발할 때 **기본값(default)** 으로 사용하는 표준 거래진행흐름이다.

Cursor(및 자율 개발)는 일반적인 M&A 관행, 기존 코드, 과거 문서, 다른 템플릿, 과거 구현, AI 판단을 이유로 **이 순서를 임의로 바꾸지 않는다.** 단, 4절 예외 원칙에 따라 실제 Deal 단위로 override 될 수 있다.

---

## 2. 충돌 우선순위 (Governance)

M&A **업무 단계 순서**가 서로 다르게 정의되어 있으면 다음 우선순위를 적용한다.

1. **사용자 확정 M&A Standard Workflow** (이 문서)
2. `MASTER_SPEC.md` 의 핵심 **Architecture / Security** 원칙
3. `docs/DECISIONS.md` 의 최신 결정
4. 현재 코드
5. 과거 문서 / 임시 구현

**중요:** 위 우선순위는 *업무 단계 순서* 충돌에만 적용한다. **Security / Permission / Audit / RLS / Approval Gate 는 어떤 경우에도 약화하지 않는다.** 순서를 맞춘다는 이유로 Gate를 단순화하거나 제거하지 않는다.

---

## 3. Standard Flow (사용자 확정)

### 3.1 매각 측 (Seller) — 13단계

| # | 단계 (표시명) | Stage Key |
|---|---|---|
| 1 | 초기 상담 및 기업 파악 | `DISCOVERY` |
| 2 | 티저 작성·배포 | `TEASER` |
| 3 | 비밀유지계약 체결 | `NDA` |
| 4 | 재무자료 정리 | `FINANCIAL` |
| 5 | 자문계약 | `MANDATE` |
| 6 | 기업가치 평가 | `VALUATION` |
| 7 | 기업소개자료(IM/CIM) 제공 | `IM_CIM` |
| 8 | 경영진 미팅 | `MANAGEMENT_MEETING` |
| 9 | 인수의향서(IOI) / 인수제안서(LOI) | `IOI_LOI` |
| 10 | 실사 | `DUE_DILIGENCE` |
| 11 | 주식매매계약 협상·체결 | `SPA` |
| 12 | 거래종결 | `CLOSING` |
| 13 | 인수 후 통합 | `PMI` |

```text
초기 상담 및 기업 파악 → 티저 작성·배포 → 비밀유지계약 체결 → 재무자료 정리
→ 자문계약 → 기업가치 평가 → 기업소개자료(IM/CIM) 제공 → 경영진 미팅
→ 인수의향서(IOI) / 인수제안서(LOI) → 실사 → 주식매매계약 협상·체결
→ 거래종결 → 인수 후 통합
```

### 3.2 인수 측 (Buyer) — 13단계

| # | 단계 (표시명) | Stage Key |
|---|---|---|
| 1 | 인수조건 설정 | `ACQUISITION_CRITERIA` |
| 2 | 인수후보 검토 | `TARGET_REVIEW` |
| 3 | 인수전략 수립 | `ACQUISITION_STRATEGY` |
| 4 | 비밀유지계약 체결 | `NDA` |
| 5 | 매각기업 소개 및 티저 제공 | `TEASER_REVIEW` |
| 6 | 자문계약 | `MANDATE` |
| 7 | 기업소개자료(IM/CIM) 검토 | `IM_CIM_REVIEW` |
| 8 | 경영진 미팅 | `MANAGEMENT_MEETING` |
| 9 | 인수의향서(IOI) / 인수제안서(LOI) | `IOI_LOI` |
| 10 | 실사 | `DUE_DILIGENCE` |
| 11 | 주식매매계약 협상·체결 | `SPA` |
| 12 | 거래종결 | `CLOSING` |
| 13 | 인수 후 통합 | `PMI` |

```text
인수조건 설정 → 인수후보 검토 → 인수전략 수립 → 비밀유지계약 체결
→ 매각기업 소개 및 티저 제공 → 자문계약 → 기업소개자료(IM/CIM) 검토
→ 경영진 미팅 → 인수의향서(IOI) / 인수제안서(LOI) → 실사
→ 주식매매계약 협상·체결 → 거래종결 → 인수 후 통합
```

> **Seller와 Buyer의 Stage는 하나의 enum으로 억지로 합치지 않는다.** 공통 상위 개념이 필요하면 별도 **Deal Phase** abstraction(8절)을 사용한다.

**코드상 라벨 SoT:** `lib/landing/ma-workflow.ts` (`SELLER_WORKFLOW`, `BUYER_WORKFLOW`) 가 위 표시명·순서와 이미 일치한다. Stage Key는 이 문서가 정의하며, 코드 반영은 6절/9절 계획에 따른다.

---

## 4. 예외 원칙 — Standard Flow + Deal-specific Adjustment

이 Workflow는 **기본 표준**이다. 실제 거래에서는 다음 요인에 따라 일부 단계가 **생략 / 병행 / 순서 조정** 될 수 있다.

- 거래구조 · 경쟁매각 vs 개별협상 · 당사자 합의
- 거래 규모 · 긴급성 · Advisor 개입 여부
- 자료 준비 상태 · 규제/승인 · Deal 특성

**설계 원칙:** 기본 Workflow를 지우거나 바꾸지 않는다. 대신 **Deal별 override** 가 가능한 구조로 설계한다.

```text
Standard Flow  +  Deal-specific Adjustment(생략/병행/순서조정 + 사유 기록)
```

예: Buyer가 MM 없이 LOI를 제출하면 `MANAGEMENT_MEETING` 생략 + 사유를 기록한 뒤 `IOI_LOI` 로 진행한다(기존 `MASTER_SPEC` §7.7 예외와 동일 취지).

---

## 5. Mandate(자문계약) 정의

- **Mandate ≠ VERICOM 플랫폼 이용계약.** 플랫폼 이용계약과 명확히 구분한다.
- Mandate = **M&A Advisor를 공식 선임**할 때 업무범위·보수·기간·역할을 정하는 **자문계약**이다.
- **Self-Service** 사용자는 Mandate 없이 진행할 수 있다.
- DB/Stage 설계 시 `MANDATE_REQUIRED` / `MANDATE_NOT_REQUIRED` 같은 **단순 필수/비필수 boolean으로 거래 전체를 강제하지 않는다.** **Advisor-Assisted 여부**와 연결해 설계한다.

이용 모드: `Self-Service` · `AI-Assisted` · `Advisor-Assisted(자문계약)` · `Expert-Assisted`.

---

## 6. Security Gate 관계

아래 보안 Gate는 이 Workflow 안에서도 그대로 유지한다(순서 정렬을 이유로 삭제·단순화 금지).

- Teaser approval
- Seller contact approval
- NDA
- Identity release approval
- IM release approval
- Buyer isolation (Buyer 상호 격리)
- Expert scoped access (배정 Deal 범위 한정)

중요 실행은 `Draft → Review → Explicit Approval → Execute → Audit` 를 유지한다. Messaging Access 와 Identity / IM / Document Access 는 독립이다(`MASTER_SPEC` 0.4절, §4.x, §7.7).

**Stage 전환은 문서/데이터 존재만으로 자동 확정하지 않는다.** 실제 사용자 행동 · 승인 · Deal Event 가 Stage의 Source of Truth이다.

---

## 7. UI 적용 범위

아래 화면은 모두 이 Workflow와 **동일한 순서**를 사용한다. 화면마다 다른 순서를 쓰지 않는다.

메인페이지 · 서비스소개 · Seller Workspace · Buyer Workspace · Deal Timeline · Progress Indicator · TOM next step · Document Checklist · VDR 단계 · Expert panel · Advisor panel · Closing checklist.

현재 메인/서비스소개는 `lib/landing/ma-workflow.ts` 를 통해 이미 이 순서를 사용한다.

---

## 8. Stage Mapping 설계

### 8.1 Seller / Buyer 별도 Stage
Seller/Buyer Stage Key는 3절 표와 같다. **하나의 enum으로 합치지 않는다.**

### 8.2 공통 Deal Phase (선택적 abstraction)
공통 상위 진행 표시가 필요하면 아래처럼 **매핑 전용** Phase를 둔다(강제 아님).

| Deal Phase | Seller Stage | Buyer Stage |
|---|---|---|
| PREPARE | DISCOVERY, TEASER, FINANCIAL, VALUATION | ACQUISITION_CRITERIA, TARGET_REVIEW, ACQUISITION_STRATEGY |
| ENGAGE | NDA, MANDATE, IM_CIM | NDA, TEASER_REVIEW, MANDATE, IM_CIM_REVIEW |
| EVALUATE | MANAGEMENT_MEETING, IOI_LOI, DUE_DILIGENCE | MANAGEMENT_MEETING, IOI_LOI, DUE_DILIGENCE |
| EXECUTE | SPA, CLOSING | SPA, CLOSING |
| INTEGRATE | PMI | PMI |

### 8.3 기존 내부 Stage와의 관계
- `types/enums.ts` 의 `DealStage`(내부 16단계) / `OpportunityStage`(Buyer path) 는 **삭제/개명하지 않는다.** 내부 sub-state machine으로 유지하고, 표준 Stage에서 **from-mapping** 한다.
- `MASTER_SPEC` §7.2 / §7.3 / §7.7 는 유지하되, **사용자 대상 거래진행흐름의 순서 기준은 이 문서**임을 §7.7 에 명시한다.

---

## 9. TOM 적용 원칙

- TOM의 다음 질문 / 다음 행동 추천은 이 Workflow를 기준으로 한다. 예: Seller가 `DISCOVERY` 단계이면 무조건 `VALUATION` 으로 건너뛰지 않고, 표준 Flow + 현재 데이터 상태를 함께 보고 판단한다. Buyer도 동일.
- **TOM은 Deal Stage를 임의로 확정하지 못한다.** Stage 전환 SoT = 실제 사용자 행동 / 승인 / Event.
- 현재 코드의 `dealStage` 는 항상 `null` 이다(9절/충돌표 참조). Stage persistence 후 서버 `CurrentContext` 에서 채운다.

---

## 10. 문서 생성 순서

문서 생성도 이 순서를 참조한다(문서 부재만으로 Stage 자동 확정 금지).

- **Seller:** 티저 → NDA → 재무자료 정리 → 자문계약 → 가치평가 → IM/CIM → MM 자료 → IOI/LOI → DD → SPA → Closing
- **Buyer:** 인수조건 → 후보검토 → 인수전략 → NDA → 티저 검토 → 자문계약 → IM/CIM 검토 → MM → IOI/LOI → DD → SPA → Closing

---

## 11. 개발 우선순위 규칙

향후 새 Feature Slice를 고를 때 반드시 먼저 판단한다.

1. 이 기능이 Standard Workflow의 **어느 단계**에 해당하는가?
2. **앞 단계 prerequisite** 가 완료되어 있는가?

기능을 무작위 순서로 개발하지 않고, **표준 거래진행흐름 + 현재 Sprint(`MASTER_SPEC` §33 Roadmap)** 를 함께 기준으로 개발한다. (`docs/DEVELOPMENT_AUTOPILOT.md` 참조)

---

## 12. 현재 코드 충돌 인벤토리 (2026-09-07 조사)

| 위치 | 현재 상태 | 표준과의 충돌 |
|---|---|---|
| `lib/landing/ma-workflow.ts` | Seller/Buyer 13단계 **라벨·순서 일치** | 없음. Stage Key 미포함(라벨만) → 키 추가 필요 |
| `lib/deal/macro-process.ts` (`MACRO_MA_PROCESS`, 10단계) | `TEASER_L1, NDA, ADVISORY_L2, MANDATE, CIM_IM, LOI, DD, SPA, CLOSING, PMI` | Seller 전용/10단계. `DISCOVERY·FINANCIAL·VALUATION·MANAGEMENT_MEETING·IOI` 분리 없음. `ADVISORY_L2` 추가 단계. Buyer 부재 |
| `types/enums.ts` `DealStage` (16) | `DISCOVERY→VALUATION→BUYER_SEARCH→…→TEASER→…` | 순서 상이(VALUATION이 TEASER보다 앞). `FINANCIAL`·`IM_CIM`·`IOI_LOI` 키 부재. `QNA`는 spec에만 |
| `types/enums.ts` `OpportunityStage` (15) | Buyer path 상태 | 표준 Buyer Stage와 개념 다름(격리/승인 중심). 매핑 대상 |
| Buyer Stage enum | **없음** | 표준 Buyer 13 Stage Key 코드 부재 |
| `components/deal/*` (`SellerDealProcess`·`DealProgressBar`·`MacroStageCard`·`MacroStageDetailPlaceholder`) | `MACRO_MA_PROCESS` 10단계 사용(현재 어떤 `app/` 페이지에도 mount 안 됨) | 표준 13단계와 불일치 |
| `lib/landing/journey-pages.ts` + `/about/process/[slug]` | 10 macro slug 설명 페이지 | 표준 13단계와 불일치(참고용 설명 페이지) |
| `MASTER_SPEC.md` §7.7 | 12단계(Q&A·MM 포함, DISCOVERY/FINANCIAL 분리 없음, Buyer path 없음) | 표준 13단계와 상이 → §7.7에 “사용자 대상 순서는 이 문서 우선” 명시 |
| TOM (`lib/tom/*`) | `dealStage` 항상 `null` | Stage 인식 next-action 미구현 |
| DB (`supabase/migrations/*`) | `deals.status='draft'` 만 존재. stage 컬럼/enum 없음 | Stage persistence 부재 |

---

## 13. DB 영향 및 안전 원칙

- **현재 Production에 Deal 데이터가 있을 수 있으므로**, Stage enum / constraint / migration 변경 시 기존 데이터 호환성을 먼저 검토한다.
- **금지:** destructive migration, 기존 Stage 값 무단 삭제, data reset, truncate, 전체 `db push`, Production 데이터 임의 변경.
- Stage persistence는 **추가형(additive) · nullable · 하위호환** 으로만 도입한다(컬럼/인덱스/RLS 추가). 기존 컬럼 삭제·개명·CHECK 강화는 별도 승인 후.

---

## 14. 안전한 단계적 수정 계획 (Migration Plan)

- **Phase A — 문서/거버넌스 (이번 턴, 완료):** 이 문서 생성, `MASTER_SPEC`·`AUTOPILOT`·`DECISIONS` 참조 연결. 코드/DB 미변경.
- **Phase B — 코드 상수화 (다음, 비파괴):** 표준 Stage Key/순서/매핑을 코드 상수로 정의(예: `lib/deal/standard-workflow.ts`)하고 `lib/landing/ma-workflow.ts` 각 단계에 `key` 추가. UI 동작 변화 없음(라벨/순서 그대로). Enum/DB 미변경.
- **Phase C — DB 추가형 persistence (승인 후):** `deals`(Seller)·participant/opportunity(Buyer)에 **nullable** stage 컬럼 + `deal_stage_events` audit 테이블 추가, RLS 추가(약화 금지). 기존 값 보존.
- **Phase D — TOM Stage 인식:** 서버 `CurrentContext` 에서 persisted stage를 읽어 next-action 추천에 반영. Stage 확정은 사용자 행동/승인/Event.
- **Phase E — 내부 모델 정합화(대규모, 승인 후):** `MACRO_MA_PROCESS`/`DealStage`/§7.7 를 표준으로 정합화(`ADVISORY_L2` 재배치, `FINANCIAL`·`MANAGEMENT_MEETING` 분리, `IOI`/`LOI` 표시 정리). enum/DB 영향 큼 → 승인·회귀검증 필수.

각 Phase는 독립적으로 검증 가능하며, C 이후는 `docs/DEVELOPMENT_AUTOPILOT.md` §6 승인 필요 작업에 해당한다.

---

## 15. 참조

- `MASTER_SPEC.md` §7.1~§7.7 (Deal/Opportunity Stage, 표준 Macro Process), 0.3·0.4절
- `docs/DECISIONS.md` (2026-09-07 지정 결정)
- `docs/DEVELOPMENT_AUTOPILOT.md` §1 필수 문서, §11·§12
- `lib/landing/ma-workflow.ts` (라벨·순서 코드 SoT)
