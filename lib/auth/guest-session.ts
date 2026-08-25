import { cookies } from "next/headers";

export const GUEST_COOKIE = "vericom_guest_session";

/** TODO: Guest Session → TOM Structured Memory → users.guest_session_id 연결 */
export async function getGuestSessionId(): Promise<string | null> {
  const store = await cookies();
  return store.get(GUEST_COOKIE)?.value ?? null;
}
