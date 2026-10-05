"use client";

import { useActionState, useState, useTransition } from "react";
import {
  approveTeaserAction,
  createTeaserDraftAction,
  saveTeaserAction,
  submitTeaserForReviewAction,
  type TeaserActionState,
} from "@/lib/teaser/actions";
import { teaserSectionTitle } from "@/lib/teaser/sections";
import {
  actionsForStatus,
  teaserStageLabel,
  TEASER_STATUS_LABEL,
} from "@/lib/teaser/state";
import type { TeaserWorkspaceView } from "@/lib/teaser/data";
import type { TeaserContent, TeaserStatus } from "@/lib/teaser/types";

const INITIAL: TeaserActionState = { ok: false, message: null };

const STATUS_STYLE: Record<TeaserStatus, string> = {
  DRAFT: "border-amber-200 bg-amber-50 text-amber-700",
  IN_REVIEW: "border-sky-200 bg-sky-50 text-sky-700",
  APPROVED: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

function Banner({ state }: { state: TeaserActionState }) {
  if (!state.message) return null;
  return (
    <p
      role="status"
      className={
        state.ok
          ? "rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
          : "rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
      }
    >
      {state.message}
    </p>
  );
}

function PreviewSections({ content }: { content: TeaserContent }) {
  return (
    <div className="space-y-5">
      <div className="rounded-md border border-line bg-[#F4F6F9] px-4 py-3">
        <p className="text-[11px] tracking-[0.14em] text-muted">
          {content.identityMasked ? "식별정보 비공개(마스킹)" : "식별정보 공개"}
        </p>
        <p className="mt-1 text-base font-semibold text-foreground">
          {content.headline}
        </p>
      </div>
      {content.sections.map((section) => (
        <div key={section.id}>
          <h3 className="text-sm font-semibold text-foreground">
            {section.title}
          </h3>
          <p className="mt-1 whitespace-pre-line text-sm leading-6 text-muted">
            {section.body}
          </p>
        </div>
      ))}
    </div>
  );
}

export function TeaserWorkspace({ view }: { view: TeaserWorkspaceView }) {
  const [saveState, saveAction, saving] = useActionState(
    saveTeaserAction,
    INITIAL,
  );
  const [flow, setFlow] = useState<TeaserActionState>(INITIAL);
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);

  const record = view.record;
  const status: TeaserStatus | null = record?.status ?? null;
  const content = record?.content ?? view.preview;
  const actions = status ? actionsForStatus(status) : [];

  function run(action: () => Promise<TeaserActionState>) {
    startTransition(async () => {
      const result = await action();
      setFlow(result);
    });
  }

  if (!view.canCreate && !record) {
    return (
      <p className="mt-6 rounded-md border border-line bg-[#F4F6F9] px-4 py-3 text-sm text-muted">
        티저는 연결된 회사의 Seller만 작성할 수 있습니다.
      </p>
    );
  }

  return (
    <div className="mt-6 space-y-6">
      {!view.storageReady ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
          티저 저장소가 아직 준비되지 않았습니다(마이그레이션 0020 적용 전). 아래
          프리뷰는 확인된 정보만으로 생성된 미리보기입니다. 저장·승인은 적용 후
          이용할 수 있습니다.
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <span
          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${
            status ? STATUS_STYLE[status] : "border-line bg-[#F4F6F9] text-muted"
          }`}
        >
          상태: {teaserStageLabel(status)}
        </span>
        {record?.approvedVersion ? (
          <span className="text-xs text-muted">
            승인 버전 v{record.approvedVersion}
          </span>
        ) : null}
        {record ? (
          <span className="text-xs text-muted">
            현재 버전 v{record.currentVersion}
          </span>
        ) : null}
      </div>

      {view.missing.length > 0 ? (
        <p className="rounded-md border border-line bg-[#F4F6F9] px-3 py-2 text-xs text-muted">
          확인 필요: {view.missing.join(", ")} — 확인되지 않은 정보는 창작하지
          않고 &quot;확인 필요&quot;로 남깁니다.
        </p>
      ) : null}

      <Banner state={flow} />

      {!record ? (
        <section className="rounded-lg border border-line bg-white p-5">
          <h2 className="text-lg font-semibold text-foreground">작성 전</h2>
          <p className="mt-2 text-sm text-muted">
            아래는 상담에서 확인된 정보만으로 만든 티저 미리보기입니다. 초안을
            만들면 저장되고, 검토 후 직접 승인할 수 있습니다.
          </p>
          <div className="mt-5">
            <PreviewSections content={content} />
          </div>
          {view.canCreate ? (
            <button
              type="button"
              disabled={pending || !view.storageReady}
              onClick={() => run(createTeaserDraftAction)}
              className="mt-6 inline-flex h-11 items-center rounded-md bg-navy px-6 text-sm font-medium text-white hover:bg-navy-hover disabled:opacity-60"
            >
              {pending ? "처리 중…" : "초안 만들기"}
            </button>
          ) : null}
        </section>
      ) : (
        <section className="rounded-lg border border-line bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-foreground">
              티저 {editing ? "편집" : "내용"}
            </h2>
            {view.canEdit && actions.includes("edit") ? (
              <button
                type="button"
                onClick={() => setEditing((prev) => !prev)}
                className="inline-flex h-9 items-center rounded-md border border-line px-4 text-sm font-medium text-foreground hover:border-navy"
              >
                {editing ? "편집 취소" : "편집"}
              </button>
            ) : null}
          </div>

          {status === "APPROVED" ? (
            <p className="mt-2 text-xs text-emerald-700">
              승인 완료된 티저입니다. 내용을 수정하면 승인이 해제되고 다시 검토가
              필요합니다.
            </p>
          ) : null}

          {editing ? (
            <form action={saveAction} className="mt-5 space-y-5">
              <div>
                <label
                  htmlFor="headline"
                  className="text-sm font-medium text-foreground"
                >
                  헤드라인(익명)
                </label>
                <input
                  id="headline"
                  name="headline"
                  type="text"
                  defaultValue={content.headline}
                  className="mt-1 block w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-foreground focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy"
                />
              </div>
              {content.sections.map((section) => (
                <div key={section.id}>
                  <label
                    htmlFor={`section_${section.id}`}
                    className="text-sm font-medium text-foreground"
                  >
                    {teaserSectionTitle(section.id)}
                  </label>
                  <textarea
                    id={`section_${section.id}`}
                    name={`section_${section.id}`}
                    defaultValue={section.body}
                    rows={4}
                    className="mt-1 block w-full rounded-md border border-line bg-white px-3 py-2 text-sm leading-6 text-foreground focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy"
                  />
                </div>
              ))}
              <Banner state={saveState} />
              <button
                type="submit"
                disabled={saving}
                className="inline-flex h-11 items-center rounded-md bg-navy px-6 text-sm font-medium text-white hover:bg-navy-hover disabled:opacity-60"
              >
                {saving ? "저장 중…" : "변경 저장"}
              </button>
            </form>
          ) : (
            <div className="mt-5">
              <PreviewSections content={content} />
            </div>
          )}

          {!editing ? (
            <div className="mt-6 flex flex-wrap gap-3">
              {view.canEdit && actions.includes("submit") ? (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => run(submitTeaserForReviewAction)}
                  className="inline-flex h-11 items-center rounded-md border border-navy px-6 text-sm font-medium text-navy hover:bg-navy hover:text-white disabled:opacity-60"
                >
                  {pending ? "처리 중…" : "검토 요청"}
                </button>
              ) : null}
              {view.canApprove && actions.includes("approve") ? (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => run(approveTeaserAction)}
                  className="inline-flex h-11 items-center rounded-md bg-navy px-6 text-sm font-medium text-white hover:bg-navy-hover disabled:opacity-60"
                >
                  {pending ? "처리 중…" : "승인"}
                </button>
              ) : null}
            </div>
          ) : null}

          <p className="mt-6 text-xs text-muted">
            상태 흐름: {TEASER_STATUS_LABEL.DRAFT} → {TEASER_STATUS_LABEL.IN_REVIEW}{" "}
            → {TEASER_STATUS_LABEL.APPROVED}. 승인은 검토 단계에서 직접 눌러야
            하며, AI가 자동 승인하지 않습니다.
          </p>
        </section>
      )}
    </div>
  );
}
