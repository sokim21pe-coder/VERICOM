const EOK = 100_000_000;
const MAN = 10_000;

/** 계산은 원 단위 정수를 유지한다. 표시용 헬퍼. */
export function formatKrw(krw: number): string {
  if (!Number.isFinite(krw) || krw < 0) return "UNKNOWN";
  const rounded = Math.round(krw);
  if (rounded === 0) return "0원";

  if (rounded >= EOK) {
    const eok = rounded / EOK;
    const label = Number.isInteger(eok) ? String(eok) : eok.toFixed(1).replace(/\.0$/, "");
    return `${label}억 원`;
  }

  if (rounded >= MAN) {
    const man = rounded / MAN;
    const label = Number.isInteger(man) ? String(man) : man.toFixed(1).replace(/\.0$/, "");
    return `${label}만 원`;
  }

  return `${rounded.toLocaleString("ko-KR")}원`;
}

export function formatKrwRange(low: number | null, high: number | null): string {
  if (low == null && high == null) return "UNKNOWN";
  if (low != null && high == null) return `${formatKrw(low)} 이상`;
  if (low == null && high != null) return `${formatKrw(high)} 이하`;
  if (low != null && high != null && low === high) return formatKrw(low);
  return `${formatKrw(low as number)} ~ ${formatKrw(high as number)}`;
}
