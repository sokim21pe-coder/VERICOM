import Link from "next/link";
import {
  startOnboardingHref,
  type TomIntent,
} from "@/lib/tom/paths";

const buttonClass = {
  primary:
    "inline-flex h-11 items-center justify-center rounded-md bg-navy px-6 text-sm font-medium text-white hover:bg-navy-hover",
  secondary:
    "inline-flex h-11 items-center justify-center rounded-md border border-line bg-white px-6 text-sm font-medium text-foreground hover:border-navy",
};

function continueLabel(intent: TomIntent | null): string {
  if (intent === "sell") return "매각 상담 이어가기";
  if (intent === "buy") return "인수 상담 이어가기";
  return "워크스페이스 열기";
}

function startLabel(intent: TomIntent): string {
  return intent === "sell" ? "기업 매각 시작" : "기업 인수 시작";
}

export function ServiceAuthCtas({
  signedIn,
  loginHref,
  signupHref,
  continueHref,
  intent,
  startIntent,
  showStartCta,
}: {
  signedIn: boolean;
  loginHref: string;
  signupHref: string;
  continueHref: string;
  intent: TomIntent | null;
  startIntent: TomIntent | null;
  showStartCta: boolean;
}) {
  if (signedIn) {
    return (
      <div className="mt-10 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:gap-3">
        <Link href={continueHref} className={buttonClass.primary}>
          {continueLabel(intent)}
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-10 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:gap-3">
      <Link href={loginHref} className={buttonClass.primary}>
        로그인
      </Link>
      <Link href={signupHref} className={buttonClass.secondary}>
        회원가입
      </Link>
      {showStartCta && startIntent ? (
        <Link
          href={startOnboardingHref(startIntent, false)}
          className={buttonClass.secondary}
        >
          {startLabel(startIntent)}
        </Link>
      ) : null}
    </div>
  );
}
