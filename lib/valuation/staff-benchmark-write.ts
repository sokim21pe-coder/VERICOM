import type { AccessibleDeal, CurrentContext } from "@/types/context";
import type {
  BenchmarkSourceType,
  ValuationBenchmark,
  ValuationConfidence,
  ValuationMethod,
} from "@/types/valuation";
import {
  canWriteApprovedBenchmarkForAssignedSeller,
  canWriteApprovedValuationBenchmark,
} from "@/lib/tom/access";
import { parseBenchmarkRatio } from "@/lib/valuation/approved-benchmark-persistence";

export type StaffBenchmarkTarget = {
  companyId: string;
  dealId: string;
  label: string;
};

export const STAFF_WRITE_METHODS = [
  "EV_SALES",
  "EV_EBITDA",
] as const satisfies readonly ValuationMethod[];

export const STAFF_WRITE_SOURCE_TYPES = [
  "INTERNAL_REVIEW",
  "MARKET_PROVIDER",
] as const satisfies readonly BenchmarkSourceType[];

const STAFF_SOURCE_TYPES = new Set<string>(STAFF_WRITE_SOURCE_TYPES);

export const staffBenchmarkWriteCopy = {
  staff_write_required: "전문가 또는 Internal만 승인 비교배수를 저장할 수 있습니다.",
  assigned_company_required:
    "배정된 Deal의 매각 회사에만 비교배수를 저장할 수 있습니다.",
  company_required: "매각 회사를 선택하세요.",
  source_required: "검증된 출처를 입력하세요. PLACEHOLDER는 허용되지 않습니다.",
  missing_provenance: "출처 유형과 기준일을 입력하세요.",
  multiple_missing: "Low / Base / High 중 하나 이상의 양수 배수가 필요합니다.",
  confirmation_required:
    "검증된 자료임을 확인해야 저장할 수 있습니다. 추정·LLM·업종 기본 배수는 저장하지 않습니다.",
  production_status_required:
    "이 화면에서는 승인됨(APPROVED)만 저장합니다. TEST_ONLY·UNVERIFIED는 저장하지 않습니다.",
  source_type_not_allowed:
    "이 화면에서는 내부 검토 또는 시장 자료만 허용합니다.",
  unique_conflict: "이미 같은 회사의 같은 평가방식 승인 배수가 있습니다.",
  method_not_allowed: "평가방식은 EV/Sales 또는 EV/EBITDA만 저장합니다.",
  method_check_rejected:
    "원격 데이터베이스가 아직 EV/EBITDA 평가방식을 허용하지 않습니다. 0017 마이그레이션만 적용해야 합니다.",
} as const;

export type StaffBenchmarkWriteReason = keyof typeof staffBenchmarkWriteCopy;

export type StaffBenchmarkFormInput = {
  companyId: string;
  dealId?: string | null;
  method?: string | null;
  multipleLow?: string | number | null;
  multipleBase?: string | number | null;
  multipleHigh?: string | number | null;
  source: string;
  sourceType: string;
  asOfDate: string;
  industry?: string | null;
  confidence: string;
  confirmed: boolean;
};

/** 배정 Deal의 seller_company_id만. 회사 목록을 전부 열지 않는다. */
export function staffBenchmarkTargetsFromDeals(
  deals: readonly AccessibleDeal[],
): StaffBenchmarkTarget[] {
  const seen = new Set<string>();
  const targets: StaffBenchmarkTarget[] = [];
  for (const deal of deals) {
    const companyId = deal.sellerCompanyId?.trim() ?? "";
    if (!companyId || seen.has(companyId)) continue;
    seen.add(companyId);
    const title = deal.title?.trim() || "배정 Deal";
    targets.push({
      companyId,
      dealId: deal.id,
      label: `${title} · 매각 회사`,
    });
  }
  return targets;
}

export function assignedSellerCompanyIds(
  deals: readonly AccessibleDeal[],
): string[] {
  return staffBenchmarkTargetsFromDeals(deals).map((item) => item.companyId);
}

function asStaffMethod(value: string): ValuationMethod | null {
  return value === "EV_SALES" || value === "EV_EBITDA" ? value : null;
}

function asStaffSourceType(value: string): BenchmarkSourceType | null {
  return STAFF_SOURCE_TYPES.has(value) ? (value as BenchmarkSourceType) : null;
}

function asConfidence(value: string): ValuationConfidence | null {
  return value === "LOW" || value === "MEDIUM" || value === "HIGH"
    ? value
    : null;
}

/** Production UI 입력. TEST_ONLY·UNVERIFIED·TEST_FIXTURE·기본 배수를 만들지 않는다. */
export function parseStaffApprovedBenchmarkForm(
  context: CurrentContext,
  input: StaffBenchmarkFormInput,
  assignedCompanyIds: readonly string[],
):
  | {
      ok: true;
      companyId: string;
      dealId: string | null;
      benchmark: ValuationBenchmark;
    }
  | { ok: false; reason: StaffBenchmarkWriteReason } {
  const companyId = input.companyId.trim();
  if (!companyId) return { ok: false, reason: "company_required" };
  if (!canWriteApprovedValuationBenchmark(context)) {
    return { ok: false, reason: "staff_write_required" };
  }
  if (
    !canWriteApprovedBenchmarkForAssignedSeller(
      context,
      companyId,
      assignedCompanyIds,
    )
  ) {
    return { ok: false, reason: "assigned_company_required" };
  }
  if (!input.confirmed) return { ok: false, reason: "confirmation_required" };

  const method = asStaffMethod((input.method ?? "").trim());
  if (!method) return { ok: false, reason: "method_not_allowed" };

  const source = input.source.trim();
  if (!source || source.toUpperCase() === "PLACEHOLDER") {
    return { ok: false, reason: "source_required" };
  }
  const sourceType = asStaffSourceType(input.sourceType);
  if (!sourceType) return { ok: false, reason: "source_type_not_allowed" };
  const asOfDate = input.asOfDate.trim();
  if (!asOfDate) return { ok: false, reason: "missing_provenance" };
  const confidence = asConfidence(input.confidence);
  if (!confidence) return { ok: false, reason: "missing_provenance" };

  const multipleLow = parseBenchmarkRatio(input.multipleLow);
  const multipleBase = parseBenchmarkRatio(input.multipleBase);
  const multipleHigh = parseBenchmarkRatio(input.multipleHigh);
  const hasMultiple = [multipleLow, multipleBase, multipleHigh].some(
    (value) => value != null && value > 0,
  );
  if (!hasMultiple) return { ok: false, reason: "multiple_missing" };

  const industry = input.industry?.trim() || null;
  const dealId = input.dealId?.trim() || null;

  return {
    ok: true,
    companyId,
    dealId,
    benchmark: {
      method,
      multiple: multipleBase ?? multipleLow ?? multipleHigh,
      multipleLow,
      multipleBase,
      multipleHigh,
      source,
      sourceType,
      asOfDate,
      industry,
      confidence,
      approvalStatus: "APPROVED",
      provenance: {
        source,
        sourceType,
        asOfDate,
        recordedAt: new Date().toISOString(),
        notes: "staff-approved-write",
      },
    },
  };
}
