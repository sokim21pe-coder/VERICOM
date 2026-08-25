export const PRIVATE_STORAGE_BUCKET = "vericom-private";

export function assertServerStorageAccess(): void {
  if (typeof window !== "undefined") {
    throw new Error("STORAGE_CLIENT_FORBIDDEN");
  }
}
