const steps = [
  { title: "AI", copy: "분석하고 제안하고 초안을 만듭니다.", items: ["Analyze", "Recommend", "Draft"] },
  {
    title: "Human Approval",
    copy: "사람이 검토하고 수정한 뒤 승인합니다.",
    items: ["Review", "Edit", "Approve"],
  },
  {
    title: "VERICOM Record",
    copy: "권한, 감사, 이력을 남깁니다.",
    items: ["Permission", "Audit", "History"],
  },
] as const;

export function HomeApproval() {
  return (
    <section className="bg-[#F7F8FA]">
      <div className="mx-auto w-full max-w-[1200px] px-6 py-20 sm:px-8 sm:py-24 lg:px-10 lg:py-[7.5rem]">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-navy">Governance</p>
        <h2 className="mt-4 max-w-2xl text-[1.75rem] font-semibold leading-tight tracking-tight text-[#101828] sm:text-[2.25rem]">
          AI는 제안하고, 중요한 결정은 사람이 승인합니다.
        </h2>
        <ol className="mt-14 grid gap-10 md:grid-cols-3 md:gap-10">
          {steps.map((step, index) => (
            <li key={step.title}>
              <div className="flex items-center gap-3">
                <p className="font-mono text-[12px] text-navy">
                  {String(index + 1).padStart(2, "0")}
                </p>
                {index < steps.length - 1 ? (
                  <>
                    <span aria-hidden="true" className="hidden h-px flex-1 bg-[#D0D5DD] md:block" />
                    <span aria-hidden="true" className="hidden font-mono text-sm text-navy md:block">
                      →
                    </span>
                  </>
                ) : null}
              </div>
              <h3 className="mt-4 text-lg font-semibold text-[#101828]">{step.title}</h3>
              <p className="mt-2 text-[14px] leading-6 text-[#475467]">{step.copy}</p>
              <ul className="mt-4 space-y-1.5 text-[13px] tracking-wide text-[#475467]">
                {step.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              {index < steps.length - 1 ? (
                <p aria-hidden="true" className="mt-6 font-mono text-sm text-navy md:hidden">
                  ↓
                </p>
              ) : null}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
