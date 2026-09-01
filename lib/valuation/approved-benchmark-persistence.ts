import type { SupabaseClient } from "@supabase/supabase-js";
import type { CurrentContext } from "@/types/context";
import type {
  ApprovedBenchmarkRecord,
  ApprovedBenchmarkRow,
  BenchmarkApprovalStatus,
  BenchmarkSourceType,
  ValuationBenchmark,
  ValuationBenchmarkProvenance,
  ValuationConfidence,
  ValuationMethod,
} from "@/types/valuation";
import { canWriteApprovedValuationBenchmark } from "@/lib/tom/access";

const SOURCE_TYPES = new Set<BenchmarkSourceType>([
  "TEST_FIXTURE",
  "INTERNAL_REVIEW",
  "MARKET_PROVIDER",
  "UNKNOWN",
]);

const APPROVAL_STATUSES = new Set<BenchmarkApprovalStatus>([
  "TEST_ONLY",
  "UNVERIFIED",
  "APPROVED",
]);

const CONFIDENCES = new Set<ValuationConfidence>(["LOW", "MEDIUM", "HIGH"]);

/** numeric 컬럼을 비율로 읽는다. 추정·placeholder를 만들지 않는다. */
export function parseBenchmarkRatio(
  value: string | number | null | undefined,
): number | null {
  if (value == null) return null;
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!/^-?\d+(\.\d+)?$/.test(trimmed)) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function asMethod(value: string): ValuationMethod | null {
  return value === "EV_SALES" || value === "EV_EBITDA" ? value : null;
}

function asSourceType(value: string): BenchmarkSourceType | null {
  return SOURCE_TYPES.has(value as BenchmarkSourceType)
    ? (value as BenchmarkSourceType)
    : null;
}

function asApproval(value: string): BenchmarkApprovalStatus | null {
  return APPROVAL_STATUSES.has(value as BenchmarkApprovalStatus)
    ? (value as BenchmarkApprovalStatus)
    : null;
}

function asConfidence(value: string): ValuationConfidence | null {
  return CONFIDENCES.has(value as ValuationConfidence)
    ? (value as ValuationConfidence)
    : null;
}

function provenanceFromRow(
  row: ApprovedBenchmarkRow,
): ValuationBenchmarkProvenance {
  const raw = row.provenance;
  const source =
    (raw && typeof raw === "object" && "source" in raw
      ? String(raw.source ?? "").trim()
      : "") || row.source.trim();
  const sourceType =
    raw && typeof raw === "object" && "sourceType" in raw
      ? asSourceType(String(raw.sourceType ?? ""))
      : asSourceType(row.source_type);
  const asOfDate =
    raw && typeof raw === "object" && "asOfDate" in raw
      ? (raw.asOfDate ? String(raw.asOfDate) : null)
      : row.as_of_date;
  const recordedAt =
    raw && typeof raw === "object" && "recordedAt" in raw
      ? raw.recordedAt
        ? String(raw.recordedAt)
        : null
      : (row.created_at ?? null);
  const notes =
    raw && typeof raw === "object" && "notes" in raw
      ? raw.notes
        ? String(raw.notes)
        : null
      : null;
  return {
    source,
    sourceType: sourceType ?? "UNKNOWN",
    asOfDate,
    recordedAt,
    notes,
  };
}

/** DB 행 → lookup record. 매핑 실패는 null. 배수를 발명하지 않는다. */
export function mapApprovedBenchmarkRow(
  row: ApprovedBenchmarkRow,
): ApprovedBenchmarkRecord | null {
  const method = asMethod(row.method);
  const sourceType = asSourceType(row.source_type);
  const approvalStatus = asApproval(row.approval_status);
  const confidence = asConfidence(row.confidence);
  const source = row.source.trim();
  if (!row.company_id || !method || !sourceType || !approvalStatus) return null;
  if (!confidence || !source || source === "PLACEHOLDER") return null;
  if (!row.as_of_date) return null;

  const benchmark: ValuationBenchmark = {
    method,
    multiple: parseBenchmarkRatio(row.multiple),
    multipleLow: parseBenchmarkRatio(row.multiple_low),
    multipleBase: parseBenchmarkRatio(row.multiple_base),
    multipleHigh: parseBenchmarkRatio(row.multiple_high),
    source,
    sourceType,
    asOfDate: row.as_of_date,
    industry: row.industry ?? null,
    confidence,
    approvalStatus,
    provenance: provenanceFromRow(row),
  };

  return {
    sellerCompanyId: row.company_id,
    conversationId: row.conversation_id ?? null,
    dealId: row.deal_id ?? null,
    benchmark,
  };
}

/** 회사 A 행만 남긴다. 회사 B는 A의 배수를 보지 못한다. */
export function filterBenchmarkRowsForCompany(
  rows: readonly ApprovedBenchmarkRow[],
  sellerCompanyId: string | null,
): ApprovedBenchmarkRecord[] {
  if (!sellerCompanyId) return [];
  return rows
    .filter((row) => row.company_id === sellerCompanyId)
    .map(mapApprovedBenchmarkRow)
    .filter((item): item is ApprovedBenchmarkRecord => item != null);
}

export type ApprovedBenchmarkWriteInput = {
  companyId: string;
  conversationId?: string | null;
  dealId?: string | null;
  benchmark: ValuationBenchmark;
};

/** Staff CurrentContext만 INSERT 행을 만든다. Seller/Client 배수는 거절한다. */
export function buildApprovedBenchmarkInsert(
  context: CurrentContext,
  input: ApprovedBenchmarkWriteInput,
):
  | { ok: true; row: ApprovedBenchmarkRow }
  | { ok: false; reason: string } {
  if (!canWriteApprovedValuationBenchmark(context)) {
    return { ok: false, reason: "staff_write_required" };
  }
  if (!input.companyId.trim()) {
    return { ok: false, reason: "company_required" };
  }
  const { benchmark } = input;
  if (benchmark.method !== "EV_SALES") {
    return { ok: false, reason: "method_mismatch" };
  }
  const source = benchmark.source.trim();
  if (!source || source === "PLACEHOLDER") {
    return { ok: false, reason: "source_required" };
  }
  if (!benchmark.sourceType || benchmark.sourceType === "UNKNOWN") {
    return { ok: false, reason: "missing_provenance" };
  }
  if (!benchmark.asOfDate) {
    return { ok: false, reason: "missing_provenance" };
  }
  const hasMultiple = [
    benchmark.multiple,
    benchmark.multipleBase,
    benchmark.multipleLow,
    benchmark.multipleHigh,
  ].some((value) => value != null && Number.isFinite(value) && value > 0);
  if (benchmark.approvalStatus === "APPROVED" && !hasMultiple) {
    return { ok: false, reason: "multiple_missing" };
  }

  return {
    ok: true,
    row: {
      company_id: input.companyId,
      conversation_id: input.conversationId ?? null,
      deal_id: input.dealId ?? null,
      method: "EV_SALES",
      multiple: benchmark.multiple,
      multiple_low: benchmark.multipleLow,
      multiple_base: benchmark.multipleBase,
      multiple_high: benchmark.multipleHigh,
      source,
      source_type: benchmark.sourceType,
      as_of_date: benchmark.asOfDate,
      industry: benchmark.industry,
      confidence: benchmark.confidence,
      approval_status: benchmark.approvalStatus,
      provenance: benchmark.provenance ?? {
        source,
        sourceType: benchmark.sourceType,
        asOfDate: benchmark.asOfDate,
        recordedAt: new Date().toISOString(),
        notes: null,
      },
      created_by: context.user.id,
    },
  };
}

/**
 * Staff-only persist. TOM/LLM/Seller UI는 호출하지 않는다.
 * created_by는 CurrentContext user이며 client 값을 믿지 않는다.
 */
export async function persistApprovedEvSalesBenchmark(
  supabase: SupabaseClient,
  context: CurrentContext,
  input: ApprovedBenchmarkWriteInput,
): Promise<{ ok: true; id: string } | { ok: false; reason: string }> {
  const built = buildApprovedBenchmarkInsert(context, input);
  if (!built.ok) return built;

  const { data, error } = await supabase
    .from("approved_valuation_benchmarks")
    .insert(built.row)
    .select("id")
    .single();

  if (error || !data?.id) {
    if (error?.code === "42501") return { ok: false, reason: "rls_denied" };
    if (error?.code === "23505") return { ok: false, reason: "unique_conflict" };
    return { ok: false, reason: "insert_failed" };
  }
  return { ok: true, id: data.id as string };
}
