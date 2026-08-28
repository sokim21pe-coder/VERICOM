export const PRIVATE_STORAGE_BUCKET = "vericom-private";

export const PRIVATE_FILE_MAX_BYTES = 10 * 1024 * 1024;

export const PRIVATE_ALLOWED_MIME = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "text/plain",
] as const;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

export function sanitizeFileName(original: string): string {
  const base = original.split(/[/\\]/).pop() ?? "file";
  const cleaned = base.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
  return cleaned.length > 0 ? cleaned : "file";
}

/** `{companyId}/{objectId}_{safeName}` — 다른 회사 prefix 접근 금지. */
export function buildPrivateObjectPath(
  companyId: string,
  originalName: string,
  objectId: string,
): string {
  if (!isUuid(companyId) || !isUuid(objectId)) {
    throw new Error("INVALID_STORAGE_PATH");
  }
  const safe = sanitizeFileName(originalName);
  return `${companyId}/${objectId}_${safe}`;
}

export function isCompanyObjectPath(path: string, companyId: string): boolean {
  if (!isUuid(companyId)) return false;
  if (path.includes("..") || path.includes("\\")) return false;
  const parts = path.split("/");
  return parts.length === 2 && parts[0] === companyId && parts[1].length > 0;
}

export function assertServerStorageAccess(): void {
  if (typeof window !== "undefined") {
    throw new Error("STORAGE_CLIENT_FORBIDDEN");
  }
}
