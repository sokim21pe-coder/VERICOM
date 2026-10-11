"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  addAdminPlatformRole,
  removeAdminPlatformRole,
  updateAdminUserStatus,
} from "@/lib/admin/actions";
import {
  ADMIN_REASON_TYPES,
  SUPER_ADMIN_CONFIRM_TEXT,
  isSensitivePlatformRole,
} from "@/lib/admin/operations";
import { PlatformRole } from "@/types/enums";

type RoleOption = { code: string; label_ko: string };

export function AdminUserOperations({
  userId,
  email,
  status,
  roles,
  catalog,
  canDisable,
  disableBlockedReason,
}: {
  userId: string;
  email: string;
  status: string;
  roles: string[];
  catalog: RoleOption[];
  canDisable: boolean;
  disableBlockedReason: string | null;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [dialog, setDialog] = useState<
    | { kind: "disable" }
    | { kind: "enable" }
    | { kind: "add" }
    | { kind: "remove"; role: string }
    | null
  >(null);
  const [pending, setPending] = useState(false);
  const addable = catalog.filter((item) => !roles.includes(item.code));

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
    <div className="space-y-8">
      {message ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {message}
        </p>
      ) : null}

      <section>
        <h2 className="text-sm font-semibold">Platform Roles</h2>
        <ul className="mt-2 space-y-2 text-sm">
          {roles.length === 0 ? <li className="text-muted">없음</li> : null}
          {roles.map((role) => {
            const label = catalog.find((item) => item.code === role)?.label_ko ?? role;
            return (
              <li key={role} className="flex flex-wrap items-center justify-between gap-2">
                <span>
                  {label} <span className="text-muted">({role})</span>
                </span>
                <button
                  type="button"
                  className="text-navy underline"
                  onClick={() => {
                    setMessage(null);
                    setDialog({ kind: "remove", role });
                  }}
                >
                  제거
                </button>
              </li>
            );
          })}
        </ul>
        <button
          type="button"
          className="mt-3 rounded-md border border-line px-3 py-1.5 text-sm"
          onClick={() => {
            setMessage(null);
            setDialog({ kind: "add" });
          }}
          disabled={addable.length === 0}
        >
          Platform Role 추가
        </button>
      </section>

      <section>
        <h2 className="text-sm font-semibold">Security / Access</h2>
        <p className="mt-2 text-sm text-muted">상태 변경은 사유와 Audit가 필요합니다.</p>
        {status === "active" ? (
          <button
            type="button"
            disabled={!canDisable}
            title={disableBlockedReason ?? undefined}
            className="mt-3 rounded-md bg-navy px-4 py-2 text-sm text-white disabled:opacity-50"
            onClick={() => {
              setMessage(null);
              setDialog({ kind: "disable" });
            }}
          >
            계정 정지
          </button>
        ) : (
          <button
            type="button"
            className="mt-3 rounded-md bg-navy px-4 py-2 text-sm text-white"
            onClick={() => {
              setMessage(null);
              setDialog({ kind: "enable" });
            }}
          >
            계정 활성화
          </button>
        )}
        {disableBlockedReason ? (
          <p className="mt-2 text-sm text-muted">{disableBlockedReason}</p>
        ) : null}
      </section>

      {dialog ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <ReasonDialog
            title={dialogTitle(dialog)}
            description={dialogDescription(dialog, email)}
            pending={pending}
            extra={
              dialog.kind === "add" ? (
                <AddRoleFields catalog={addable} />
              ) : dialog.kind === "remove" ? (
                <input type="hidden" name="role" value={dialog.role} />
              ) : null
            }
            onCancel={() => {
              if (!pending) setDialog(null);
            }}
            onSubmit={(form) => {
              const reasonType = String(form.get("reasonType") ?? "");
              const reasonDetail = String(form.get("reasonDetail") ?? "");
              if (dialog.kind === "disable") {
                void run(() =>
                  updateAdminUserStatus({
                    userId,
                    status: "disabled",
                    reasonType,
                    reasonDetail,
                  }),
                );
                return;
              }
              if (dialog.kind === "enable") {
                void run(() =>
                  updateAdminUserStatus({
                    userId,
                    status: "active",
                    reasonType,
                    reasonDetail,
                  }),
                );
                return;
              }
              if (dialog.kind === "add") {
                const role = String(form.get("role") ?? "");
                const confirm = String(form.get("confirm") ?? "");
                void run(() =>
                  addAdminPlatformRole({
                    userId,
                    role,
                    reasonType,
                    reasonDetail,
                    confirm,
                  }),
                );
                return;
              }
              void run(() =>
                removeAdminPlatformRole({
                  userId,
                  role: dialog.role,
                  reasonType,
                  reasonDetail,
                }),
              );
            }}
            submitLabel={dialogSubmit(dialog)}
          />
        </div>
      ) : null}
    </div>
  );
}

function dialogTitle(
  dialog:
    | { kind: "disable" }
    | { kind: "enable" }
    | { kind: "add" }
    | { kind: "remove"; role: string },
) {
  if (dialog.kind === "disable") return "계정 정지";
  if (dialog.kind === "enable") return "계정 활성화";
  if (dialog.kind === "add") return "Platform Role 추가";
  return `${dialog.role} 권한 제거`;
}

function dialogDescription(
  dialog:
    | { kind: "disable" }
    | { kind: "enable" }
    | { kind: "add" }
    | { kind: "remove"; role: string },
  email: string,
) {
  if (dialog.kind === "disable") return `대상: ${email}`;
  if (dialog.kind === "enable") return `대상: ${email}`;
  if (dialog.kind === "add") return "부여할 권한과 사유를 입력하세요.";
  return `${dialog.role} 권한을 제거하시겠습니까?`;
}

function dialogSubmit(
  dialog:
    | { kind: "disable" }
    | { kind: "enable" }
    | { kind: "add" }
    | { kind: "remove"; role: string },
) {
  if (dialog.kind === "disable") return "계정 정지";
  if (dialog.kind === "enable") return "계정 활성화";
  if (dialog.kind === "add") return "Role 추가";
  return "권한 제거";
}

function AddRoleFields({ catalog }: { catalog: RoleOption[] }) {
  const [role, setRole] = useState(catalog[0]?.code ?? "");
  const sensitive = isSensitivePlatformRole(role);
  const superAdmin = role === PlatformRole.PLATFORM_SUPER_ADMIN;

  return (
    <>
      <label className="block text-sm">
        <span className="mb-1 block text-muted">Role</span>
        <select
          name="role"
          value={role}
          onChange={(event) => setRole(event.target.value)}
          className="w-full rounded-md border border-line px-3 py-2 text-sm"
        >
          {catalog.map((item) => (
            <option key={item.code} value={item.code}>
              {item.label_ko} ({item.code})
            </option>
          ))}
        </select>
      </label>
      {sensitive ? (
        <p className="text-sm text-muted">
          이 사용자는 VERICOM 내부 운영 권한을 얻게 됩니다. 계속하시겠습니까?
        </p>
      ) : null}
      {superAdmin ? (
        <label className="block text-sm">
          <span className="mb-1 block text-muted">
            확인 문구 ({SUPER_ADMIN_CONFIRM_TEXT})
          </span>
          <input
            name="confirm"
            className="w-full rounded-md border border-line px-3 py-2 text-sm"
            placeholder={SUPER_ADMIN_CONFIRM_TEXT}
          />
        </label>
      ) : null}
    </>
  );
}

function ReasonDialog({
  title,
  description,
  extra,
  pending,
  submitLabel,
  onCancel,
  onSubmit,
}: {
  title: string;
  description: string;
  extra?: ReactNode;
  pending: boolean;
  submitLabel: string;
  onCancel: () => void;
  onSubmit: (form: FormData) => void;
}) {
  return (
    <form
      className="w-full max-w-md rounded-md border border-line bg-white p-5"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(new FormData(event.currentTarget));
      }}
    >
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted">{description}</p>
      <div className="mt-4 space-y-3">
        {extra}
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
        <button type="button" className="text-muted underline" onClick={onCancel} disabled={pending}>
          취소
        </button>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-navy px-4 py-2 text-white disabled:opacity-50"
        >
          {pending ? "처리 중…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
