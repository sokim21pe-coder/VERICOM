export type AdminNavItem = {
  href: string;
  label: string;
  comingSoon?: boolean;
};

export type AdminNavGroup = {
  title: string;
  items: AdminNavItem[];
};

export const ADMIN_NAV: AdminNavGroup[] = [
  {
    title: "개요",
    items: [{ href: "/admin/dashboard", label: "Dashboard" }],
  },
  {
    title: "회원·기업",
    items: [
      { href: "/admin/users", label: "Users" },
      { href: "/admin/companies", label: "Companies" },
      { href: "/admin/roles", label: "Roles & Permissions", comingSoon: true },
    ],
  },
  {
    title: "Deal",
    items: [
      { href: "/admin/deals", label: "Deals" },
      { href: "/admin/pipeline", label: "Deal Pipeline", comingSoon: true },
      { href: "/admin/assignments", label: "Assignments", comingSoon: true },
    ],
  },
  {
    title: "TOM(AI)",
    items: [
      { href: "/admin/tom", label: "AI Overview" },
      { href: "/admin/tom/cases", label: "AI Cases", comingSoon: true },
      { href: "/admin/tom/policy", label: "Prompt / Policy", comingSoon: true },
    ],
  },
  {
    title: "문서·가치평가",
    items: [
      { href: "/admin/documents", label: "Documents" },
      { href: "/admin/valuations", label: "Valuations" },
      { href: "/admin/vdr", label: "VDR", comingSoon: true },
    ],
  },
  {
    title: "자본·워크플로",
    items: [
      { href: "/admin/investors", label: "Investors / FI", comingSoon: true },
      { href: "/admin/workflows", label: "Workflows", comingSoon: true },
    ],
  },
  {
    title: "보안·시스템",
    items: [
      { href: "/admin/audit-logs", label: "Audit Logs" },
      { href: "/admin/settings", label: "Settings", comingSoon: true },
    ],
  },
];

export function liveAdminHrefs(): string[] {
  return ADMIN_NAV.flatMap((group) => group.items)
    .filter((item) => !item.comingSoon)
    .map((item) => item.href);
}
