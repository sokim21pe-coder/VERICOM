import Link from "next/link";
import { AdminPage } from "@/components/admin/AdminPage";
import { loadAdminSearch } from "@/lib/admin/data";
import type { AdminSearchHit } from "@/lib/admin/parse";

export const dynamic = "force-dynamic";

export default async function AdminSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const result =
    query.length >= 2
      ? await loadAdminSearch(query)
      : {
          storageReady: true,
          users: [],
          companies: [],
          deals: [],
          message: query ? "검색어는 2자 이상 입력하세요." : "검색어를 입력하세요.",
        };

  return (
    <AdminPage
      screenId="A00"
      title="통합 검색"
      description="사용자, 회사, Deal만 검색합니다. TOM 본문과 문서 내용은 검색하지 않습니다."
      crumbs={[{ label: "검색" }]}
      notice={result.message}
    >
      <form action="/admin/search" className="mt-6 md:hidden">
        <label className="text-sm">
          <span className="mb-1 block text-muted">검색</span>
          <input
            name="q"
            defaultValue={query}
            className="w-full rounded-md border border-line px-3 py-2 text-sm"
          />
        </label>
        <button type="submit" className="mt-3 rounded-md bg-navy px-4 py-2 text-sm text-white">
          찾기
        </button>
      </form>
      <div className="mt-8 grid gap-6 xl:grid-cols-3">
        <ResultGroup title="사용자" rows={result.users} empty="일치하는 사용자가 없습니다." />
        <ResultGroup title="회사" rows={result.companies} empty="일치하는 회사가 없습니다." />
        <ResultGroup title="Deal" rows={result.deals} empty="일치하는 Deal이 없습니다." />
      </div>
    </AdminPage>
  );
}

function ResultGroup({
  title,
  rows,
  empty,
}: {
  title: string;
  rows: AdminSearchHit[];
  empty: string;
}) {
  return (
    <section className="rounded-md border border-line p-4">
      <h2 className="text-sm font-semibold">{title}</h2>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-muted">{empty}</p>
      ) : (
        <ul className="mt-3 space-y-3 text-sm">
          {rows.map((row) => (
            <li key={row.id}>
              <Link href={row.href} className="block hover:text-navy">
                <span className="font-medium">{row.label}</span>
                <span className="mt-0.5 block text-xs text-muted">{row.meta}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
