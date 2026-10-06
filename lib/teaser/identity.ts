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
export const ANONYMOUS_FACT_FALLBACK = "확인 필요";

/** 허용된 매출 구간 표현(정확한 원문 금액이 아님). */
function hasSafeRevenueBand(text: string): boolean {
  return /매출\s*약\s*[\d,]+(?:억\s*원\s*미만|~[\d,]+\s*억(?:\s*원)?|억\s*원\s*이상)/.test(
    text,
  );
}

/**
 * NDA 전 익명 Teaser에 넣으면 안 되는 값(MASTER_SPEC 13.1).
 * 회사 고유명사·고객사·브랜드·정확주소·원문 재무·특허·단독공급 등
 * Seller를 특정할 수 있는 raw fact. 해당 값은 창작하지 않고
 * 호출측에서 UNKNOWN/확인 필요로 떨어뜨린다. 매출 구간(revenueBand)은 허용.
 */
export function isUnsafeAnonymousFact(value: string): boolean {
  const text = value.trim();
  if (!text) return false;

  // 고유 세션/딜 토큰
  if (/이어가기매각/i.test(text)) return true;

  // 법인격·상호(익명 Teaser에 회사 고유명사 금지)
  if (
    /주식회사|\(주\)|㈜|유한회사|\bInc\.?\b|\bLtd\.?\b|\bLLC\b|\bCorp\.?\b/i.test(
      text,
    )
  ) {
    return true;
  }

  // 콤마 구분 원 단위 금액(예: 8,742,183,221원) 또는 10자리 이상 숫자 ID
  if (/\d{1,3}(?:,\d{3}){2,}(?:원)?/.test(text)) return true;
  if (/\d{10,}/.test(text.replace(/[,\s]/g, ""))) return true;

  // 정확주소: 구 + 로/길, 또는 도로명+번지
  if (/[가-힣]+구\s+[가-힣0-9]+(?:로|길)/.test(text)) return true;
  if (/(?:로|길)\s*\d+(?:-\d+)?/.test(text) && /[시군구동읍면]/.test(text)) {
    return true;
  }

  // 특허번호
  if (/특허/.test(text) && /[\d-]{4,}/.test(text)) return true;
  if (/\bKR\s*10[-\s]?\d/i.test(text)) return true;

  // 가치평가·배수 원문(매출 구간은 예외)
  if (/\bEBITDA\b|\bWACC\b|\bEV\b(?:\s*\/)?|비교배수/i.test(text)) return true;
  if (/기업가치/.test(text) && /\d/.test(text)) return true;

  // 원문 매출/영업이익/계약금액(흑자·적자·허용 구간은 제외)
  if (
    /(?:매출액?|영업이익|당기순이익|계약금액|고객매출)/.test(text) &&
    /\d/.test(text) &&
    !hasSafeRevenueBand(text)
  ) {
    return true;
  }

  // 특정 고객 단독공급 등 식별 관계
  if (/단독\s*공급/.test(text)) return true;

  // 4자 이상 라틴 대문자 고유명(예: POSCO). BMS·B2B 등은 해당 없음.
  if (/\b[A-Z]{4,}\b/.test(text)) return true;
  // TEST_DEV_SELLER_CO 같은 식별 토큰
  if (/[A-Z]{2,}(?:_[A-Z0-9]+){1,}/.test(text)) return true;

  // 모델/SKU 형태 고유 제품명(예: SuperPack-9000)
  if (/[A-Za-z가-힣]+-\d{3,}/.test(text)) return true;
  if (/[™®]/.test(text)) return true;

  return false;
}

function normalizeFactToken(value: string | null | undefined): string | null {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return null;
  const upper = trimmed.toUpperCase();
  if (upper === "UNKNOWN" || upper === "SKIPPED") return null;
  return trimmed;
}

function clean(value: string | null | undefined): string | null {
  const trimmed = normalizeFactToken(value);
  if (!trimmed) return null;
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
 * 회사명 자체에 법인격이 있어도 비교 대상에서 빼지 않는다.
 */
export function exposesCompanyName(
  text: string | null | undefined,
  companyName: string | null | undefined,
): boolean {
  const name = normalizeFactToken(companyName);
  const body = (text ?? "").trim();
  if (!name || !body) return false;
  return body.includes(name);
}

function isUnsafeValue(value: string, companyName?: string | null): boolean {
  return isUnsafeAnonymousFact(value) || exposesCompanyName(value, companyName ?? null);
}

function sanitizeAnonymousTeaserLine(
  line: string,
  companyName?: string | null,
): string {
  const trimmed = line.trim();
  if (!trimmed) return line;

  const labeled = trimmed.match(/^(.{1,40}?):\s*(.*)$/);
  if (labeled) {
    const prefix = labeled[1];
    const rest = labeled[2] ?? "";
    if (!rest) return line;
    if (isUnsafeValue(rest, companyName) || isUnsafeValue(trimmed, companyName)) {
      return `${prefix}: ${ANONYMOUS_FACT_FALLBACK}`;
    }
    return line;
  }

  if (isUnsafeValue(trimmed, companyName)) return ANONYMOUS_FACT_FALLBACK;
  return line;
}

/**
 * 익명 Teaser 본문/헤드라인에서 13.1 위반 줄을 확인 필요로 치환한다.
 * 라벨(`항목: 값`)은 유지하고 값만 떨어뜨린다.
 */
export function sanitizeAnonymousTeaserText(
  value: string,
  companyName?: string | null,
): string {
  return value
    .split("\n")
    .map((line) => sanitizeAnonymousTeaserLine(line, companyName))
    .join("\n");
}
