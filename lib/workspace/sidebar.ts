import { TOM_PRODUCT_NAME } from "@/lib/brand/tom-display";
import type { WorkspaceKind } from "@/lib/auth/workspace-router";

export type SidebarLink = {
  href: string;
  label: string;
  /** 준비 중(미구현) 표시. 실제 route가 없으면 preparing으로만 두고 연결하지 않는다. */
  preparing?: boolean;
};

export type SidebarGroup = {
  title: string;
  items: SidebarLink[];
};

const accountGroup: SidebarGroup = {
  title: "계정",
  items: [{ href: "/account/profile", label: "내 프로필" }],
};

/**
 * Role 기반 Sidebar 구성. 실제 존재하는 route만 연결한다.
 * 미구현 기능은 preparing으로 표시하고 링크는 홈으로 두지 않는다(404 금지).
 */
const sellerSidebar: SidebarGroup[] = [
  {
    title: "워크스페이스",
    items: [
      { href: "/seller", label: "홈 / 요약" },
      { href: "/consult?intent=sell", label: `${TOM_PRODUCT_NAME} 상담` },
    ],
  },
  {
    title: "매각 준비",
    items: [
      { href: "/seller#discovery", label: "매각 Discovery" },
      { href: "/seller#financial", label: "기업·재무정보" },
      { href: "/seller/valuation", label: "가치평가" },
    ],
  },
  {
    title: "딜 진행",
    items: [
      { href: "/seller/deals", label: "거래 진행관리" },
      { href: "/seller/docs", label: "자료실 / VDR" },
      { href: "/seller/documents", label: "문서 준비" },
    ],
  },
  accountGroup,
];

const buyerSidebar: SidebarGroup[] = [
  {
    title: "워크스페이스",
    items: [
      { href: "/buyer", label: "홈 / 요약" },
      { href: "/consult?intent=buy", label: `${TOM_PRODUCT_NAME} 상담` },
    ],
  },
  {
    title: "인수 준비",
    items: [{ href: "/buyer/criteria", label: "인수조건" }],
  },
  {
    title: "딜 진행",
    items: [
      { href: "/buyer/deals", label: "거래 진행관리" },
      { href: "/buyer/docs", label: "문서" },
    ],
  },
  accountGroup,
];

const expertSidebar: SidebarGroup[] = [
  {
    title: "워크스페이스",
    items: [
      { href: "/expert", label: "홈 / 요약" },
      { href: "/expert/tom", label: `${TOM_PRODUCT_NAME} 상담` },
    ],
  },
  {
    title: "전문가 업무",
    items: [{ href: "/expert/benchmarks", label: "비교배수" }],
  },
  accountGroup,
];

const internalSidebar: SidebarGroup[] = [
  {
    title: "워크스페이스",
    items: [{ href: "/internal", label: "홈 / 요약" }],
  },
  {
    title: "Internal 업무",
    items: [{ href: "/internal/benchmarks", label: "비교배수" }],
  },
  accountGroup,
];

const byWorkspace: Record<WorkspaceKind, SidebarGroup[]> = {
  seller: sellerSidebar,
  buyer: buyerSidebar,
  expert: expertSidebar,
  internal: internalSidebar,
};

export function sidebarForWorkspace(kind: WorkspaceKind): SidebarGroup[] {
  return byWorkspace[kind];
}

/** href에서 query/hash를 제거한 경로. Active 판정에 사용. */
export function sidebarLinkPath(href: string): string {
  return href.split("#")[0]?.split("?")[0] ?? href;
}
