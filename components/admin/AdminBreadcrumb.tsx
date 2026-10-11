import Link from "next/link";

export type AdminCrumb = {
  href?: string;
  label: string;
};

export function AdminBreadcrumb({ items }: { items: AdminCrumb[] }) {
  return (
    <nav aria-label="경로" className="text-xs text-muted">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex items-center gap-1">
            {index > 0 ? <span aria-hidden>/</span> : null}
            {item.href && index < items.length - 1 ? (
              <Link href={item.href} className="text-navy hover:underline">
                {item.label}
              </Link>
            ) : (
              <span className="text-foreground">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
