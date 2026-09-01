import assert from "node:assert/strict";
import test from "node:test";
import { InformationState, PlatformRole } from "@/types/enums";
import type { TomMemoryItem } from "@/types/tom";
import { extractDiscoveryFromMessage } from "@/lib/tom/extract-discovery";
import { runSellerDiscoveryTurn } from "@/lib/tom/seller-discovery";
import {
  getNextBestQuestion,
  shouldAskField,
  type DiscoveryContextFacts,
} from "@/lib/tom/question-policy";
import { canReadTomConversation } from "@/lib/tom/access";
import type { CurrentContext } from "@/types/context";
import type { TomConversation } from "@/types/tom";

const sellerContext: DiscoveryContextFacts = {
  companyName: "TEST_DEV_SELLER_CO",
  industry: "테스트업종",
  platformRole: PlatformRole.SELLER_USER,
  dealId: null,
  dealRole: null,
  dealStage: null,
};

function mem(
  key: string,
  value: string,
  state: InformationState = InformationState.CONFIRMED,
): TomMemoryItem {
  return { key, value, informationState: state, source: "user_message:USER_CLAIM", confidence: 1 };
}

test("new seller sell message asks reason_for_sale once", () => {
  const turn = runSellerDiscoveryTurn({
    text: "회사를 매각하고 싶어.",
    memories: [],
    context: sellerContext,
  });
  assert.equal(turn.nextQuestion?.field, "reason_for_sale");
  assert.match(turn.reply, /이유/);
  assert.equal(
    shouldAskField("company_name", [], sellerContext),
    false,
  );
});

test("succession answer stores reason and moves to sale_scope", () => {
  const first = runSellerDiscoveryTurn({
    text: "회사를 매각하고 싶어.",
    memories: [],
    context: sellerContext,
  });
  const afterAsk: TomMemoryItem[] = [
    mem("discovery_last_question", first.askedField ?? "reason_for_sale"),
  ];
  const turn = runSellerDiscoveryTurn({
    text: "후계자가 없어.",
    memories: afterAsk,
    context: sellerContext,
  });
  const reason = turn.captures.find((item) => item.field === "reason_for_sale");
  assert.equal(reason?.value, "succession");
  assert.equal(reason?.skipped, false);
  assert.equal(turn.nextQuestion?.field, "sale_scope");
  assert.doesNotMatch(turn.reply, /이유/);
});

test("known reason_for_sale is not asked again", () => {
  const memories = [
    mem("reason_for_sale", "succession"),
    mem("sale_scope", "100_PERCENT"),
    mem("discovery_last_question", "sale_scope"),
  ];
  const question = getNextBestQuestion({ memories, context: sellerContext });
  assert.notEqual(question?.field, "reason_for_sale");
  assert.notEqual(question?.field, "sale_scope");
  const turn = runSellerDiscoveryTurn({
    text: "계속 상담하자.",
    memories,
    context: sellerContext,
  });
  assert.doesNotMatch(turn.reply, /이유/);
  assert.doesNotMatch(turn.reply, /전체 지분/);
});

test("one message can capture revenue and ebitda", () => {
  const extracted = extractDiscoveryFromMessage({
    text: "매출은 80억이고 EBITDA는 8억 정도야.",
    lastQuestion: "revenue",
  });
  const fields = extracted.captures.map((item) => item.field).sort();
  assert.deepEqual(fields, ["ebitda", "revenue"]);
  assert.equal(
    extracted.captures.find((item) => item.field === "revenue")?.value,
    String(80 * 100_000_000),
  );
  assert.equal(
    extracted.captures.find((item) => item.field === "ebitda")?.value,
    String(8 * 100_000_000),
  );
});

test("decline marks last field skipped and does not repeat it", () => {
  const memories = [mem("discovery_last_question", "desired_timeline")];
  const turn = runSellerDiscoveryTurn({
    text: "아직 모르겠어.",
    memories,
    context: sellerContext,
  });
  const skipped = turn.captures.find((item) => item.field === "desired_timeline");
  assert.equal(skipped?.skipped, true);
  assert.equal(skipped?.informationState, InformationState.UNKNOWN);
  assert.notEqual(turn.nextQuestion?.field, "desired_timeline");
});

test("reverse question is answered before discovery resumes", () => {
  const memories = [mem("discovery_last_question", "desired_timeline")];
  const turn = runSellerDiscoveryTurn({
    text: "보통 매각하는 데 몇 개월 걸리는데?",
    memories,
    context: sellerContext,
  });
  assert.equal(turn.reverseQuestion, true);
  assert.match(turn.reply, /달라질 수 있습니다/);
  assert.match(turn.reply, /시점/);
});

test("buyer role gets buyer questions not seller ones", () => {
  const question = getNextBestQuestion({
    memories: [],
    context: { ...sellerContext, platformRole: PlatformRole.BUYER_USER },
  });
  assert.equal(question?.field, "acquisition_objective");
  assert.notEqual(question?.field, "reason_for_sale");
});

test("other company cannot read conversation", () => {
  const conversation: TomConversation = {
    id: "conv",
    intent: "sell",
    companyId: "co-a",
    dealId: null,
  };
  const viewer: CurrentContext = {
    user: {
      id: "u-b",
      authUserId: "a-b",
      email: "b@test",
      displayName: "B",
    },
    company: {
      id: "co-b",
      name: "B",
      industry: null,
      verificationStatus: "unverified",
    },
    platformRole: PlatformRole.SELLER_USER,
    platformRoles: [PlatformRole.SELLER_USER],
    companyMembership: null,
    deal: null,
    dealRole: null,
    permissions: [],
  };
  assert.equal(canReadTomConversation(conversation, viewer), false);
  assert.equal(
    canReadTomConversation(conversation, { ...viewer, company: { ...viewer.company!, id: "co-a" } }),
    true,
  );
});

test("cash last-question amount is stored as cash not revenue", () => {
  const extracted = extractDiscoveryFromMessage({
    text: "20억",
    lastQuestion: "cash",
  });
  assert.equal(extracted.captures[0]?.field, "cash");
  assert.equal(extracted.captures[0]?.value, String(20 * 100_000_000));
  assert.ok(!extracted.captures.some((item) => item.field === "revenue"));
});

test("known cash and debt skip the net_debt question", () => {
  const memories = [
    mem("cash", String(10 * 100_000_000)),
    mem("debt", String(30 * 100_000_000)),
  ];
  assert.equal(shouldAskField("net_debt", memories, sellerContext), false);
  const next = getNextBestQuestion({ memories, context: sellerContext });
  assert.notEqual(next?.field, "net_debt");
});

test("three-year revenue cue stores each year and does not invent extras", () => {
  const extracted = extractDiscoveryFromMessage({
    text: "최근 3년 매출은 100억, 90억, 80억이야.",
    lastQuestion: "revenue",
  });
  const byField = Object.fromEntries(
    extracted.captures.map((item) => [item.field, item.value]),
  );
  assert.equal(byField.revenue, String(100 * 100_000_000));
  assert.equal(byField.revenue_year_1, String(100 * 100_000_000));
  assert.equal(byField.revenue_year_2, String(90 * 100_000_000));
  assert.equal(byField.revenue_year_3, String(80 * 100_000_000));
});
