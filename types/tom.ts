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

/** MASTER_SPEC 8.1 Intent Router */
export type TomIntentRouter =
  | "SELL"
  | "BUY"
  | "FUNDRAISE"
  | "SUCCESSION"
  | "PARTNERSHIP"
  | "UNDECIDED";

export type TomMemoryItem = {
  key: string;
  value: string | null;
  informationState: string;
};
