"use client";

import { useActionState } from "react";
import { updateMyProfile } from "@/lib/account/profile-actions";
import { PROFILE_INITIAL_STATE } from "@/lib/account/profile-types";
import type { MyProfileView } from "@/lib/account/profile-read";

const fieldClass =
  "mt-1 block w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-foreground focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy";
const readOnlyClass =
  "mt-1 block w-full rounded-md border border-line bg-[#F4F6F9] px-3 py-2 text-sm text-muted";

export function ProfileForm({ profile }: { profile: MyProfileView }) {
  const [state, formAction, pending] = useActionState(
    updateMyProfile,
    PROFILE_INITIAL_STATE,
  );

  const hasCompany = Boolean(profile.companyId);

  return (
    <form action={formAction} className="mt-6 space-y-5">
      <div>
        <label htmlFor="name" className="text-sm font-medium text-foreground">
          이름
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={profile.name}
          placeholder="이름을 입력하세요"
          autoComplete="name"
          className={fieldClass}
        />
      </div>

      <div>
        <label htmlFor="email" className="text-sm font-medium text-foreground">
          이메일
          <span className="ml-2 text-xs font-normal text-muted">읽기 전용</span>
        </label>
        <input
          id="email"
          type="email"
          value={profile.email}
          readOnly
          disabled
          className={readOnlyClass}
        />
      </div>

      <div>
        <label
          htmlFor="companyName"
          className="text-sm font-medium text-foreground"
        >
          회사명
        </label>
        {hasCompany ? (
          <input
            id="companyName"
            name="companyName"
            type="text"
            defaultValue={profile.companyName}
            placeholder="회사명을 입력하세요"
            autoComplete="organization"
            className={fieldClass}
          />
        ) : (
          <p className={readOnlyClass}>
            연결된 회사가 없습니다. 온보딩에서 회사를 연결해 주세요.
          </p>
        )}
      </div>

      <div>
        <label htmlFor="jobTitle" className="text-sm font-medium text-foreground">
          직책
        </label>
        <input
          id="jobTitle"
          name="jobTitle"
          type="text"
          defaultValue={profile.jobTitle}
          placeholder="예: 대표이사"
          autoComplete="organization-title"
          className={fieldClass}
        />
        {profile.jobTitleUnavailable ? (
          <p className="mt-1 text-xs text-muted">
            직책 저장 기능은 마이그레이션(0019) 적용 후 활성화됩니다.
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="phone" className="text-sm font-medium text-foreground">
          연락처
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          defaultValue={profile.phone}
          placeholder="010-0000-0000"
          autoComplete="tel"
          className={fieldClass}
        />
      </div>

      <div>
        <label className="text-sm font-medium text-foreground">
          회원 유형
          <span className="ml-2 text-xs font-normal text-muted">읽기 전용</span>
        </label>
        <p className={readOnlyClass}>{profile.roleLabel}</p>
      </div>

      {state.message ? (
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
      ) : null}

      <div className="pt-1">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-11 items-center rounded-md bg-navy px-6 text-sm font-medium text-white hover:bg-navy-hover disabled:opacity-60"
        >
          {pending ? "저장 중…" : "변경사항 저장"}
        </button>
      </div>
    </form>
  );
}
