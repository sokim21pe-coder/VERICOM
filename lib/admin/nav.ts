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
    title: "Platform",
    items: [
      { href: "/admin/dashboard", label: "Dashboard" },
      { href: "/admin/users", label: "Users" },
      { href: "/admin/companies", label: "Companies" },
      { href: "/admin/deals", label: "Deals" },
      { href: "/admin/documents", label: "Documents", comingSoon: true },
    ],
  },
  {
    title: "Network",
    items: [
      { href: "/admin/buyers", label: "Buyers", comingSoon: true },
      { href: "/admin/investors", label: "Investors / FI", comingSoon: true },
      { href: "/admin/experts", label: "Experts", comingSoon: true },
    ],
  },
  {
    title: "AI",
    items: [{ href: "/admin/tom", label: "TOM AI", comingSoon: true }],
  },
  {
    title: "System",
    items: [
      { href: "/admin/audit-logs", label: "Audit Logs" },
      { href: "/admin/settings", label: "Settings", comingSoon: true },
    ],
  },
];
