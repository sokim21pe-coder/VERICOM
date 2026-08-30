import type { WorkspaceNavItem } from "@/components/layout/WorkspaceHeader";

/** MASTER_SPEC 6.1. 거래 엔진은 연결하지 않음. */
export const sellerNav: WorkspaceNavItem[] = [
  { href: "/seller", label: "홈" },
  { href: "/seller/company", label: "내 회사", todo: true },
  { href: "/seller/buyers", label: "인수후보", todo: true },
  { href: "/seller/deals", label: "진행 중 거래", todo: true },
  { href: "/seller/docs", label: "자료실" },
  { href: "/seller/experts", label: "전문가", todo: true },
  { href: "/consult?intent=sell", label: "TOM" },
];

/** MASTER_SPEC 6.2 */
export const buyerNav: WorkspaceNavItem[] = [
  { href: "/buyer", label: "홈" },
  { href: "/buyer/criteria", label: "인수조건", todo: true },
  { href: "/buyer/recommended", label: "추천 Deal", todo: true },
  { href: "/buyer/interest", label: "관심 Deal", todo: true },
  { href: "/buyer/deals", label: "진행 거래", todo: true },
  { href: "/buyer/docs", label: "자료실", todo: true },
  { href: "/consult?intent=buy", label: "TOM" },
];

/** MASTER_SPEC 6.3 */
export const expertNav: WorkspaceNavItem[] = [
  { href: "/expert", label: "홈" },
  { href: "/expert/assigned", label: "배정 Deal", todo: true },
  { href: "/expert/workstream", label: "Workstream", todo: true },
  { href: "/expert/requests", label: "자료요청", todo: true },
  { href: "/expert/findings", label: "Findings", todo: true },
  { href: "/expert/reports", label: "Reports", todo: true },
  { href: "/expert/tom", label: "TOM" },
];

/** MASTER_SPEC 6.4. Pipeline UI는 열지 않음. */
export const internalNav: WorkspaceNavItem[] = [
  { href: "/internal", label: "홈" },
];

export const sellerTodoPages: Record<
  string,
  { title: string; screenId: string; note: string }
> = {
  company: {
    title: "내 회사",
    screenId: "S-COMPANY",
    note: "회사 정보·Verification은 Placeholder입니다.",
  },
  buyers: {
    title: "인수후보",
    screenId: "S-BUYERS",
    note: "Buyer Matching은 후속 단계입니다.",
  },
  deals: {
    title: "진행 중 거래",
    screenId: "S-DEALS",
    note: "Deal 데이터는 아직 연결하지 않습니다.",
  },
  experts: {
    title: "전문가",
    screenId: "S-EXPERTS",
    note: "전문가 배정은 후속 단계입니다.",
  },
};

export const buyerTodoPages: Record<
  string,
  { title: string; screenId: string; note: string }
> = {
  criteria: {
    title: "인수조건",
    screenId: "B-CRITERIA",
    note: "Acquisition Profile은 Placeholder입니다.",
  },
  recommended: {
    title: "추천 Deal",
    screenId: "B-RECOMMENDED",
    note: "익명 Deal 추천은 후속 단계입니다.",
  },
  interest: {
    title: "관심 Deal",
    screenId: "B-INTEREST",
    note: "관심 표시 기능은 후속 단계입니다.",
  },
  deals: {
    title: "진행 거래",
    screenId: "B-DEALS",
    note: "Deal 진행 화면은 Placeholder입니다.",
  },
  docs: {
    title: "자료실",
    screenId: "B-DOCS",
    note: "문서함은 후속 단계입니다.",
  },
};

export const expertTodoPages: Record<
  string,
  { title: string; screenId: string; note: string }
> = {
  assigned: {
    title: "배정 Deal",
    screenId: "E-ASSIGNED",
    note: "Deal 배정은 후속 단계입니다.",
  },
  workstream: {
    title: "Workstream",
    screenId: "E-WORKSTREAM",
    note: "FDD/LDD 등 Workstream은 Placeholder입니다.",
  },
  requests: {
    title: "자료요청",
    screenId: "E-REQUESTS",
    note: "자료요청 흐름은 후속 단계입니다.",
  },
  findings: {
    title: "Findings",
    screenId: "E-FINDINGS",
    note: "Findings는 후속 단계입니다.",
  },
  reports: {
    title: "Reports",
    screenId: "E-REPORTS",
    note: "보고서는 후속 단계입니다.",
  },
};
