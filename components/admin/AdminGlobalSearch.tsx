"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminGlobalSearch({ initialQuery = "" }: { initialQuery?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);

  return (
    <form
      role="search"
      className="hidden min-w-0 flex-1 md:block"
      onSubmit={(event) => {
        event.preventDefault();
        const next = query.trim();
        if (next.length < 2) return;
        router.push(`/admin/search?q=${encodeURIComponent(next)}`);
      }}
    >
      <label className="sr-only" htmlFor="admin-global-search">
        사용자·회사·Deal 검색
      </label>
      <input
        id="admin-global-search"
        name="q"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="사용자, 회사, Deal 검색"
        className="h-10 w-full max-w-md rounded-md border border-line px-3 text-sm"
      />
    </form>
  );
}
