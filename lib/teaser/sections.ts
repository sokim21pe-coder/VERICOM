import type { TeaserSectionId } from "@/lib/teaser/types";

// Teaser는 Word Processor가 아니라 구조화된 Section 모음이다.
// Foundation 범위: 아래 5개 Section 수준이면 충분하다.

export type TeaserSectionDef = {
  id: TeaserSectionId;
  order: number;
  title: string;
  /** Section 설명. 사용자 안내용. */
  hint: string;
};

export const TEASER_SECTIONS: TeaserSectionDef[] = [
  {
    id: "overview",
    order: 1,
    title: "기업 개요",
    hint: "회사를 식별하지 않는 범위에서 업종·지역·규모를 요약합니다.",
  },
  {
    id: "business",
    order: 2,
    title: "핵심 사업",
    hint: "주력 제품·서비스와 사업 구조를 설명합니다.",
  },
  {
    id: "highlights",
    order: 3,
    title: "투자 포인트",
    hint: "경쟁력·강점 등 Buyer 관심을 유도할 핵심 포인트입니다.",
  },
  {
    id: "financial",
    order: 4,
    title: "재무 하이라이트",
    hint: "매출 구간 등 제한된 재무 정보만 담습니다. 기업가치·배수는 넣지 않습니다.",
  },
  {
    id: "transaction",
    order: 5,
    title: "거래 개요",
    hint: "매각 범위·거래 목적 등 거래 관련 개요입니다.",
  },
];

export function teaserSectionTitle(id: TeaserSectionId): string {
  return TEASER_SECTIONS.find((section) => section.id === id)?.title ?? id;
}
