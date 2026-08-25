const TOM_LOOP = [
  "이해",
  "조회",
  "분석",
  "권장",
  "초안",
  "승인 요청",
  "실행",
  "기록",
];

type TomNextBestActionCardProps = {
  currentLabel: string;
  situation: string;
  completed: string;
  issue: string;
  nextAction: string;
  requiredApproval: string;
  requiredDocument: string;
  expectedNext: string;
};

export function TomNextBestActionCard({
  currentLabel,
  situation,
  completed,
  issue,
  nextAction,
  requiredApproval,
  requiredDocument,
  expectedNext,
}: TomNextBestActionCardProps) {
  return (
    <section className="rounded-xl border border-line bg-white p-5 sm:p-6">
      <p className="text-[11px] font-medium tracking-[0.18em] text-navy">TOM</p>
      <h2 className="mt-2 text-lg font-semibold text-foreground">
        다음 권장 행동
      </h2>
      <p className="mt-1 text-sm text-muted">현재 단계: {currentLabel}</p>

      <ol className="mt-4 flex flex-wrap gap-1.5 text-[11px] text-muted">
        {TOM_LOOP.map((step, index) => (
          <li key={step} className="rounded-md border border-line px-2 py-1">
            {index + 1}. {step}
          </li>
        ))}
      </ol>
      <p className="mt-2 text-xs text-muted">
        TODO: TOM Tool·오케스트레이션은 Phase 5에서 연결합니다. AI는 승인·서명·종결을
        확정하지 않습니다.
      </p>

      <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs text-muted">현재 상황</dt>
          <dd className="mt-1 leading-6 text-foreground">{situation}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">완료된 업무</dt>
          <dd className="mt-1 leading-6 text-foreground">{completed}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">현재 문제</dt>
          <dd className="mt-1 leading-6 text-foreground">{issue}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">다음 권장 행동</dt>
          <dd className="mt-1 leading-6 text-foreground">{nextAction}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">필요한 승인</dt>
          <dd className="mt-1 leading-6 text-foreground">{requiredApproval}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">필요한 문서</dt>
          <dd className="mt-1 leading-6 text-foreground">{requiredDocument}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs text-muted">예상 다음 단계</dt>
          <dd className="mt-1 leading-6 text-foreground">{expectedNext}</dd>
        </div>
      </dl>
    </section>
  );
}
