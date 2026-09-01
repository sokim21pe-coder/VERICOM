import { MACRO_MA_PROCESS } from "@/lib/deal/macro-process";
import { MACRO_STAGE_STATUS_LABEL } from "@/lib/deal/macro-process";
import type { MacroStageView } from "@/lib/deal/macro-process";

type MacroStageDetailPlaceholderProps = {
  view: MacroStageView;
  onClose: () => void;
};

const STAGE_TODO: Record<string, string[]> = {
  TEASER_L1: [
    "회사 기본정보·업종·제품/서비스 등록",
    "최근 3개년 재무(매출, EBITDA, Cash, Debt)",
    "LEVEL 1 가치평가 Range / 근거 / Confidence",
    "익명 Teaser 초안 · Seller 검토 · 최종 승인",
    "Hard Gate: TEASER_APPROVED 전 Outreach 불가",
  ],
  NDA: [
    "Buyer Interest, Seller Contact 승인, NDA Draft/발송/서명",
    "NDA 완료 ≠ 회사명 공개 ≠ IM 공개",
    "IDENTITY_RELEASE_APPROVAL · IM_RELEASE_APPROVAL은 별도",
  ],
  ADVISORY_L2: [
    "자문 제안서, Teaser Report, LEVEL 2 평가",
    "AI가 Valuation Multiple·최종 숫자를 생성하지 않음",
  ],
  MANDATE: [
    "Mandate Draft, Scope, Fee, Tail, Protected Buyer",
    "서명 이벤트 없이 체결 확정 금지",
    "Execution Authority 전 외부 접촉 금지",
  ],
  CIM_IM: [
    "Digital IM 구성·버전",
    "열람 조건: NDA_COMPLETED + IM_RELEASE_APPROVED",
    "VIEW / DOWNLOAD 권한 분리",
  ],
  LOI: [
    "복수 Buyer LOI, 비교, Preferred Bidder, Exclusivity",
    "문서 이벤트 없이 Signed 확정 금지",
    "IOI → Management Meeting → LOI 지원은 Phase 2",
  ],
  DD: [
    "FDD / LDD / TAX DD / CDD 병렬 Workstream",
    "VDR, Request List, Finding, Expert Review",
    "TOM(AI)은 초안·요약만, 최종 판단은 전문가",
  ],
  SPA: [
    "SPA Draft, R&W, Indemnity, Escrow, CP",
    "Finding ↔ SPA Issue 연결",
    "AI가 계약·체결을 확정하지 않음",
  ],
  CLOSING: [
    "Closing Checklist, 대금, 이전, 인허가",
    "Closing Event 확인 전 완료 안내 금지",
    "Success Fee Event는 Phase 3",
  ],
  PMI: [
    "Day 1 / 30 / 100, 시너지 KPI, Task/Owner",
    "Closing 이후 확장 모듈",
  ],
};

export function MacroStageDetailPlaceholder({
  view,
  onClose,
}: MacroStageDetailPlaceholderProps) {
  const def = MACRO_MA_PROCESS.find((item) => item.id === view.id);
  if (!def) return null;
  const todos = STAGE_TODO[view.id] ?? [];

  return (
    <aside className="rounded-xl border border-line bg-white p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] text-navy">
            {String(def.order).padStart(2, "0")} · 단계 상세
          </p>
          <h2 className="mt-1 text-lg font-semibold text-foreground">
            {def.label}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-sm text-muted hover:text-foreground"
        >
          닫기
        </button>
      </div>

      <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs text-muted">상태</dt>
          <dd className="mt-1 text-foreground">
            {MACRO_STAGE_STATUS_LABEL[view.status]}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted">진행률</dt>
          <dd className="mt-1 text-foreground">
            {view.progressPercent === null ? "TODO" : `${view.progressPercent}%`}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted">담당자</dt>
          <dd className="mt-1 text-foreground">{view.ownerName ?? "TODO"}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Waiting</dt>
          <dd className="mt-1 text-foreground">{view.waitingLabel ?? "없음"}</dd>
        </div>
      </dl>

      <div className="mt-5 space-y-3 text-sm">
        <p className="text-xs text-muted">필요한 문서</p>
        <ul className="list-disc pl-5 text-foreground">
          {view.requiredDocuments.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="text-xs text-muted">승인 대기</p>
        <ul className="list-disc pl-5 text-foreground">
          {view.pendingApprovals.length
            ? view.pendingApprovals.map((item) => <li key={item}>{item}</li>)
            : <li>없음</li>}
        </ul>
        <p className="text-xs text-muted">미완료 Task</p>
        <ul className="list-disc pl-5 text-foreground">
          {view.openTasks.length
            ? view.openTasks.map((item) => <li key={item}>{item}</li>)
            : <li>없음</li>}
        </ul>
        <p className="text-xs text-muted">TOM(AI) 추천 Next Action</p>
        <p className="leading-6 text-foreground">{view.tomNextAction}</p>
      </div>

      <p className="mt-6 text-xs leading-5 text-muted">
        내부 Deal Stage(참고, 삭제하지 않음):{" "}
        {def.relatedDealStages.length
          ? def.relatedDealStages.join(", ")
          : "PMI는 Closing 이후 확장 모듈"}
      </p>

      <div className="mt-4 rounded-lg border border-line bg-white p-4">
        <p className="text-xs font-medium text-navy">Phase 2 이후 TODO</p>
        <ul className="mt-2 list-disc pl-5 text-sm leading-6 text-muted">
          {todos.map((item) => (
            <li key={item}>{item}</li>
          ))}
          <li>Document / Approval / Task / Activity / Audit 연결</li>
        </ul>
      </div>
    </aside>
  );
}
