/**
 * 로그인 사용자/회사 표시값 정리 유틸.
 * - 이름 표시 우선순위와 Initial Avatar를 한 곳에서 계산한다.
 * - Sprint 0 Test Seed(PLACEHOLDER_*, TEST_DEV_*)가 Production UI에 노출되지 않도록
 *   테스트 토큰은 표시값에서 제외한다. (데이터는 변경하지 않는다.)
 */

const TEST_TOKEN_PATTERN = /^(PLACEHOLDER|TEST_DEV|TEST_ONLY|TEST)[_-]/i;

/** 테스트 시드 토큰이면 표시하지 않는다(값 없음으로 취급). */
export function isTestToken(value: string | null | undefined): boolean {
  if (!value) return false;
  return TEST_TOKEN_PATTERN.test(value.trim());
}

function cleaned(value: string | null | undefined): string {
  const trimmed = (value ?? "").trim();
  if (!trimmed || isTestToken(trimmed)) return "";
  return trimmed;
}

function emailLocalPart(email: string | null | undefined): string {
  const trimmed = (email ?? "").trim();
  if (!trimmed || !trimmed.includes("@")) return "";
  const local = trimmed.split("@")[0]?.trim() ?? "";
  return isTestToken(local) ? "" : local;
}

/**
 * 이름 표시 우선순위:
 * 1) display_name(users) 2) auth metadata 이름 3) 이메일 @ 앞부분 4) "사용자"
 * 테스트 토큰은 각 단계에서 건너뛴다. 빈 문자열은 반환하지 않는다.
 */
export function resolveUserName(input: {
  displayName?: string | null;
  metadataName?: string | null;
  email?: string | null;
}): string {
  return (
    cleaned(input.displayName) ||
    cleaned(input.metadataName) ||
    emailLocalPart(input.email) ||
    "사용자"
  );
}

/** 회사명 표시값. 없거나 테스트 토큰이면 null(호출부에서 Empty State 처리). */
export function resolveCompanyName(name: string | null | undefined): string | null {
  const value = cleaned(name);
  return value || null;
}

/**
 * Initial Avatar 문자.
 * - 한글/CJK: 첫 글자 1자 (예: 김순오 → 김)
 * - 라틴 다단어: 각 단어 첫 글자 최대 2자 대문자 (예: Paul Kim → PK)
 * - 그 외: 첫 글자 대문자
 */
export function initialsFrom(name: string): string {
  const value = name.trim();
  if (!value) return "?";

  const first = value[0] ?? "";
  const isCjk = /[\u3000-\u9fff\uac00-\ud7af]/.test(first);
  if (isCjk) return first;

  const words = value.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return value.slice(0, 2).toUpperCase();
}
