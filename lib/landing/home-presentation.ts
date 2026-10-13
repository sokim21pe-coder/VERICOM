import { SELLER_WORKFLOW_STAGES } from "@/lib/deal/standard-workflow";
import { startFlowHref } from "@/lib/tom/paths";

export const HOME_HERO_CTA = {
  primary: { href: startFlowHref("sell"), label: "M&A 시작하기" },
  secondary: { href: "/about/service", label: "VERICOM 알아보기" },
} as const;

export const HOME_FINAL_CTA = {
  primary: { href: startFlowHref("sell"), label: "VERICOM 시작하기" },
  secondary: { href: "/login", label: "로그인" },
} as const;

/** 홈 가용성 표기. 개발 중 기능을 현재 제공으로 표시하지 않는다. */
export const HOME_AVAILABILITY = {
  live: "현재 제공",
  planned: "개발 예정",
} as const;

/** 홈 표시용 4 Phase. 13단계 순서·라벨은 standard-workflow SoT를 그대로 쓴다. */
export const HOME_WORKFLOW_PHASES = [
  { key: "prepare", title: "Phase 1 — 준비", phase: "PHASE 1", label: "준비", orders: [1, 2, 3] as const },
  { key: "analyze", title: "Phase 2 — 분석", phase: "PHASE 2", label: "분석", orders: [4, 5, 6, 7] as const },
  { key: "negotiate", title: "Phase 3 — 협상", phase: "PHASE 3", label: "협상", orders: [8, 9, 10] as const },
  { key: "execute", title: "Phase 4 — 실행", phase: "PHASE 4", label: "실행", orders: [11, 12, 13] as const },
] as const;

export function homeSellerPhases() {
  return HOME_WORKFLOW_PHASES.map((phase) => ({
    ...phase,
    steps: phase.orders.map((order) => {
      const stage = SELLER_WORKFLOW_STAGES.find((item) => item.order === order);
      if (!stage) {
        throw new Error(`Missing seller stage order ${order}`);
      }
      return { order: stage.order, key: stage.key, label: stage.label };
    }),
  }));
}
