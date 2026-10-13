const steps = [
  { title: "AI", items: ["Analyze", "Recommend", "Draft"] },
  { title: "Human Approval", items: ["Review", "Edit", "Approve"] },
  { title: "VERICOM Record", items: ["Permission", "Audit", "History"] },
] as const;

export function HomeApproval() {
  return (
    <section className="border-b border-[#E4E7EC] bg-[#F7F8FA]">
      <div className="mx-auto w-full max-w-[1200px] px-6 py-20 sm:px-8 sm:py-24 lg:px-10 lg:py-[7.5rem]">
        <h2 className="max-w-2xl text-[1.75rem] font-semibold leading-tight tracking-tight text-[#101828] sm:text-[2.25rem]">
          AI는 제안하고, 중요한 결정은 사람이 승인합니다.
        </h2>
        <div className="mt-12 grid gap-8 md:grid-cols-3 md:gap-10">
          {steps.map((step, index) => (
            <div key={step.title} className="border-t border-[#E4E7EC] pt-5">
              <p className="text-[11px] font-mono text-navy">
                {String(index + 1).padStart(2, "0")}
                {index < steps.length - 1 ? " →" : ""}
              </p>
              <h3 className="mt-3 text-lg font-semibold text-[#101828]">{step.title}</h3>
              <ul className="mt-4 space-y-1.5 text-[15px] text-[#475467]">
                {step.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
