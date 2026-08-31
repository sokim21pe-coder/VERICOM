import { listCompanyPrivateFiles } from "@/lib/storage/actions";
import {
  getExistingTomConversation,
  getNormalizedAcquisitionCriteria,
  getNormalizedFinancialInputs,
  getSellerLevel0Valuation,
} from "@/lib/tom/actions";
import { INTENT_MEMORY_KEY } from "@/lib/tom/intent-router";
import {
  classifyDiscoveryFields,
  discoveryProgress,
  getNextBestQuestion,
} from "@/lib/tom/question-policy";
import type { CurrentContext } from "@/types/context";
import type { NormalizedAcquisitionCriteria } from "@/lib/tom/normalize-acquisition-criteria";
import type { NormalizedFinancialInputs } from "@/lib/valuation/normalize-financial-inputs";
import type { TomConversation, TomMemoryItem, TomMessage } from "@/types/tom";
import type {
  BenchmarkApprovalStatus,
  ValuationCalculation,
  ValuationCalculationStatus,
} from "@/types/valuation";
import {
  BUYER_HOME_FIELDS,
  SELLER_HOME_FIELDS,
  buyerNextAction,
  consultPurpose,
  consultStillNeeded,
  discoveryFactsFromContext,
  financialAmountLabel,
  financialNormalizationStatus,
  latestTomMessage,
  latestUserMessage,
  matchingVisibility,
  platformRoleLabel,
  readableCriteriaRows,
  recentSavedMemories,
  sellerNextAction,
  valuationVisibility,
  visibleDiscoveryFields,
  type MatchingVisibility,
  type NextAction,
  type ValuationVisibility,
  type VisibleField,
} from "@/lib/workspace/visibility";
import { dealRoleLabel } from "@/lib/workspace/visibility";

export type WorkspaceContextView = {
  userName: string;
  companyName: string;
  companyIndustry: string | null;
  platformRole: string;
  dealTitle: string;
  dealRole: string;
};

export type TomHomeView = {
  hasConversation: boolean;
  conversationId: string | null;
  consultHref: string;
  purpose: string;
  started: boolean;
  recentUser: string | null;
  recentTom: string | null;
  nextQuestion: string | null;
  collected: VisibleField[];
  stillNeeded: string[];
};

export type SellerHomeModel = {
  contextView: WorkspaceContextView;
  tom: TomHomeView;
  discovery: VisibleField[];
  financial: {
    status: ReturnType<typeof financialNormalizationStatus>;
    revenue: ReturnType<typeof financialAmountLabel>;
    ebitda: ReturnType<typeof financialAmountLabel>;
    operatingProfit: ReturnType<typeof financialAmountLabel>;
    netDebt: ReturnType<typeof financialAmountLabel>;
    industry: string | null;
  };
  valuation: ValuationVisibility;
  documents: { count: number | null; status: string; href: string };
  nextAction: NextAction;
};

export type BuyerHomeModel = {
  contextView: WorkspaceContextView;
  tom: TomHomeView;
  criteriaFields: VisibleField[];
  normalizedRows: VisibleField[];
  matching: MatchingVisibility;
  nextAction: NextAction;
};

function contextViewFrom(context: CurrentContext): WorkspaceContextView {
  return {
    userName: context.user.displayName,
    companyName: context.company?.name ?? "미연결",
    companyIndustry: context.company?.industry ?? null,
    platformRole: platformRoleLabel(context.platformRole),
    dealTitle: context.deal?.title?.trim() || (context.deal ? "제목 없음" : "미선택"),
    dealRole: dealRoleLabel(context.dealRole),
  };
}

function tomHomeView(input: {
  intent: "sell" | "buy";
  conversation: TomConversation | null;
  messages: TomMessage[];
  memories: TomMemoryItem[];
  context: CurrentContext;
}): TomHomeView {
  const facts = discoveryFactsFromContext(input.context, input.intent);
  const profile = input.intent === "sell" ? "SELLER" : "BUYER";
  const next = getNextBestQuestion({
    memories: input.memories,
    context: facts,
    profile,
  });
  const { known } = classifyDiscoveryFields({
    memories: input.memories,
    context: facts,
    profile,
  });
  const collected = recentSavedMemories(input.memories, profile, 5).filter(
    (row) => known.has(row.id as never) || row.id === INTENT_MEMORY_KEY,
  );
  return {
    hasConversation: Boolean(input.conversation),
    conversationId: input.conversation?.id ?? null,
    consultHref: input.intent === "sell" ? "/consult?intent=sell" : "/consult?intent=buy",
    purpose: consultPurpose(input.intent),
    started: input.messages.some((item) => item.authorRole === "user"),
    recentUser: latestUserMessage(input.messages)?.body ?? null,
    recentTom: latestTomMessage(input.messages)?.body ?? null,
    nextQuestion: next?.question ?? null,
    collected,
    stillNeeded: consultStillNeeded(input.memories, facts, profile),
  };
}

export async function loadSellerHomeModel(
  context: CurrentContext,
): Promise<SellerHomeModel> {
  const started = await getExistingTomConversation("sell");
  const conversation = started.ok ? started.conversation : null;
  const messages = started.ok ? started.messages : [];
  const memories = started.ok ? started.memories : [];
  const facts = discoveryFactsFromContext(context, "sell");

  let financials: NormalizedFinancialInputs | null = null;
  let valuationStatus: ValuationCalculationStatus | null = null;
  let valuationCopy: string | null = null;
  let valuationResult: ValuationCalculation | null = null;
  let benchmarkApproval: BenchmarkApprovalStatus | null = null;
  if (conversation) {
    const [normalized, valuation] = await Promise.all([
      getNormalizedFinancialInputs(conversation.id),
      getSellerLevel0Valuation(conversation.id),
    ]);
    financials = normalized.ok ? normalized.inputs : null;
    valuationStatus = valuation.ok ? valuation.result?.status ?? null : null;
    valuationCopy = valuation.ok ? valuation.copy : null;
    valuationResult = valuation.ok ? valuation.result : null;
    benchmarkApproval = valuation.ok ? valuation.benchmarkApproval : null;
  }

  const files = await listCompanyPrivateFiles();
  const valuation = valuationVisibility({
    hasConversation: Boolean(conversation),
    financials,
    status: valuationStatus,
    copy: valuationCopy,
    result: valuationResult,
    benchmarkApproval,
  });
  const progress = discoveryProgress({
    memories,
    context: facts,
    profile: "SELLER",
  });
  const nextQuestion = getNextBestQuestion({
    memories,
    context: facts,
    profile: "SELLER",
  });

  return {
    contextView: contextViewFrom(context),
    tom: tomHomeView({
      intent: "sell",
      conversation,
      messages,
      memories,
      context,
    }),
    discovery: visibleDiscoveryFields({
      memories,
      context: facts,
      fields: SELLER_HOME_FIELDS,
      profile: "SELLER",
    }),
    financial: {
      status: financialNormalizationStatus(financials),
      revenue: financialAmountLabel(financials?.revenue ?? {
        krw: null,
        currency: "KRW",
        raw: "",
        unresolved: false,
        provenance: null,
      }),
      ebitda: financialAmountLabel(financials?.ebitda ?? {
        krw: null,
        currency: "KRW",
        raw: "",
        unresolved: false,
        provenance: null,
      }),
      operatingProfit: financialAmountLabel(financials?.operatingProfit ?? {
        krw: null,
        currency: "KRW",
        raw: "",
        unresolved: false,
        provenance: null,
      }),
      netDebt: financialAmountLabel(financials?.netDebt ?? {
        krw: null,
        currency: "KRW",
        raw: "",
        unresolved: false,
        provenance: null,
      }),
      industry: financials?.industry ?? context.company?.industry ?? null,
    },
    valuation,
    documents: {
      count: files.ok ? files.files.length : null,
      status: files.ok
        ? files.files.length > 0
          ? "준비 완료"
          : "데이터 없음"
        : "데이터 없음",
      href: "/seller/docs",
    },
    nextAction: sellerNextAction({
      hasConversation: Boolean(conversation),
      userMessageCount: messages.filter((item) => item.authorRole === "user").length,
      nextQuestion: nextQuestion?.question ?? null,
      requiredKnown: progress.knownRequired,
      requiredTotal: progress.requiredTotal,
      valuation,
    }),
  };
}

export async function loadBuyerHomeModel(
  context: CurrentContext,
): Promise<BuyerHomeModel> {
  const started = await getExistingTomConversation("buy");
  const conversation = started.ok ? started.conversation : null;
  const messages = started.ok ? started.messages : [];
  const memories = started.ok ? started.memories : [];
  const facts = discoveryFactsFromContext(context, "buy");

  let criteria: NormalizedAcquisitionCriteria | null = null;
  if (conversation) {
    const normalized = await getNormalizedAcquisitionCriteria(conversation.id);
    criteria = normalized.ok ? normalized.criteria : null;
  }

  const matching = matchingVisibility(criteria);
  const progress = discoveryProgress({
    memories,
    context: facts,
    profile: "BUYER",
  });
  const nextQuestion = getNextBestQuestion({
    memories,
    context: facts,
    profile: "BUYER",
  });

  return {
    contextView: contextViewFrom(context),
    tom: tomHomeView({
      intent: "buy",
      conversation,
      messages,
      memories,
      context,
    }),
    criteriaFields: visibleDiscoveryFields({
      memories,
      context: facts,
      fields: BUYER_HOME_FIELDS,
      profile: "BUYER",
    }),
    normalizedRows: readableCriteriaRows(criteria),
    matching,
    nextAction: buyerNextAction({
      hasConversation: Boolean(conversation),
      userMessageCount: messages.filter((item) => item.authorRole === "user").length,
      nextQuestion: nextQuestion?.question ?? null,
      requiredKnown: progress.knownRequired,
      requiredTotal: progress.requiredTotal,
      matching,
    }),
  };
}

export async function loadSellerValuationView() {
  const started = await getExistingTomConversation("sell");
  const conversation = started.ok ? started.conversation : null;
  let financials: NormalizedFinancialInputs | null = null;
  let status: ValuationCalculationStatus | null = null;
  let copy: string | null = null;
  let result: ValuationCalculation | null = null;
  let benchmarkApproval: BenchmarkApprovalStatus | null = null;
  if (conversation) {
    const [normalized, valuation] = await Promise.all([
      getNormalizedFinancialInputs(conversation.id),
      getSellerLevel0Valuation(conversation.id),
    ]);
    financials = normalized.ok ? normalized.inputs : null;
    status = valuation.ok ? valuation.result?.status ?? null : null;
    copy = valuation.ok ? valuation.copy : null;
    result = valuation.ok ? valuation.result : null;
    benchmarkApproval = valuation.ok ? valuation.benchmarkApproval : null;
  }
  return {
    financials,
    valuation: valuationVisibility({
      hasConversation: Boolean(conversation),
      financials,
      status,
      copy,
      result,
      benchmarkApproval,
    }),
  };
}

export async function loadBuyerCriteriaView() {
  const started = await getExistingTomConversation("buy");
  const conversation = started.ok ? started.conversation : null;
  let criteria: NormalizedAcquisitionCriteria | null = null;
  if (conversation) {
    const normalized = await getNormalizedAcquisitionCriteria(conversation.id);
    criteria = normalized.ok ? normalized.criteria : null;
  }
  return {
    rows: readableCriteriaRows(criteria),
    matching: matchingVisibility(criteria),
    hasConversation: Boolean(conversation),
  };
}
