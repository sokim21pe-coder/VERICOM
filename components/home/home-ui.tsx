import type { ReactNode } from "react";

export function AppWindow({
  title,
  meta,
  children,
}: {
  title: string;
  meta?: string;
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#E4E7EC] bg-white shadow-[0_28px_64px_-32px_rgba(0,33,71,0.38)]">
      <div className="flex items-center gap-3 border-b border-[#E4E7EC] bg-[#F7F8FA] px-4 py-2.5">
        <span aria-hidden="true" className="flex gap-1.5">
          <span className="size-1.5 rounded-full bg-[#D0D5DD]" />
          <span className="size-1.5 rounded-full bg-[#D0D5DD]" />
          <span className="size-1.5 rounded-full bg-[#D0D5DD]" />
        </span>
        <p className="text-[11px] font-medium tracking-[0.16em] text-navy">{title}</p>
        {meta ? <p className="ml-auto text-[11px] text-[#475467]">{meta}</p> : null}
      </div>
      {children}
    </div>
  );
}

export function OutlineIcon({
  name,
  className = "size-5 text-navy",
}: {
  name: "role" | "deal" | "isolation" | "gate" | "storage" | "audit";
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {name === "role" ? (
        <>
          <circle cx="12" cy="8" r="3.2" />
          <path d="M5.5 19c.8-3 3.3-4.5 6.5-4.5s5.7 1.5 6.5 4.5" />
        </>
      ) : null}
      {name === "deal" ? (
        <>
          <rect x="4.5" y="5" width="15" height="14" rx="1.5" />
          <path d="M8 9h8M8 12.5h5" />
        </>
      ) : null}
      {name === "isolation" ? (
        <>
          <rect x="3.5" y="11" width="7" height="8" rx="1" />
          <rect x="13.5" y="5" width="7" height="14" rx="1" />
        </>
      ) : null}
      {name === "gate" ? (
        <>
          <rect x="5" y="11" width="14" height="9" rx="1" />
          <path d="M8 11V8a4 4 0 0 1 8 0v3" />
        </>
      ) : null}
      {name === "storage" ? (
        <>
          <rect x="4" y="6" width="16" height="4" rx="1" />
          <rect x="4" y="12" width="16" height="7" rx="1" />
        </>
      ) : null}
      {name === "audit" ? (
        <>
          <path d="M8 4h7l5 5v11H8V4Z" />
          <path d="M15 4v5h5M10 13h6M10 16h4" />
        </>
      ) : null}
    </svg>
  );
}
