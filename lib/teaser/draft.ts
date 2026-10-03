import type {
  TeaserContent,
  TeaserDataPoint,
  TeaserDataState,
  TeaserSectionContent,
} from "@/lib/teaser/types";
import { TEASER_SECTIONS } from "@/lib/teaser/sections";
import { buildMaskedDescriptor } from "@/lib/teaser/identity";

// Teaser Draft 생성기(Rule 기반, LLM 아님).
// 확인된 구조화 사실만 사용한다. 없는 정보는 창작하지 않고 "확인 필요"로 남긴다.
// 기업가치/Multiple 등 Valuation 결과는 Teaser에 자동 포함하지 않는다.

export type TeaserMemoryInput = {
  key: string;
  value: string | null;
  informationState: string;
};

export type TeaserDraftInput = {
  companyName: string | null;
  companyIndustry: string | null;
  memories: TeaserMemoryInput[];
  /** 정규화된 최근 연매출(원). 있으면 구간으로만 표기. 없으면 UNKNOWN. */
  revenueKrw?: number | null;
  /** 식별정보 공개 승인 여부. 기본 false(마스킹 유지). */
  identityReleased?: boolean;
};

const UNKNOWN_TEXT = "확인 필요";

function cleanValue(value: string | null | undefined): string | null {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return null;
  const upper = trimmed.toUpperCase();
  if (upper === "UNKNOWN" || upper === "SKIPPED") return null;
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) return null;
  return trimmed;
}

function toDataState(informationState: string): TeaserDataState {
  if (informationState === "CONFIRMED") return "CONFIRMED";
  if (informationState === "ESTIMATED") return "ESTIMATED";
  return "UNKNOWN";
}

function pointFromMemory(
  memories: TeaserMemoryInput[],
  key: string,
  label: string,
): TeaserDataPoint {
  const row = memories.find((item) => item.key === key);
  const value = cleanValue(row?.value);
  if (!row || !value || toDataState(row.informationState) === "UNKNOWN") {
    return { id: key, label, value: null, state: "UNKNOWN" };
  }
  return { id: key, label, value, state: toDataState(row.informationState) };
}

/** 매출을 구간으로만 표기한다(기밀 보호). 정확한 숫자를 노출하지 않는다. */
export function revenueBand(krw: number | null | undefined): string | null {
  if (krw == null || !Number.isFinite(krw) || krw <= 0) return null;
  const eok = krw / 100_000_000;
  if (eok < 50) return "매출 약 50억 원 미만";
  if (eok < 100) return "매출 약 50~100억 원";
  if (eok < 300) return "매출 약 100~300억 원";
  if (eok < 500) return "매출 약 300~500억 원";
  if (eok < 1000) return "매출 약 500~1,000억 원";
  if (eok < 3000) return "매출 약 1,000~3,000억 원";
  return "매출 약 3,000억 원 이상";
}

function sectionLine(prefix: string, point: TeaserDataPoint): string {
  if (point.state === "UNKNOWN" || !point.value) {
    return `${prefix}: ${UNKNOWN_TEXT}`;
  }
  const suffix = point.state === "ESTIMATED" ? " (추정)" : "";
  return `${prefix}: ${point.value}${suffix}`;
}

export function buildTeaserDraft(input: TeaserDraftInput): TeaserContent {
  const memories = input.memories ?? [];
  const identityMasked = !input.identityReleased;

  // 업종: 메모리 우선, 없으면 companies.industry(저장된 사실)로 보완.
  const industryPoint = (() => {
    const fromMemory = pointFromMemory(memories, "industry", "업종");
    if (fromMemory.state !== "UNKNOWN") return fromMemory;
    const stored = cleanValue(input.companyIndustry);
    if (stored) {
      return { id: "industry", label: "업종", value: stored, state: "CONFIRMED" as const };
    }
    return fromMemory;
  })();

  const regionPoint = pointFromMemory(memories, "location", "지역");
  const employeesPoint = pointFromMemory(memories, "employees", "임직원 규모");
  const establishmentPoint = pointFromMemory(memories, "establishment", "설립");
  const productsPoint = pointFromMemory(memories, "key_products_services", "주력 제품·서비스");
  const customersPoint = pointFromMemory(memories, "key_customers", "주요 고객");
  const advantagePoint = pointFromMemory(memories, "competitive_advantage", "핵심 경쟁력");
  const scopePoint = pointFromMemory(memories, "sale_scope", "매각 범위");
  const reasonPoint = pointFromMemory(memories, "reason_for_sale", "거래 목적");
  const structurePoint = pointFromMemory(memories, "preferred_structure", "희망 거래 구조");

  // 재무: 매출 구간만. 기업가치/배수는 포함하지 않는다.
  const revenuePoint: TeaserDataPoint = (() => {
    const band = revenueBand(input.revenueKrw ?? null);
    if (band) return { id: "revenue_band", label: "매출 규모", value: band, state: "CONFIRMED" };
    return { id: "revenue_band", label: "매출 규모", value: null, state: "UNKNOWN" };
  })();

  const maskedDescriptor = buildMaskedDescriptor({
    region: regionPoint.value,
    industry: industryPoint.value,
    businessKeyword: productsPoint.value,
  });

  const headline = identityMasked
    ? maskedDescriptor
    : cleanValue(input.companyName) ?? maskedDescriptor;

  const sections: TeaserSectionContent[] = TEASER_SECTIONS.map((def) => {
    let dataPoints: TeaserDataPoint[] = [];
    let lines: string[] = [];

    switch (def.id) {
      case "overview":
        dataPoints = [industryPoint, regionPoint, employeesPoint, establishmentPoint];
        lines = [
          headline,
          sectionLine("업종", industryPoint),
          sectionLine("지역", regionPoint),
          sectionLine("임직원 규모", employeesPoint),
          sectionLine("설립", establishmentPoint),
        ];
        break;
      case "business":
        dataPoints = [productsPoint, customersPoint];
        lines = [
          sectionLine("주력 제품·서비스", productsPoint),
          sectionLine("주요 고객", customersPoint),
        ];
        break;
      case "highlights":
        dataPoints = [advantagePoint];
        lines = [sectionLine("핵심 경쟁력", advantagePoint)];
        break;
      case "financial":
        dataPoints = [revenuePoint];
        lines = [
          sectionLine("매출 규모", revenuePoint),
          "※ 상세 재무·기업가치는 NDA 이후 IM 단계에서 제공합니다.",
        ];
        break;
      case "transaction":
        dataPoints = [scopePoint, reasonPoint, structurePoint];
        lines = [
          sectionLine("매각 범위", scopePoint),
          sectionLine("거래 목적", reasonPoint),
          sectionLine("희망 거래 구조", structurePoint),
        ];
        break;
    }

    return {
      id: def.id,
      title: def.title,
      body: lines.join("\n"),
      dataPoints,
    };
  });

  const missing = sections
    .flatMap((section) => section.dataPoints)
    .filter((point) => point.state === "UNKNOWN")
    .map((point) => point.label);

  return {
    headline,
    identityMasked,
    maskedDescriptor,
    sections,
    missing: Array.from(new Set(missing)),
  };
}
