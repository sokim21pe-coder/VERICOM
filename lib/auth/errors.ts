import { ErrorCode } from "@/types/enums";

export const authErrorMessage: Record<ErrorCode, string> = {
  [ErrorCode.AUTH_REQUIRED]: "로그인이 필요합니다.",
  [ErrorCode.COMPANY_VERIFICATION_REQUIRED]: "회사 확인이 필요합니다.",
  [ErrorCode.PERMISSION_DENIED]: "권한이 없습니다.",
  [ErrorCode.APPROVAL_REQUIRED]: "승인이 필요합니다.",
  [ErrorCode.INVALID_TRANSITION]: "이 단계로 바꿀 수 없습니다.",
  [ErrorCode.VALIDATION_ERROR]: "입력값을 확인하세요.",
  [ErrorCode.DATA_PROVIDER_UNAVAILABLE]: "외부 데이터를 불러올 수 없습니다.",
  [ErrorCode.ACTION_BLOCKED]: "이 작업은 지금은 할 수 없습니다.",
  [ErrorCode.DOCUMENT_ACCESS_EXPIRED]: "문서 접근 기간이 끝났습니다.",
  [ErrorCode.EXPERT_SCOPE_VIOLATION]: "배정된 업무 범위 밖입니다.",
  [ErrorCode.CONFLICT_CHECK_REQUIRED]: "이해상충 확인이 필요합니다.",
  [ErrorCode.ENV_NOT_CONFIGURED]:
    "Supabase 연결 정보가 없습니다. NEXT_PUBLIC_SUPABASE_URL과 NEXT_PUBLIC_SUPABASE_ANON_KEY 환경변수를 설정해 주세요. (로컬은 .env.local, 배포 환경은 호스팅 환경변수에 추가 후 재배포)",
  [ErrorCode.SUPABASE_UNAVAILABLE]:
    "Supabase에 연결하지 못했습니다. 네트워크와 프로젝트 설정을 확인해 주세요.",
  [ErrorCode.DUPLICATE_EMAIL]: "이미 가입된 이메일입니다.",
  [ErrorCode.COMPANY_CREATE_FAILED]: "회사 생성에 실패했습니다.",
  [ErrorCode.MEMBERSHIP_CREATE_FAILED]: "회사 연결(Membership) 생성에 실패했습니다.",
};

export function mapAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (
    lower.includes("already registered") ||
    lower.includes("already been registered")
  ) {
    return authErrorMessage[ErrorCode.DUPLICATE_EMAIL];
  }
  if (lower.includes("invalid login") || lower.includes("invalid credentials")) {
    return "이메일 또는 비밀번호를 확인해 주세요.";
  }
  if (lower.includes("invalid email") || lower.includes("unable to validate email")) {
    return "이메일 형식을 확인해 주세요.";
  }
  if (lower.includes("password")) {
    return "비밀번호를 확인해 주세요.";
  }
  return "요청을 처리하지 못했습니다. 입력값을 확인해 주세요.";
}
