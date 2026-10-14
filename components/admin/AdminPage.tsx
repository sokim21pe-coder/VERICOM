import { AdminBreadcrumb, type AdminCrumb } from "@/components/admin/AdminBreadcrumb";

export function AdminPage({
  screenId,
  title,
  description,
  crumbs,
  notice,
  children,
}: {
  screenId: string;
  title: string;
  description?: string;
  crumbs: AdminCrumb[];
  notice?: string | null;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
      <AdminBreadcrumb items={[{ href: "/admin/dashboard", label: "Admin" }, ...crumbs]} />
      <p className="mt-4 text-[11px] tracking-[0.18em] text-navy">{screenId}</p>
      <h1 className="mt-2 text-2xl font-semibold">{title}</h1>
      {description ? (
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">{description}</p>
      ) : null}
      {notice ? (
        <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {notice}
        </p>
      ) : null}
      {children}
    </main>
  );
}
