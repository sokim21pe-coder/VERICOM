import type { WorkspaceNavItem } from "@/components/layout/WorkspaceHeader";

/** 구현된 기능 또는 정직한 준비 중만. MASTER_SPEC 6.1 전체 IA는 후속. */
export const sellerNav: WorkspaceNavItem[] = [
  { href: "/seller", label: "홈" },
  { href: "/consult?intent=sell", label: "TOM" },
  { href: "/seller/deals", label: "거래" },
  { href: "/seller/docs", label: "자료실" },
  { href: "/seller/valuation", label: "가치평가" },
  { href: "/seller/documents", label: "문서", preparing: true },
];

export const buyerNav: WorkspaceNavItem[] = [
  { href: "/buyer", label: "홈" },
  { href: "/consult?intent=buy", label: "TOM" },
  { href: "/buyer/criteria", label: "인수조건" },
  { href: "/buyer/deals", label: "거래" },
  { href: "/buyer/docs", label: "문서" },
];

export const expertNav: WorkspaceNavItem[] = [
  { href: "/expert", label: "홈" },
  { href: "/expert/assigned", label: "배정 Deal", preparing: true },
  { href: "/expert/workstream", label: "Workstream", preparing: true },
  { href: "/expert/requests", label: "자료요청", preparing: true },
  { href: "/expert/findings", label: "Findings", preparing: true },
  { href: "/expert/reports", label: "Reports", preparing: true },
  { href: "/expert/tom", label: "TOM" },
];

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
    note: "회사 정보·Verification은 후속 단계입니다.",
  },
  buyers: {
    title: "인수후보",
    screenId: "S-BUYERS",
    note: "Buyer Matching은 후속 단계입니다. 추천 회사는 표시하지 않습니다.",
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
  recommended: {
    title: "추천 Deal",
    screenId: "B-RECOMMENDED",
    note: "Matching Engine 준비 전입니다. 추천 회사는 표시하지 않습니다.",
  },
  interest: {
    title: "관심 Deal",
    screenId: "B-INTEREST",
    note: "관심 표시 기능은 후속 단계입니다.",
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
    note: "FDD/LDD 등 Workstream은 후속 단계입니다.",
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
