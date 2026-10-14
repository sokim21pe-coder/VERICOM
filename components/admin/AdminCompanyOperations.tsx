"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  updateAdminCompanyStatus,
  updateAdminCompanyVerification,
} from "@/lib/admin/actions";
import { ADMIN_REASON_TYPES } from "@/lib/admin/operations";
import { companyStatusLabel, companyVerificationLabel } from "@/lib/admin/format";

export function AdminCompanyOperations({
  companyId,
  companyName,
  verification,
  companyStatus,
}: {
  companyId: string;
  companyName: string;
  verification: string;
  companyStatus: string;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [dialog, setDialog] = useState<"verification" | "status" | null>(null);
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
    setDialog(null);
    router.refresh();
  }

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold">Admin Actions</h2>
      <p className="text-sm text-muted">
        확인 상태와 회사 상태만 변경합니다. Membership / Deal Role은 변경하지 않습니다.
      </p>
      {message ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {message}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className="rounded-md bg-navy px-4 py-2 text-sm text-white"
          onClick={() => {
            setMessage(null);
            setDialog("verification");
          }}
        >
          확인 상태 변경
        </button>
        <button
          type="button"
          className="rounded-md border border-line px-4 py-2 text-sm"
          onClick={() => {
            setMessage(null);
            setDialog("status");
          }}
        >
          회사 상태 변경
        </button>
      </div>

      {dialog ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <form
            className="w-full max-w-md rounded-md border border-line bg-white p-5"
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              const reasonType = String(form.get("reasonType") ?? "");
              const reasonDetail = String(form.get("reasonDetail") ?? "");
              if (dialog === "verification") {
                void run(() =>
                  updateAdminCompanyVerification({
                    companyId,
                    verification: String(form.get("verification") ?? ""),
                    reasonType,
                    reasonDetail,
                  }),
                );
                return;
              }
              void run(() =>
                updateAdminCompanyStatus({
                  companyId,
                  status: String(form.get("status") ?? ""),
                  reasonType,
                  reasonDetail,
                }),
              );
            }}
          >
            <h3 className="text-lg font-semibold">
              {dialog === "verification" ? "확인 상태 변경" : "회사 상태 변경"}
            </h3>
            <p className="mt-2 text-sm text-muted">대상: {companyName}</p>
            <div className="mt-4 space-y-3">
              {dialog === "verification" ? (
                <label className="block text-sm">
                  <span className="mb-1 block text-muted">확인 상태</span>
                  <select
                    name="verification"
                    defaultValue={verification}
                    className="w-full rounded-md border border-line px-3 py-2 text-sm"
                  >
                    {["unverified", "pending", "verified"].map((value) => (
                      <option key={value} value={value}>
                        {companyVerificationLabel(value)}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <label className="block text-sm">
                  <span className="mb-1 block text-muted">회사 상태</span>
                  <select
                    name="status"
                    defaultValue={companyStatus}
                    className="w-full rounded-md border border-line px-3 py-2 text-sm"
                  >
                    {["draft", "active", "inactive"].map((value) => (
                      <option key={value} value={value}>
                        {companyStatusLabel(value)}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <label className="block text-sm">
                <span className="mb-1 block text-muted">사유 유형</span>
                <select
                  name="reasonType"
                  required
                  className="w-full rounded-md border border-line px-3 py-2 text-sm"
                >
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
              <button
                type="button"
                className="text-muted underline"
                disabled={pending}
                onClick={() => setDialog(null)}
              >
                취소
              </button>
              <button
                type="submit"
                disabled={pending}
                className="rounded-md bg-navy px-4 py-2 text-white disabled:opacity-50"
              >
                {pending ? "처리 중…" : "변경"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}
