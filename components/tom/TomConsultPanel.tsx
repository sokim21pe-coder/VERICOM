"use client";

import { FormEvent, useMemo, useState } from "react";
import { getSellerLevel0Valuation, sendTomMessage } from "@/lib/tom/actions";
import type { TomIntent } from "@/lib/tom/paths";
import type { TomMemoryItem, TomMessage } from "@/types/tom";
import { PlatformRole } from "@/types/enums";
import {
  classifyDiscoveryFields,
  discoveryProgress,
  getNextBestQuestion,
  type DiscoveryContextFacts,
} from "@/lib/tom/question-policy";
import { FieldRows } from "@/components/workspace/WorkspaceHomeSections";
import {
  BUYER_HOME_FIELDS,
  SELLER_HOME_FIELDS,
  consultPurpose,
  consultStillNeeded,
  platformRoleLabel,
  recentSavedMemories,
  valuationVisibility,
  visibleDiscoveryFields,
} from "@/lib/workspace/visibility";
import { normalizeFinancialInputs } from "@/lib/valuation/normalize-financial-inputs";
import type { ValuationCalculationStatus } from "@/types/valuation";

const sellChoices = [
  "회사를 매각하고 싶습니다.",
  "기업을 팔고 싶습니다.",
  "내 회사 가치가 궁금하다",
  "인수자를 찾고 싶다",
  "티저를 만들고 싶다",
];

const buyChoices = [
  "기업을 인수하고 싶습니다.",
  "아직 무엇부터 해야 할지 모르겠어요",
];

export function TomConsultPanel({
  intent,
  conversationId,
  initialMessages,
  initialMemories,
  initialValuationCopy = null,
  initialValuationStatus = null,
  companyName = null,
  industry = null,
  platformRole = null,
  dealId = null,
  dealRole = null,
}: {
  intent: TomIntent;
  conversationId: string;
  initialMessages: TomMessage[];
  initialMemories: TomMemoryItem[];
  initialValuationCopy?: string | null;
  initialValuationStatus?: ValuationCalculationStatus | null;
  companyName?: string | null;
  industry?: string | null;
  platformRole?: PlatformRole | null;
  dealId?: string | null;
  dealRole?: string | null;
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [memories, setMemories] = useState(initialMemories);
  const [valuationCopy, setValuationCopy] = useState(initialValuationCopy);
  const [valuationStatus, setValuationStatus] = useState(initialValuationStatus);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const profile = intent === "buy" ? "BUYER" : "SELLER";
  const facts: DiscoveryContextFacts = {
    companyName,
    industry,
    platformRole,
    dealId,
    dealRole,
    dealStage: null,
    conversationIntent: intent,
    profile,
  };

  const started = messages.some((item) => item.authorRole === "user");
  const choices = intent === "buy" ? buyChoices : sellChoices;
  const next = getNextBestQuestion({ memories, context: facts, profile });
  const progress = discoveryProgress({ memories, context: facts, profile });
  const collected = recentSavedMemories(memories, profile, 5);
  const stillNeeded = consultStillNeeded(memories, facts, profile);
  const highlightFields = visibleDiscoveryFields({
    memories,
    context: facts,
    fields: intent === "buy" ? BUYER_HOME_FIELDS : SELLER_HOME_FIELDS,
    profile,
  });
  const { known } = classifyDiscoveryFields({ memories, context: facts, profile });

  const sellerValuation = useMemo(() => {
    if (intent !== "sell") return null;
    const financials = normalizeFinancialInputs({
      memories,
      conversationId,
      sellerCompanyId: null,
    });
    return valuationVisibility({
      hasConversation: true,
      financials,
      status: valuationStatus,
      copy: valuationCopy,
    });
  }, [conversationId, intent, memories, valuationCopy, valuationStatus]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || pending) return;
    setError(null);
    setPending(true);
    const result = await sendTomMessage(conversationId, trimmed);
    setPending(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setMessages(result.messages);
    setMemories(result.memories);
    setInput("");
    if (intent === "sell") {
      const valuation = await getSellerLevel0Valuation(conversationId);
      if (valuation.ok) {
        setValuationCopy(valuation.copy);
        setValuationStatus(valuation.result?.status ?? null);
      }
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void send(input);
  }

  return (
    <section>
      <p className="text-[11px] font-medium tracking-[0.2em] text-navy">TOM</p>
      <h1 className="mt-3 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
        {intent === "buy" ? "기업 인수 상담" : "기업 매각 상담"}
      </h1>
      <p className="mt-2.5 text-sm leading-relaxed text-muted">
        {consultPurpose(intent)}
      </p>
      <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs text-muted">역할</dt>
          <dd className="mt-1 text-foreground">{platformRoleLabel(platformRole)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">진행</dt>
          <dd className="mt-1 text-foreground">
            필수 {progress.knownRequired}/{progress.requiredTotal}
            {known.size ? ` · 저장 ${known.size}항목` : ""}
          </dd>
        </div>
      </dl>

      <div className="mt-8 border-t border-line pt-6">
        <p className="text-xs text-muted">정리된 내용</p>
        {highlightFields.some((field) => field.presence === "입력") ? (
          <FieldRows fields={highlightFields} />
        ) : (
          <p className="mt-2 text-sm text-muted">아직 저장된 핵심 항목이 없습니다.</p>
        )}
        {stillNeeded.length ? (
          <p className="mt-4 text-sm leading-6 text-foreground">
            아직 필요한 항목: {stillNeeded.join(" · ")}
          </p>
        ) : (
          <p className="mt-4 text-sm text-foreground">필수 항목은 정리되었습니다.</p>
        )}
        {next ? (
          <p className="mt-2 text-sm leading-6 text-foreground">
            다음 질문: {next.question}
          </p>
        ) : null}
        {collected.length ? (
          <div className="mt-6">
            <p className="text-xs text-muted">최근 저장된 기억</p>
            <FieldRows fields={collected} />
          </div>
        ) : null}
        {sellerValuation ? (
          <p className="mt-4 text-sm leading-6 text-foreground">
            가치평가: {sellerValuation.statusLabel}. {sellerValuation.copy}
          </p>
        ) : null}
      </div>

      <div className="mt-8 max-h-[28rem] space-y-4 overflow-y-auto border-t border-line pt-6 text-sm leading-relaxed">
        {messages.map((item) => (
          <p
            key={item.id}
            className={
              item.authorRole === "tom"
                ? "whitespace-pre-wrap text-foreground"
                : "text-right text-navy"
            }
          >
            {item.body}
          </p>
        ))}
      </div>

      {!started ? (
        <ul className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {choices.map((choice) => (
            <li key={choice}>
              <button
                type="button"
                disabled={pending}
                className="w-full rounded-md border border-line bg-white px-3.5 py-2.5 text-left text-[13px] leading-snug text-foreground hover:border-navy disabled:opacity-60 sm:w-auto"
                onClick={() => void send(choice)}
              >
                {choice}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <form
        onSubmit={onSubmit}
        className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:items-stretch"
      >
        <label className="sr-only" htmlFor="tom-input">
          TOM에게 보낼 메시지
        </label>
        <input
          id="tom-input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="메시지를 입력하세요"
          className="min-h-11 min-w-0 flex-1 rounded-md border border-line bg-white px-3.5 text-sm text-foreground outline-none placeholder:text-muted focus:border-navy"
        />
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-11 shrink-0 items-center justify-center rounded-md bg-navy px-5 text-sm font-medium text-white hover:bg-navy-hover disabled:opacity-60"
        >
          {pending ? "저장 중…" : "보내기"}
        </button>
      </form>
      {error ? <p className="mt-3 text-sm text-muted">{error}</p> : null}
    </section>
  );
}
