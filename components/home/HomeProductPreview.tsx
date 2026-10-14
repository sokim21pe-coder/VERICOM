import { AppWindow } from "@/components/home/home-ui";

export function HomeProductPreview() {
  return (
    <div className="relative mx-auto w-full max-w-xl pb-14 sm:max-w-2xl lg:max-w-none lg:pb-12">
      <div
        aria-hidden="true"
        className="absolute inset-x-6 top-6 bottom-2 rounded-xl border border-[#E4E7EC] bg-[#F7F8FA] sm:inset-x-8"
      />
      <div className="relative">
        <AppWindow title="DEAL WORKSPACE" meta="Seller Workspace">
          <div className="grid min-h-[320px] sm:min-h-[380px] sm:grid-cols-[11.5rem_minmax(0,1fr)]">
            <aside className="border-b border-[#E4E7EC] bg-[#F7F8FA] px-3 py-5 sm:border-b-0 sm:border-r">
              <p className="px-2.5 text-[10px] tracking-[0.16em] text-[#475467]">WORKSPACE</p>
              <ul className="mt-2 space-y-1 text-[13px] leading-5 text-[#475467]">
                <RailItem label="Deal Stage" active />
                <RailItem label="TOM" />
                <RailItem label="Valuation" />
                <RailItem label="Teaser" />
              </ul>
            </aside>
            <div className="space-y-4 p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-sm bg-navy px-2 py-0.5 text-[10px] font-medium tracking-wide text-white">
                  Active
                </span>
                <span className="text-[11px] tracking-[0.14em] text-[#475467]">DEAL STATUS</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <MiniStat label="Current Stage" value="02 / 13" />
                <MiniStat label="Valuation Status" value="LEVEL 0 / 1" />
              </div>
              <div>
                <p className="text-[11px] tracking-[0.16em] text-[#475467]">NEXT ACTION</p>
                <p className="mt-1.5 text-[15px] font-medium leading-6 text-[#101828]">
                  Teaser Review
                </p>
                <p className="mt-1 text-[12px] text-navy">Approval Required</p>
              </div>
              <div className="border-t border-[#E4E7EC] pt-3">
                <p className="text-[11px] tracking-[0.16em] text-[#475467]">TOM RECOMMENDATION</p>
                <p className="mt-1.5 text-[13px] font-medium text-[#101828]">승인 게이트로 이동</p>
                <p className="mt-1 text-[12px] text-[#475467]">Last Activity · Updated 10 min ago</p>
              </div>
            </div>
          </div>
        </AppWindow>
      </div>
      <div className="absolute right-3 -bottom-1 w-[min(100%,19rem)] rounded-lg border border-[#E4E7EC] bg-white px-4 py-3.5 shadow-[0_18px_40px_-18px_rgba(0,33,71,0.42)] sm:right-2">
        <p className="text-[11px] tracking-[0.14em] text-navy">Human Approval</p>
        <p className="mt-1 text-[13px] font-medium leading-5 text-[#101828]">티저 게시 전 승인이 필요합니다.</p>
        <p className="mt-1 text-[12px] leading-5 text-[#475467]">제안은 AI, 결정은 VERICOM.</p>
      </div>
    </div>
  );
}

function RailItem({
  label,
  active = false,
}: {
  label: string;
  active?: boolean;
}) {
  return (
    <li
      className={`rounded-md px-2.5 py-2 ${
        active ? "bg-white font-medium text-[#101828] shadow-sm" : ""
      }`}
    >
      {label}
    </li>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[#E4E7EC] bg-[#F7F8FA] px-3 py-2.5">
      <p className="text-[10px] tracking-wide text-[#475467]">{label}</p>
      <p className="mt-1 text-[13px] font-medium text-[#101828]">{value}</p>
    </div>
  );
}
