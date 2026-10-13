import { AppWindow } from "@/components/home/home-ui";

export function HomeProductPreview() {
  return (
    <div className="relative mx-auto w-full max-w-xl pb-14 sm:max-w-2xl lg:max-w-none lg:pb-12">
      <div
        aria-hidden="true"
        className="absolute inset-x-6 top-6 bottom-2 rounded-xl border border-[#E4E7EC] bg-[#F7F8FA] sm:inset-x-8"
      />
      <div className="relative">
        <AppWindow title="DEAL WORKSPACE" meta="Seller · Teaser">
          <div className="grid min-h-[300px] sm:min-h-[360px] sm:grid-cols-[12rem_minmax(0,1fr)]">
            <aside className="border-b border-[#E4E7EC] bg-[#F7F8FA] px-3 py-5 sm:border-b-0 sm:border-r">
              <ul className="space-y-1 text-[13px] leading-5 text-[#475467]">
                <RailItem label="Deal Stage" active />
                <RailItem label="TOM(AI)" />
                <RailItem label="Valuation" />
                <RailItem label="Teaser" />
                <RailItem label="Documents" planned />
                <RailItem label="Buyer Matching" planned />
              </ul>
            </aside>
            <div className="space-y-5 p-6">
              <p className="text-[11px] tracking-[0.16em] text-[#475467]">NEXT ACTION</p>
              <p className="text-[16px] font-medium leading-6 text-[#101828]">
                티저 초안을 검토하고 승인을 요청합니다.
              </p>
              <p className="max-w-sm text-[13px] leading-6 text-[#475467]">
                Deal Stage는 티저 작성입니다. TOM은 초안을 제안하고, 게시 전 사람 승인이
                필요합니다.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <MiniStat label="Deal Stage" value="02 티저" />
                <MiniStat label="Valuation" value="LEVEL 0 / 1" />
              </div>
            </div>
          </div>
        </AppWindow>
      </div>
      <div className="absolute right-3 -bottom-1 w-[min(100%,19rem)] rounded-lg border border-[#E4E7EC] bg-white px-4 py-3.5 shadow-[0_18px_40px_-18px_rgba(0,33,71,0.42)] sm:right-2">
        <p className="text-[11px] tracking-[0.14em] text-navy">TOM · Next Action</p>
        <p className="mt-1 text-[13px] font-medium leading-5 text-[#101828]">승인 게이트로 이동</p>
        <p className="mt-1 text-[12px] leading-5 text-[#475467]">AI recommends. You approve.</p>
      </div>
    </div>
  );
}

function RailItem({
  label,
  active = false,
  planned = false,
}: {
  label: string;
  active?: boolean;
  planned?: boolean;
}) {
  return (
    <li
      className={`flex items-center justify-between gap-2 rounded-md px-2.5 py-2 ${
        active ? "bg-white font-medium text-[#101828] shadow-sm" : ""
      }`}
    >
      <span>{label}</span>
      {planned ? <span className="shrink-0 text-[10px] text-[#475467]">준비 중</span> : null}
    </li>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[#E4E7EC] bg-[#F7F8FA] px-3 py-3">
      <p className="text-[10px] tracking-wide text-[#475467]">{label}</p>
      <p className="mt-1 text-[13px] font-medium text-[#101828]">{value}</p>
    </div>
  );
}
