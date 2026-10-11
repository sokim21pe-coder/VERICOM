export type AdminRecentUser = {
  id: string;
  display_name: string;
  email: string;
  created_at: string;
};

export type AdminRecentDeal = {
  id: string;
  title: string | null;
  seller_stage_key: string | null;
  created_at: string;
};

export type AdminRecentAction = {
  id: string;
  action: string;
  entity_type: string | null;
  created_at: string;
  actor_email: string | null;
};

export type AdminSearchHit = {
  id: string;
  label: string;
  href: string;
  kind: "user" | "company" | "deal";
  meta: string;
};

export function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function asRows<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export function asCountMap(value: unknown): Record<string, number> {
  const row = asRecord(value);
  return Object.fromEntries(
    Object.entries(row).map(([key, count]) => [key, Number(count ?? 0)]),
  );
}

export function mapDashboardKpis(row: Record<string, unknown>) {
  return {
    totalUsers: Number(row.total_users ?? 0),
    activeUsers: Number(row.active_users ?? 0),
    totalCompanies: Number(row.total_companies ?? 0),
    totalDeals: Number(row.total_deals ?? 0),
    dealsBySellerStage: asCountMap(row.deals_by_seller_stage),
    teasersByStatus: asCountMap(row.teasers_by_status),
    usersByRole: asCountMap(row.users_by_role),
    tomConversations: Number(row.tom_conversations ?? 0),
    tomActive: Number(row.tom_active ?? 0),
    valuationBenchmarks: Number(row.valuation_benchmarks ?? 0),
    recentUsers: asRows<AdminRecentUser>(row.recent_users),
    recentDeals: asRows<AdminRecentDeal>(row.recent_deals),
    recentAdminActions: asRows<AdminRecentAction>(row.recent_admin_actions),
  };
}

export function mapAdminSearch(row: Record<string, unknown>): {
  users: AdminSearchHit[];
  companies: AdminSearchHit[];
  deals: AdminSearchHit[];
} {
  return {
    users: asRows<Record<string, unknown>>(row.users).map((item) => ({
      id: String(item.id ?? ""),
      label: String(item.display_name || item.email || "사용자"),
      href: `/admin/users/${item.id}`,
      kind: "user" as const,
      meta: String(item.email ?? ""),
    })),
    companies: asRows<Record<string, unknown>>(row.companies).map((item) => ({
      id: String(item.id ?? ""),
      label: String(item.name || "회사"),
      href: `/admin/companies/${item.id}`,
      kind: "company" as const,
      meta: String(item.verification_status ?? ""),
    })),
    deals: asRows<Record<string, unknown>>(row.deals).map((item) => ({
      id: String(item.id ?? ""),
      label: String(item.title || "제목 없음"),
      href: `/admin/deals/${item.id}`,
      kind: "deal" as const,
      meta: String(item.seller_stage_key ?? "UNSET"),
    })),
  };
}

export function teaserRowHasForbiddenFields(row: Record<string, unknown>): boolean {
  return "content" in row || "body" in row;
}

export function tomRowHasForbiddenFields(row: Record<string, unknown>): boolean {
  return "body" in row || "messages" in row || "memory_value" in row;
}

export function valuationRowHasForbiddenFields(row: Record<string, unknown>): boolean {
  return "provenance" in row || "multiple" in row || "equity_value" in row;
}
