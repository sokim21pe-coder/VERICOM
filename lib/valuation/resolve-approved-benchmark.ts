import type { SupabaseClient } from "@supabase/supabase-js";
import { calculateEvSales, formatSellerLevel0Copy } from "@/lib/valuation/ev-sales";
import { filterBenchmarkRowsForCompany } from "@/lib/valuation/approved-benchmark-persistence";
import type { NormalizedFinancialInputs } from "@/lib/valuation/normalize-financial-inputs";
import type {
  ApprovedBenchmarkLookupQuery,
  ApprovedBenchmarkLookupResult,
  ApprovedBenchmarkRecord,
  ApprovedBenchmarkRow,
  FinancialInput,
  ValuationBenchmark,
  ValuationCalculation,
} from "@/types/valuation";

/**
 * Process-local store for unit tests only.
 * Production loads APPROVED rows from approved_valuation_benchmarks.
 * Never a global industry default. 0009 PLACEHOLDER schema is not used.
 */
const approvedRecordsByCompany = new Map<string, ApprovedBenchmarkRecord>();

function hasPositiveMultiple(benchmark: ValuationBenchmark): boolean {
  const candidates = [
    benchmark.multiple,
    benchmark.multipleBase,
    benchmark.multipleLow,
    benchmark.multipleHigh,
  ];
  return candidates.some(
    (value) => value != null && Number.isFinite(value) && value > 0,
  );
}

function provenanceFrom(benchmark: ValuationBenchmark) {
  const source = benchmark.provenance?.source?.trim() || benchmark.source.trim();
  const sourceType = benchmark.provenance?.sourceType ?? benchmark.sourceType;
  const asOfDate = benchmark.provenance?.asOfDate ?? benchmark.asOfDate;
  return { source, sourceType, asOfDate };
}

function hasRequiredProvenance(benchmark: ValuationBenchmark): boolean {
  const provenance = provenanceFrom(benchmark);
  if (!provenance.source) return false;
  if (!provenance.sourceType || provenance.sourceType === "UNKNOWN") return false;
  if (!provenance.asOfDate) return false;
  return true;
}

function reject(
  reason: ApprovedBenchmarkLookupResult["reason"],
): ApprovedBenchmarkLookupResult {
  return { status: "MISSING_BENCHMARK", reason, benchmark: null };
}

function evaluateRecord(
  record: ApprovedBenchmarkRecord | null | undefined,
): ApprovedBenchmarkLookupResult {
  if (!record) return reject("no_record");
  const { benchmark } = record;
  if (benchmark.method !== "EV_SALES") return reject("method_mismatch");
  if (benchmark.approvalStatus === "UNVERIFIED") {
    return reject("unverified_rejected");
  }
  if (benchmark.approvalStatus === "TEST_ONLY") {
    return reject("test_only_rejected");
  }
  if (benchmark.approvalStatus !== "APPROVED") {
    return reject("not_approved");
  }
  if (!hasRequiredProvenance(benchmark)) return reject("missing_provenance");
  if (!hasPositiveMultiple(benchmark)) return reject("multiple_missing");
  return { status: "FOUND", reason: "ok", benchmark };
}

function matchRecord(
  query: ApprovedBenchmarkLookupQuery,
  records: readonly ApprovedBenchmarkRecord[],
): ApprovedBenchmarkRecord | null {
  if (!query.sellerCompanyId) return null;
  const companyRecords = records.filter(
    (item) => item.sellerCompanyId === query.sellerCompanyId,
  );
  if (companyRecords.length === 0) return null;
  if (query.conversationId) {
    const conversationMatch = companyRecords.find(
      (item) => item.conversationId === query.conversationId,
    );
    if (conversationMatch) return conversationMatch;
  }
  return companyRecords.find((item) => item.conversationId == null) ?? null;
}

/** Production lookup. Default store is empty. Does not invent multiples. */
export function resolveApprovedEvSalesBenchmark(
  query: ApprovedBenchmarkLookupQuery,
  records: readonly ApprovedBenchmarkRecord[] = listApprovedEvSalesBenchmarks(),
): ApprovedBenchmarkLookupResult {
  void query.untrustedClientBenchmark;
  void query.industry;
  if (!query.sellerCompanyId) return reject("no_company");
  return evaluateRecord(matchRecord(query, records));
}

/**
 * Production DB load. RLS + company filter. TEST_ONLY/UNVERIFIED는 evaluate에서 거절.
 * 테이블이 없거나 조회 실패면 빈 목록 — 배수를 발명하지 않는다.
 */
export async function loadApprovedEvSalesBenchmarksFromDb(
  supabase: SupabaseClient,
  sellerCompanyId: string | null,
): Promise<ApprovedBenchmarkRecord[]> {
  if (!sellerCompanyId) return [];
  const { data, error } = await supabase
    .from("approved_valuation_benchmarks")
    .select(
      "id, company_id, conversation_id, deal_id, method, multiple, multiple_low, multiple_base, multiple_high, source, source_type, as_of_date, industry, confidence, approval_status, provenance, created_by, created_at, updated_at",
    )
    .eq("company_id", sellerCompanyId)
    .eq("method", "EV_SALES");
  if (error || !data) return [];
  return filterBenchmarkRowsForCompany(
    data as ApprovedBenchmarkRow[],
    sellerCompanyId,
  );
}

/**
 * Tests and later experts only. Requires APPROVED + provenance.
 * Scoped to one seller company — never a default for all sellers.
 * TOM/LLM must not call this.
 */
export function injectApprovedEvSalesBenchmark(
  record: ApprovedBenchmarkRecord,
): { ok: true } | { ok: false; reason: string } {
  if (!record.sellerCompanyId.trim()) {
    return { ok: false, reason: "seller_company_required" };
  }
  const checked = evaluateRecord(record);
  if (checked.status !== "FOUND" || !checked.benchmark) {
    return { ok: false, reason: checked.reason };
  }
  const key = record.conversationId
    ? `${record.sellerCompanyId}:${record.conversationId}`
    : record.sellerCompanyId;
  approvedRecordsByCompany.set(key, {
    sellerCompanyId: record.sellerCompanyId,
    conversationId: record.conversationId,
    benchmark: checked.benchmark,
  });
  return { ok: true };
}

export function listApprovedEvSalesBenchmarks(): ApprovedBenchmarkRecord[] {
  return [...approvedRecordsByCompany.values()];
}

export function resetApprovedBenchmarkStoreForTests(): void {
  approvedRecordsByCompany.clear();
}

/**
 * Production LEVEL 0. Resolver → EV/Sales. TEST_ONLY is never used.
 * records를 넘기면 그 목록만 쓴다(DB 로드). 생략 시에만 테스트용 in-memory store.
 */
export function computeProductionSellerLevel0(input: {
  financials: NormalizedFinancialInputs | FinancialInput;
  sellerCompanyId: string | null;
  conversationId: string | null;
  industry: string | null;
  now?: Date;
  untrustedClientBenchmark?: ValuationBenchmark | null;
  records?: readonly ApprovedBenchmarkRecord[];
}): {
  lookup: ApprovedBenchmarkLookupResult;
  result: ValuationCalculation;
  copy: string;
} {
  const records = input.records ?? listApprovedEvSalesBenchmarks();
  const lookup = resolveApprovedEvSalesBenchmark(
    {
      sellerCompanyId: input.sellerCompanyId,
      conversationId: input.conversationId,
      industry: input.industry,
      untrustedClientBenchmark: input.untrustedClientBenchmark ?? null,
    },
    records,
  );
  const result = calculateEvSales({
    financials: input.financials,
    benchmark: lookup.benchmark,
    mode: "production",
  });
  return {
    lookup,
    result,
    copy: formatSellerLevel0Copy(result, lookup.benchmark),
  };
}
