"use client";

import { FormEvent, useState } from "react";
import { sendTomMessage } from "@/lib/tom/actions";
import {
  INTENT_MEMORY_KEY,
  intentRouterLabel,
} from "@/lib/tom/intent-router";
import { informationStateLabel } from "@/lib/tom/extract-intent";
import type { TomIntent } from "@/lib/tom/paths";
import type { TomIntentRouter, TomMemoryItem, TomMessage } from "@/types/tom";
import { InformationState } from "@/types/enums";

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

function intentFromMemories(memories: TomMemoryItem[]): {
  router: TomIntentRouter;
  state: InformationState;
} | null {
  const row = memories.find((item) => item.key === INTENT_MEMORY_KEY);
  if (!row?.value) return null;
  const router = row.value as TomIntentRouter;
  if (!(router in intentRouterLabel)) return null;
  const state =
    row.informationState === InformationState.CONFIRMED
      ? InformationState.CONFIRMED
      : row.informationState === InformationState.ESTIMATED
        ? InformationState.ESTIMATED
        : InformationState.UNKNOWN;
  return { router, state };
}

export function TomConsultPanel({
  intent,
  conversationId,
  initialMessages,
  initialMemories,
}: {
  intent: TomIntent;
  conversationId: string;
  initialMessages: TomMessage[];
  initialMemories: TomMemoryItem[];
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [memories, setMemories] = useState(initialMemories);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const started = messages.some((item) => item.authorRole === "user");
  const choices = intent === "buy" ? buyChoices : sellChoices;
  const extracted = intentFromMemories(memories);

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
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void send(input);
  }

  return (
    <section className="rounded-xl border border-line bg-[#FFFFFF] p-5 sm:p-7 lg:p-8">
      <p className="text-[11px] font-medium tracking-[0.2em] text-navy">TOM</p>
      <h1 className="mt-3 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
        {intent === "buy" ? "기업 인수 상담" : "기업 매각 상담"}
      </h1>
      <p className="mt-2.5 text-sm leading-relaxed text-muted">
        이 대화는 로그인 계정에 저장됩니다. 입력은 규칙 기반으로 상담 방향만
        분류합니다. 매각·인수의 확정 의사가 아닙니다.
      </p>
      {extracted ? (
        <p className="mt-3 rounded-md border border-line bg-white px-3 py-2 text-sm text-foreground">
          상담 방향: {intentRouterLabel[extracted.router]} (
          {informationStateLabel[extracted.state]})
          <span className="mt-1 block text-xs leading-5 text-muted">
            대화에서 고른 방향입니다. 확정 거래 의사가 아닙니다.
          </span>
        </p>
      ) : null}

      <div className="mt-6 max-h-[28rem] space-y-3 overflow-y-auto text-sm leading-relaxed">
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
