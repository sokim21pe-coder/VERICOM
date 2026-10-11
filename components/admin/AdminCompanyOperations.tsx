"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  updateAdminCompanyStatus,
  updateAdminCompanyVerification,
} from "@/lib/admin/company-actions";
import { ADMIN_REASON_TYPES } from "@/lib/admin/operations";

export function AdminCompanyOperations({
  companyId,
  companyName,
  companyStatus,
  verificationStatus,
}: {
  companyId: string;
  companyName: string;
  companyStatus: string;
  verificationStatus: string;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"verification" | "status" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function run(task: () => Promise<{ ok: boolean; message: string | null }>) {
    setPending(true);
    setMessage(null);
    const result = await task();
    setPending(false);
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    setMode(null);
    router.refresh();
  }

  return (
    <section className="mt-10">
      <h2 className="text-sm font-semibold">Admin Operations</h2>
      <p className="mt-2 text-sm text-muted">회사 상태 변경은 사유 입력과 Audit 기록이 필요합니다.</p>
      {message ? (
        <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {message}
        </p>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          className="rounded-md border border-line px-3 py-2 text-sm"
          onClick={() => setMode("verification")}
        >
          Verification 변경
        </button>
        <button
          type="button"
          className="rounded-md border border-line px-3 py-2 text-sm"
          onClick={() => setMode("status")}
        >
          회사 상태 변경
        </button>
      </div>

      {mode ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <form
            className="w-full max-w-md rounded-md border border-line bg-white p-5"
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              const reasonType = String(form.get("reasonType") ?? "");
              const reasonDetail = String(form.get("reasonDetail") ?? "");
              if (mode === "verification") {
                const verificationStatus = String(form.get("verificationStatus") ?? "unverified") as
                  | "unverified"
                  | "pending"
                  | "verified";
                void run(() =>
                  updateAdminCompanyVerification({
                    companyId,
                    verificationStatus,
                    reasonType,
                    reasonDetail,
                  }),
                );
                return;
              }
              const nextStatus = String(form.get("companyStatus") ?? "active") as
                | "draft"
                | "active"
                | "inactive";
              void run(() =>
                updateAdminCompanyStatus({
                  companyId,
                  companyStatus: nextStatus,
                  reasonType,
                  reasonDetail,
                }),
              );
            }}
          >
            <h3 className="text-lg font-semibold">
              {mode === "verification" ? "Company Verification 변경" : "회사 상태 변경"}
            </h3>
            <p className="mt-2 text-sm text-muted">대상: {companyName}</p>
            <div className="mt-4 space-y-3">
              {mode === "verification" ? (
                <label className="block text-sm">
                  <span className="mb-1 block text-muted">Verification</span>
                  <select
                    name="verificationStatus"
                    defaultValue={verificationStatus}
                    className="w-full rounded-md border border-line px-3 py-2 text-sm"
                  >
                    <option value="unverified">미확인 (unverified)</option>
                    <option value="pending">검토 중 (pending)</option>
                    <option value="verified">확인 완료 (verified)</option>
                  </select>
                </label>
              ) : (
                <label className="block text-sm">
                  <span className="mb-1 block text-muted">Company Status</span>
                  <select
                    name="companyStatus"
                    defaultValue={companyStatus}
                    className="w-full rounded-md border border-line px-3 py-2 text-sm"
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </label>
              )}
              <label className="block text-sm">
                <span className="mb-1 block text-muted">사유 유형</span>
                <select name="reasonType" required className="w-full rounded-md border border-line px-3 py-2 text-sm">
                  {ADMIN_REASON_TYPES.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-muted">상세 사유</span>
                <textarea
                  name="reasonDetail"
                  required
                  minLength={1}
                  rows={3}
                  className="w-full rounded-md border border-line px-3 py-2 text-sm"
                />
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-3 text-sm">
              <button type="button" className="text-muted underline" onClick={() => !pending && setMode(null)} disabled={pending}>
                취소
              </button>
              <button type="submit" disabled={pending} className="rounded-md bg-navy px-4 py-2 text-white disabled:opacity-50">
                {pending ? "처리 중…" : "변경"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}
