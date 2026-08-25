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
