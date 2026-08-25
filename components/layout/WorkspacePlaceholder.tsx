import Link from "next/link";
import { authErrorMessage } from "@/lib/auth/errors";
import { ErrorCode } from "@/types/enums";

type WorkspacePlaceholderProps = {
  title: string;
  screenId: string;
};

export function WorkspacePlaceholder({
  title,
  screenId,
}: WorkspacePlaceholderProps) {
  return (
    <main className="mx-auto min-h-screen max-w-lg bg-white px-6 py-24">
      <p className="text-xs tracking-[0.18em] text-navy">{screenId}</p>
      <h1 className="mt-2 text-2xl font-semibold text-foreground">{title}</h1>
      <p className="mt-4 text-muted">
        {authErrorMessage[ErrorCode.AUTH_REQUIRED]} URL만으로 워크스페이스에
        들어갈 수 없습니다. TODO: Current Context와 Workspace Router를
        서버에서 연결합니다.
      </p>
      <Link href="/login" className="mt-8 inline-block text-sm text-navy underline">
        로그인
      </Link>
    </main>
  );
}
