"use client";

import { FormEvent, useState } from "react";
import {
  createPrivateDownloadUrl,
  listCompanyPrivateFiles,
  uploadCompanyPrivateFile,
  type PrivateFileItem,
} from "@/lib/storage/actions";

export function PrivateFilePanel({
  initialFiles,
  initialError,
}: {
  initialFiles: PrivateFileItem[];
  initialError: string | null;
}) {
  const [files, setFiles] = useState(initialFiles);
  const [message, setMessage] = useState<string | null>(initialError);
  const [pending, setPending] = useState(false);

  async function onUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setPending(true);
    setMessage(null);
    const result = await uploadCompanyPrivateFile(data);
    setPending(false);
    setMessage(result.message);
    if (result.ok) {
      form.reset();
      const listed = await listCompanyPrivateFiles();
      if (listed.ok) setFiles(listed.files);
    }
  }

  async function onDownload(path: string) {
    setPending(true);
    setMessage(null);
    const result = await createPrivateDownloadUrl(path);
    setPending(false);
    if (!result.ok || !result.url) {
      setMessage(result.message);
      return;
    }
    window.open(result.url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="mt-8 max-w-xl">
      <form onSubmit={onUpload} className="grid gap-3">
        <label className="grid gap-2 text-sm">
          <span>파일 (PDF, PNG, JPEG, TXT · 10MB 이하)</span>
          <input
            type="file"
            name="file"
            required
            accept="application/pdf,image/png,image/jpeg,text/plain"
            className="text-sm text-foreground"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="w-fit rounded-md bg-navy px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60"
        >
          {pending ? "저장 중…" : "비공개 저장"}
        </button>
      </form>
      {message ? <p className="mt-4 text-sm text-muted">{message}</p> : null}

      <ul className="mt-8 grid gap-2">
        {files.length === 0 ? (
          <li className="text-sm text-muted">올린 파일이 없습니다.</li>
        ) : (
          files.map((item) => (
            <li
              key={item.path}
              className="flex items-center justify-between gap-3 rounded-md border border-line px-3 py-2 text-sm"
            >
              <span className="truncate text-foreground">{item.name}</span>
              <button
                type="button"
                disabled={pending}
                className="shrink-0 text-navy underline disabled:opacity-60"
                onClick={() => void onDownload(item.path)}
              >
                받기
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
