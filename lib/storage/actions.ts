"use server";

import { randomUUID } from "crypto";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getCurrentContext } from "@/lib/auth/session";
import { authErrorMessage } from "@/lib/auth/errors";
import { recordAudit } from "@/lib/audit";
import { ErrorCode } from "@/types/enums";
import {
  PRIVATE_ALLOWED_MIME,
  PRIVATE_FILE_MAX_BYTES,
  PRIVATE_STORAGE_BUCKET,
  assertServerStorageAccess,
  buildPrivateObjectPath,
  isCompanyObjectPath,
} from "@/lib/storage/private";

export type PrivateFileItem = {
  path: string;
  name: string;
  updatedAt: string | null;
};

function isUploadFile(value: FormDataEntryValue | null): value is File {
  return Boolean(
    value &&
      typeof value === "object" &&
      "arrayBuffer" in value &&
      "size" in value &&
      "name" in value,
  );
}

function isAllowedUpload(file: File): boolean {
  if (
    PRIVATE_ALLOWED_MIME.includes(
      file.type as (typeof PRIVATE_ALLOWED_MIME)[number],
    )
  ) {
    return true;
  }
  const name = file.name.toLowerCase();
  return [".pdf", ".png", ".jpg", ".jpeg", ".txt"].some((ext) =>
    name.endsWith(ext),
  );
}

function fail(message: string) {
  return { ok: false as const, message, url: null as string | null };
}

export async function listCompanyPrivateFiles(): Promise<{
  ok: boolean;
  message: string | null;
  files: PrivateFileItem[];
}> {
  assertServerStorageAccess();
  if (!isSupabaseConfigured()) {
    return { ok: false, message: authErrorMessage[ErrorCode.ENV_NOT_CONFIGURED], files: [] };
  }
  const context = await getCurrentContext();
  if (!context) {
    return { ok: false, message: authErrorMessage[ErrorCode.AUTH_REQUIRED], files: [] };
  }
  if (!context.company) {
    return { ok: false, message: "회사 연결 후 비공개 자료를 사용할 수 있습니다.", files: [] };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { ok: false, message: authErrorMessage[ErrorCode.ENV_NOT_CONFIGURED], files: [] };
  }

  const { data, error } = await supabase.storage
    .from(PRIVATE_STORAGE_BUCKET)
    .list(context.company.id, { limit: 100, sortBy: { column: "updated_at", order: "desc" } });

  if (error) {
    if (error.message.toLowerCase().includes("not found") || error.message.includes("Bucket")) {
      return {
        ok: false,
        message:
          "비공개 저장 버킷이 없습니다. Supabase SQL Editor에서 0010_private_storage.sql을 실행해 주세요.",
        files: [],
      };
    }
    return { ok: false, message: "자료를 불러오지 못했습니다.", files: [] };
  }

  const files = (data ?? [])
    .filter((item) => item.name && !item.name.endsWith("/"))
    .map((item) => ({
      path: `${context.company!.id}/${item.name}`,
      name: item.name,
      updatedAt: item.updated_at ?? null,
    }));

  return { ok: true, message: null, files };
}

export async function uploadCompanyPrivateFile(formData: FormData): Promise<{
  ok: boolean;
  message: string | null;
}> {
  assertServerStorageAccess();
  if (!isSupabaseConfigured()) {
    return { ok: false, message: authErrorMessage[ErrorCode.ENV_NOT_CONFIGURED] };
  }
  const context = await getCurrentContext();
  if (!context) {
    return { ok: false, message: authErrorMessage[ErrorCode.AUTH_REQUIRED] };
  }
  if (!context.company) {
    return { ok: false, message: "회사 연결 후 업로드할 수 있습니다." };
  }

  const file = formData.get("file");
  if (!isUploadFile(file) || file.size === 0) {
    return { ok: false, message: "파일을 선택해 주세요." };
  }
  if (file.size > PRIVATE_FILE_MAX_BYTES) {
    return { ok: false, message: "파일은 10MB 이하여야 합니다." };
  }
  if (!isAllowedUpload(file)) {
    return { ok: false, message: "PDF, PNG, JPEG, TXT만 올릴 수 있습니다." };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { ok: false, message: authErrorMessage[ErrorCode.ENV_NOT_CONFIGURED] };
  }

  const path = buildPrivateObjectPath(
    context.company.id,
    file.name,
    randomUUID(),
  );
  const buffer = Buffer.from(await file.arrayBuffer());
  const contentType =
    file.type &&
    PRIVATE_ALLOWED_MIME.includes(
      file.type as (typeof PRIVATE_ALLOWED_MIME)[number],
    )
      ? file.type
      : file.name.toLowerCase().endsWith(".pdf")
        ? "application/pdf"
        : file.name.toLowerCase().endsWith(".png")
          ? "image/png"
          : file.name.toLowerCase().endsWith(".txt")
            ? "text/plain"
            : "image/jpeg";

  const { error } = await supabase.storage
    .from(PRIVATE_STORAGE_BUCKET)
    .upload(path, buffer, {
      contentType,
      upsert: false,
    });

  if (error) {
    if (error.message.toLowerCase().includes("not found") || error.message.includes("Bucket")) {
      return {
        ok: false,
        message:
          "비공개 저장 버킷이 없습니다. Supabase SQL Editor에서 0010_private_storage.sql을 실행해 주세요.",
      };
    }
    if (error.message.toLowerCase().includes("row-level security") || error.message.toLowerCase().includes("unauthorized")) {
      return { ok: false, message: authErrorMessage[ErrorCode.PERMISSION_DENIED] };
    }
    return { ok: false, message: "파일을 저장하지 못했습니다." };
  }

  await recordAudit({
    action: "UPLOAD_PRIVATE_FILE",
    entityType: "storage_object",
    entityId: context.company.id,
  });
  return { ok: true, message: "비공개 저장소에 올렸습니다." };
}

export async function createPrivateDownloadUrl(path: string): Promise<{
  ok: boolean;
  message: string | null;
  url: string | null;
}> {
  assertServerStorageAccess();
  if (!isSupabaseConfigured()) {
    return fail(authErrorMessage[ErrorCode.ENV_NOT_CONFIGURED]);
  }
  const context = await getCurrentContext();
  if (!context) {
    return fail(authErrorMessage[ErrorCode.AUTH_REQUIRED]);
  }
  if (!context.company || !isCompanyObjectPath(path, context.company.id)) {
    return fail(authErrorMessage[ErrorCode.PERMISSION_DENIED]);
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return fail(authErrorMessage[ErrorCode.ENV_NOT_CONFIGURED]);
  }

  const { data, error } = await supabase.storage
    .from(PRIVATE_STORAGE_BUCKET)
    .createSignedUrl(path, 60);

  if (error || !data?.signedUrl) {
    return fail("다운로드 주소를 만들지 못했습니다.");
  }

  await recordAudit({
    action: "DOWNLOAD_PRIVATE_FILE",
    entityType: "storage_object",
    entityId: context.company.id,
  });
  return { ok: true, message: null, url: data.signedUrl };
}
