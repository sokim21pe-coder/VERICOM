export function AdminSearchForm({
  action,
  query,
  extra,
}: {
  action: string;
  query: string;
  extra?: React.ReactNode;
}) {
  return (
    <form action={action} className="mt-5 flex flex-wrap items-end gap-3">
      <label className="text-sm">
        <span className="mb-1 block text-muted">검색</span>
        <input
          name="q"
          defaultValue={query}
          className="w-64 rounded-md border border-line px-3 py-2 text-sm"
        />
      </label>
      {extra}
      <button
        type="submit"
        className="rounded-md bg-navy px-4 py-2 text-sm text-white"
      >
        찾기
      </button>
    </form>
  );
}

export function AdminPager({
  href,
  total,
  limit,
  offset,
}: {
  href: string;
  total: number;
  limit: number;
  offset: number;
}) {
  const page = Math.floor(offset / limit) + 1;
  const pages = Math.max(1, Math.ceil(total / limit));
  const prev = Math.max(0, offset - limit);
  const next = offset + limit;
  const sep = href.includes("?") ? "&" : "?";
  return (
    <div className="mt-4 flex items-center gap-3 text-sm text-muted">
      <span>
        {total}건 · {page}/{pages}
      </span>
      {offset > 0 ? (
        <a href={`${href}${sep}offset=${prev}`} className="text-navy underline">
          이전
        </a>
      ) : null}
      {next < total ? (
        <a href={`${href}${sep}offset=${next}`} className="text-navy underline">
          다음
        </a>
      ) : null}
    </div>
  );
}
