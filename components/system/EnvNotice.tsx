import { authErrorMessage } from "@/lib/auth/errors";
import { ErrorCode } from "@/types/enums";

export function EnvNotice() {
  return (
    <p className="rounded-md border border-line bg-white px-4 py-3 text-sm leading-6 text-muted">
      {authErrorMessage[ErrorCode.ENV_NOT_CONFIGURED]}
    </p>
  );
}
