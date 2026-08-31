"use client";

import { FormEvent, useState } from "react";
import {
  registerNewCompany,
  requestCompanyLink,
  searchCompanies,
} from "@/lib/auth/actions";

const inputClass =
  "rounded-md border border-line bg-white px-3 py-2 text-foreground outline-none focus:border-navy";

export function CompanyOnboardingForm() {
  const [mode, setMode] = useState<"search" | "create">("create");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ id: string; name: string }[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSearch() {
    setMessage(null);
    setPending(true);
    const found = await searchCompanies(query);
    setPending(false);
    setResults(found);
    if (found.length === 0) {
      setMessage("일치하는 회사가 없습니다. 새 회사로 등록할 수 있습니다.");
    }
  }

  async function onLink(companyId: string) {
    setPending(true);
    const result = await requestCompanyLink(companyId);
    setPending(false);
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    window.location.assign(result.redirectTo ?? "/login");
  }

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    const form = new FormData(event.currentTarget);
    setPending(true);
    const result = await registerNewCompany({
      name: String(form.get("name") ?? ""),
      legalName: String(form.get("legalName") ?? ""),
      industry: String(form.get("industry") ?? ""),
      website: String(form.get("website") ?? ""),
      businessRegistrationNumber: String(
        form.get("businessRegistrationNumber") ?? "",
      ),
    });
    setPending(false);
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    window.location.assign(result.redirectTo ?? "/login");
  }

  return (
    <div className="mt-8">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode("search")}
          className={`rounded-md px-3 py-1.5 text-sm ${
            mode === "search"
              ? "bg-navy text-white"
              : "border border-line text-foreground"
          }`}
        >
          기존 회사 찾기
        </button>
        <button
          type="button"
          onClick={() => setMode("create")}
          className={`rounded-md px-3 py-1.5 text-sm ${
            mode === "create"
              ? "bg-navy text-white"
              : "border border-line text-foreground"
          }`}
        >
          새 회사 등록
        </button>
      </div>

      {mode === "search" ? (
        <div className="mt-6 grid gap-3">
          <label className="grid gap-2 text-sm">
            <span>회사명</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className={inputClass}
              placeholder="회사명을 입력하세요"
            />
          </label>
          <button
            type="button"
            disabled={pending || query.trim().length < 1}
            onClick={onSearch}
            className="rounded-md bg-navy px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {pending ? "검색 중…" : "검색"}
          </button>
          <ul className="grid gap-2">
            {results.map((company) => (
              <li
                key={company.id}
                className="flex items-center justify-between gap-3 rounded-md border border-line px-3 py-2"
              >
                <span className="text-sm">{company.name}</span>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => onLink(company.id)}
                  className="text-sm text-navy underline"
                >
                  연결 요청
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <form onSubmit={onCreate} className="mt-6 grid gap-4">
          <label className="grid gap-2 text-sm">
            <span>회사명 (필수)</span>
            <input required name="name" className={inputClass} />
          </label>
          <label className="grid gap-2 text-sm">
            <span>법인명 (선택)</span>
            <input name="legalName" className={inputClass} />
          </label>
          <label className="grid gap-2 text-sm">
            <span>업종 (선택)</span>
            <input name="industry" className={inputClass} />
          </label>
          <label className="grid gap-2 text-sm">
            <span>홈페이지 (선택)</span>
            <input name="website" className={inputClass} />
          </label>
          <label className="grid gap-2 text-sm">
            <span>사업자등록번호 (선택)</span>
            <input name="businessRegistrationNumber" className={inputClass} />
          </label>
          <p className="text-xs leading-5 text-muted">
            회사명만 있어도 등록할 수 있습니다. 회사 확인(Verification)은
            이후 단계에서 진행합니다.
          </p>
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-navy px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {pending ? "등록 중…" : "회사 등록"}
          </button>
        </form>
      )}
      {message ? <p className="mt-4 text-sm text-muted">{message}</p> : null}
    </div>
  );
}
