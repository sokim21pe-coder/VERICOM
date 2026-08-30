export type TomAuthorRole = "user" | "tom" | "system";

export type TomMessage = {
  id: string;
  authorRole: TomAuthorRole;
  body: string;
  createdAt: string;
};

export type TomConversation = {
  id: string;
  intent: "sell" | "buy";
  companyId: string | null;
  dealId: string | null;
};

/** MASTER_SPEC 8.1 + Sprint 1 상담 Intent. 매각 확정 의사가 아니다. */
export type TomIntentRouter =
  | "SELL"
  | "BUY"
  | "FUNDRAISE"
  | "SUCCESSION"
  | "PARTNERSHIP"
  | "VALUATION"
  | "DEAL_PROGRESS"
  | "DOCUMENT"
  | "GENERAL_MA"
  | "UNDECIDED"
  | "UNKNOWN";

export type TomMemoryItem = {
  key: string;
  value: string | null;
  informationState: string;
  source?: string | null;
  confidence?: number | null;
};
