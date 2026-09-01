"use server";

import { revalidatePath } from "next/cache";
import { recordAudit } from "@/lib/audit";
import { authErrorMessage } from "@/lib/auth/errors";
import { getCurrentContext, listAccessibleDeals } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { persistApprovedEvSalesBenchmark } from "@/lib/valuation/approved-benchmark-persistence";
import {
  assignedSellerCompanyIds,
  parseStaffApprovedBenchmarkForm,
  staffBenchmarkTargetsFromDeals,
  staffBenchmarkWriteCopy,
} from "@/lib/valuation/staff-benchmark-write";
import { ErrorCode } from "@/types/enums";

export type StaffBenchmarkActionState = {
  ok: boolean;
  message: string | null;
};

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function submitApprovedEvSalesBenchmark(
  _prev: StaffBenchmarkActionState,
  formData: FormData,
): Promise<StaffBenchmarkActionState> {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      message: authErrorMessage[ErrorCode.ENV_NOT_CONFIGURED],
    };
  }

  const context = await getCurrentContext();
  if (!context) {
    return { ok: false, message: authErrorMessage[ErrorCode.AUTH_REQUIRED] };
  }

  const deals = await listAccessibleDeals();
  const parsed = parseStaffApprovedBenchmarkForm(
    context,
    {
      companyId: formString(formData, "companyId"),
      dealId: formString(formData, "dealId"),
      multipleLow: formString(formData, "multipleLow"),
      multipleBase: formString(formData, "multipleBase"),
      multipleHigh: formString(formData, "multipleHigh"),
      source: formString(formData, "source"),
      sourceType: formString(formData, "sourceType"),
      asOfDate: formString(formData, "asOfDate"),
      industry: formString(formData, "industry"),
      confidence: formString(formData, "confidence"),
      confirmed: formString(formData, "confirmed") === "on",
    },
    assignedSellerCompanyIds(deals),
  );

  if (!parsed.ok) {
    return { ok: false, message: staffBenchmarkWriteCopy[parsed.reason] };
  }

  const target = staffBenchmarkTargetsFromDeals(deals).find(
    (item) => item.companyId === parsed.companyId,
  );
  const dealId = target?.dealId ?? parsed.dealId;

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return {
      ok: false,
      message: authErrorMessage[ErrorCode.ENV_NOT_CONFIGURED],
    };
  }

  const persisted = await persistApprovedEvSalesBenchmark(supabase, context, {
    companyId: parsed.companyId,
    dealId,
    benchmark: parsed.benchmark,
  });

  if (!persisted.ok) {
    if (persisted.reason === "staff_write_required") {
      return { ok: false, message: staffBenchmarkWriteCopy.staff_write_required };
    }
    if (persisted.reason === "rls_denied") {
      return { ok: false, message: authErrorMessage[ErrorCode.PERMISSION_DENIED] };
    }
    if (persisted.reason === "unique_conflict") {
      return { ok: false, message: staffBenchmarkWriteCopy.unique_conflict };
    }
    if (persisted.reason === "insert_failed") {
      return {
        ok: false,
        message:
          "저장하지 못했습니다. 이미 같은 회사의 EV/Sales 승인 배수가 있을 수 있습니다.",
      };
    }
    return { ok: false, message: authErrorMessage[ErrorCode.VALIDATION_ERROR] };
  }

  await recordAudit({
    action: "VALUATION_BENCHMARK_APPROVED",
    entityType: "approved_valuation_benchmarks",
    entityId: persisted.id,
  });
  revalidatePath("/seller/valuation");
  revalidatePath("/expert/benchmarks");
  revalidatePath("/internal/benchmarks");
  return { ok: true, message: "승인된 EV/Sales 비교배수를 저장했습니다." };
}
