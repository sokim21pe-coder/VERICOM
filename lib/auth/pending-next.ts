import { cookies } from "next/headers";
import { safeNextPath } from "@/lib/tom/paths";

export const PENDING_NEXT_COOKIE = "vericom_post_auth_next";

const cookieBase = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
};

export async function setPendingNextPath(path: string | null): Promise<void> {
  const jar = await cookies();
  const safe = safeNextPath(path);
  if (!safe) {
    jar.set(PENDING_NEXT_COOKIE, "", { ...cookieBase, maxAge: 0 });
    return;
  }
  jar.set(PENDING_NEXT_COOKIE, safe, {
    ...cookieBase,
    maxAge: 60 * 30,
  });
}

export async function peekPendingNextPath(): Promise<string | null> {
  const jar = await cookies();
  return safeNextPath(jar.get(PENDING_NEXT_COOKIE)?.value ?? null);
}

export async function consumePendingNextPath(): Promise<string | null> {
  const pending = await peekPendingNextPath();
  const jar = await cookies();
  jar.set(PENDING_NEXT_COOKIE, "", { ...cookieBase, maxAge: 0 });
  return pending;
}
