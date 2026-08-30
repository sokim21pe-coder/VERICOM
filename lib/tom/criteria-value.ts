/** Buyer Acquisition Criteria 값 인코딩. 새 테이블 없이 tom_memory_items.memory_value에 JSON을 넣는다. */

export type NumericCriterion = {
  krw: number | null;
  raw: string;
};

export type RangeCriterion = {
  minKrw: number | null;
  maxKrw: number | null;
  raw: string;
};

export type MultiCriterion = {
  values: string[];
  raw: string;
};

const VAGUE_AMOUNT = /수십\s*억|수백\s*억|수천\s*억|몇\s*십\s*억|몇십억/;
const EOK_RE = /(\d+(?:\.\d+)?)\s*억/g;
const RANGE_RE =
  /(\d+(?:\.\d+)?)\s*억\s*(?:에서|부터|~|-|–|—)\s*(\d+(?:\.\d+)?)\s*억/;

export function eokToKrw(eok: number): number {
  return Math.round(eok * 100_000_000);
}

export function parseEokAmounts(text: string): number[] {
  const amounts: number[] = [];
  const re = new RegExp(EOK_RE.source, "g");
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) != null) {
    const n = Number(match[1]);
    if (Number.isFinite(n)) amounts.push(eokToKrw(n));
  }
  return amounts;
}

export function parseEokRange(text: string): { minKrw: number; maxKrw: number } | null {
  const match = text.replace(/,/g, "").match(RANGE_RE);
  if (!match) return null;
  const min = Number(match[1]);
  const max = Number(match[2]);
  if (!Number.isFinite(min) || !Number.isFinite(max)) return null;
  const minKrw = eokToKrw(min);
  const maxKrw = eokToKrw(max);
  if (minKrw <= maxKrw) return { minKrw, maxKrw };
  return { minKrw: maxKrw, maxKrw: minKrw };
}

export function isVagueAmount(text: string): boolean {
  const compact = text.replace(/\s+/g, "");
  if (/\d+(?:\.\d+)?억/.test(compact)) return false;
  return VAGUE_AMOUNT.test(text);
}

export function encodeNumericCriterion(input: NumericCriterion): string {
  return JSON.stringify({ krw: input.krw, raw: input.raw });
}

export function encodeRangeBound(krw: number, raw: string): string {
  return encodeNumericCriterion({ krw, raw });
}

export function parseNumericCriterion(value: string | null | undefined): NumericCriterion | null {
  if (!value?.trim()) return null;
  const trimmed = value.trim();
  if (trimmed === "UNKNOWN" || trimmed === "SKIPPED") return null;
  try {
    const parsed = JSON.parse(trimmed) as { krw?: unknown; raw?: unknown };
    if (parsed && typeof parsed === "object" && "krw" in parsed) {
      const krw =
        typeof parsed.krw === "number" && Number.isFinite(parsed.krw)
          ? parsed.krw
          : parsed.krw === null
            ? null
            : null;
      return {
        krw,
        raw: typeof parsed.raw === "string" ? parsed.raw : trimmed,
      };
    }
  } catch {
    /* plain number from older seller-style storage */
  }
  const asNumber = Number(trimmed);
  if (Number.isFinite(asNumber) && trimmed !== "") {
    return { krw: asNumber, raw: trimmed };
  }
  return { krw: null, raw: trimmed };
}

export function encodeMultiCriterion(input: MultiCriterion): string {
  return JSON.stringify({
    values: input.values.filter((item) => item.trim()),
    raw: input.raw,
  });
}

export function parseMultiCriterion(value: string | null | undefined): MultiCriterion {
  if (!value?.trim()) return { values: [], raw: "" };
  const trimmed = value.trim();
  if (trimmed === "UNKNOWN" || trimmed === "SKIPPED") {
    return { values: [], raw: trimmed };
  }
  try {
    const parsed = JSON.parse(trimmed) as { values?: unknown; raw?: unknown } | unknown[];
    if (Array.isArray(parsed)) {
      const values = parsed
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean);
      return { values, raw: values.join(", ") };
    }
    if (parsed && typeof parsed === "object" && Array.isArray(parsed.values)) {
      const values = parsed.values
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean);
      return {
        values,
        raw: typeof parsed.raw === "string" ? parsed.raw : values.join(", "),
      };
    }
  } catch {
    /* comma-separated or single token */
  }
  const values = trimmed
    .split(/[,，/]/)
    .map((item) => item.trim())
    .filter(Boolean);
  return { values, raw: trimmed };
}

export function mergeStoredMultiValue(
  previous: string | null | undefined,
  incoming: string,
): string {
  const prev = parseMultiCriterion(previous);
  const next = parseMultiCriterion(incoming);
  const values = [...prev.values];
  for (const item of next.values) {
    if (!values.some((existing) => existing.toLowerCase() === item.toLowerCase())) {
      values.push(item);
    }
  }
  return encodeMultiCriterion({
    values,
    raw: next.raw || prev.raw,
  });
}

export function krwFromStored(value: string | null | undefined): number | null {
  return parseNumericCriterion(value)?.krw ?? null;
}
