// Teaser Identity 마스킹.
// 기본 원칙: NDA 전 Teaser는 Seller 신원을 과도하게 노출하지 않는다.
// 명시적 Identity Release 승인이 없으면 회사명을 그대로 쓰지 않는다.
// 이 Foundation 단계에는 Identity Release Gate가 아직 없으므로 항상 마스킹한다(우회 금지).

export type MaskedDescriptorInput = {
  /** 지역(예: "경기", "국내"). 확인된 값만. */
  region?: string | null;
  /** 업종 설명(예: "산업용 배터리팩"). 확인된 값만. */
  industry?: string | null;
  /** 핵심 사업 키워드(예: "배터리팩 설계·제조"). 확인된 값만. */
  businessKeyword?: string | null;
};

const GENERIC_DESCRIPTOR = "국내 비상장 중소·중견기업";

/**
 * NDA 전 익명 Teaser에 넣으면 안 되는 값.
 * - 긴 숫자 ID/세션 토큰(식별 가능한 독특한 정보, MASTER_SPEC 13.1)
 * - EBITDA/EV/WACC/배수 등 원문 재무·가치 문장(매출 구간은 revenueBand만 허용)
 * 해당 값은 창작하지 않고 호출측에서 UNKNOWN/확인 필요로 떨어뜨린다.
 */
export function isUnsafeAnonymousFact(value: string): boolean {
  if (/\d{10,}/.test(value)) return true;
  if (/이어가기매각/i.test(value)) return true;
  if (/\bEBITDA\b|\bWACC\b|\bEV\b\s*\/|비교배수/i.test(value)) return true;
  if (/기업가치\s*\d/.test(value)) return true;
  return false;
}

function clean(value: string | null | undefined): string | null {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return null;
  const upper = trimmed.toUpperCase();
  if (upper === "UNKNOWN" || upper === "SKIPPED") return null;
  if (isUnsafeAnonymousFact(trimmed)) return null;
  return trimmed;
}

function normalizeRegion(region: string | null): string {
  if (!region) return "국내";
  // 이미 "국내/국외" 등 접두가 있으면 그대로, 아니면 지역명만 사용.
  return region;
}

/**
 * 익명 회사 설명을 만든다. 회사명은 절대 포함하지 않는다.
 * 확인된 사실이 없으면 식별 불가능한 일반 표현으로 떨어진다.
 * 예: region="국내", industry="산업용 배터리팩" → "국내 산업용 배터리팩 전문기업"
 */
export function buildMaskedDescriptor(input: MaskedDescriptorInput): string {
  const region = clean(input.region ?? null);
  const industry = clean(input.industry ?? null);
  const business = clean(input.businessKeyword ?? null);

  const core = industry ?? business;
  if (!core) {
    return region ? `${normalizeRegion(region)} 비상장 중소·중견기업` : GENERIC_DESCRIPTOR;
  }
  const prefix = normalizeRegion(region);
  return `${prefix} ${core} 전문기업`;
}

/**
 * 주어진 텍스트가 회사명을 노출하는지 검사한다.
 * Identity Release 승인이 없을 때(masked=true) 회사명이 본문에 있으면 노출로 간주한다.
 */
export function exposesCompanyName(
  text: string | null | undefined,
  companyName: string | null | undefined,
): boolean {
  const name = clean(companyName ?? null);
  const body = (text ?? "").trim();
  if (!name || !body) return false;
  return body.includes(name);
}
