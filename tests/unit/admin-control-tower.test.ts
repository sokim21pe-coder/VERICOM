import assert from "node:assert/strict";
import test from "node:test";
import {
  teaserStatusLabel,
  tomIntentLabel,
  valuationStatusLabel,
} from "@/lib/admin/format";
import {
  mapAdminSearch,
  mapDashboardKpis,
  teaserRowHasForbiddenFields,
  tomRowHasForbiddenFields,
  valuationRowHasForbiddenFields,
} from "@/lib/admin/parse";

test("dashboard mapper keeps existing KPI fields and adds control-tower counts", () => {
  const mapped = mapDashboardKpis({
    total_users: 10,
    active_users: 8,
    total_companies: 4,
    total_deals: 3,
    deals_by_seller_stage: { TEASER: 2 },
    teasers_by_status: { DRAFT: 1, APPROVED: 1 },
    users_by_role: { SELLER_USER: 5, BUYER_USER: 2 },
    tom_conversations: 7,
    tom_active: 4,
    valuation_benchmarks: 2,
    recent_users: [{ id: "u1", display_name: "A", email: "a@x", created_at: "2026-01-01" }],
    recent_deals: [{ id: "d1", title: "Deal", seller_stage_key: "TEASER", created_at: "2026-01-02" }],
    recent_admin_actions: [
      { id: "a1", action: "ADMIN_USER_VIEWED", entity_type: "user", created_at: "2026-01-03", actor_email: "admin@x" },
    ],
  });
  assert.equal(mapped.totalUsers, 10);
  assert.equal(mapped.usersByRole.SELLER_USER, 5);
  assert.equal(mapped.tomConversations, 7);
  assert.equal(mapped.valuationBenchmarks, 2);
  assert.equal(mapped.recentUsers[0]?.id, "u1");
  assert.equal(mapped.recentDeals[0]?.title, "Deal");
  assert.equal(mapped.recentAdminActions[0]?.action, "ADMIN_USER_VIEWED");
});

test("global search maps only user/company/deal hits", () => {
  const result = mapAdminSearch({
    users: [{ id: "u1", display_name: "김순오", email: "kim@x", status: "active" }],
    companies: [{ id: "c1", name: "베리컴", verification_status: "verified" }],
    deals: [{ id: "d1", title: "매각", seller_stage_key: "TEASER" }],
  });
  assert.equal(result.users[0]?.href, "/admin/users/u1");
  assert.equal(result.companies[0]?.href, "/admin/companies/c1");
  assert.equal(result.deals[0]?.href, "/admin/deals/d1");
});

test("admin document/tom/valuation rows reject conversation and calculation payloads", () => {
  assert.equal(teaserRowHasForbiddenFields({ id: "t1", headline: "x" }), false);
  assert.equal(teaserRowHasForbiddenFields({ id: "t1", content: { body: "secret" } }), true);
  assert.equal(tomRowHasForbiddenFields({ id: "c1", message_count: 3 }), false);
  assert.equal(tomRowHasForbiddenFields({ id: "c1", body: "상담 본문" }), true);
  assert.equal(valuationRowHasForbiddenFields({ id: "v1", method: "EV_SALES" }), false);
  assert.equal(valuationRowHasForbiddenFields({ id: "v1", multiple: 8.5 }), true);
  assert.equal(valuationRowHasForbiddenFields({ id: "v1", equity_value: 100 }), true);
});

test("control tower labels stay on existing schema values", () => {
  assert.equal(teaserStatusLabel("IN_REVIEW"), "검토 중");
  assert.equal(tomIntentLabel("sell"), "매각(sell)");
  assert.equal(valuationStatusLabel("TEST_ONLY"), "테스트 전용");
});
