"use client";

import { FormEvent, useState } from "react";
import { sendTomMessage } from "@/lib/tom/actions";
import type { TomIntent } from "@/lib/tom/paths";
import type { TomMessage } from "@/types/tom";

const sellChoices = [
  "우리 회사의 기업가치가 궁금해요",
  "회사를 매각하고 싶어요",
  "투자유치를 검토하고 있어요",
  "아직 무엇부터 해야 할지 모르겠어요",
];

const buyChoices = [
  "인수할 회사를 찾고 있어요",
  "아직 무엇부터 해야 할지 모르겠어요",
];

export function TomConsultPanel({
  intent,
  conversationId,
  initialMessages,
}: {
  intent: TomIntent;
  conversationId: string;
  initialMessages: TomMessage[];
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const started = messages.some((item) => item.authorRole === "user");
  const choices = intent === "buy" ? buyChoices : sellChoices;

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
        이 대화는 계정에 저장됩니다. TOM 모델 연결은 후속 단계입니다.
      </p>

      <div className="mt-6 max-h-72 space-y-3 overflow-y-auto text-sm leading-relaxed">
        {messages.map((item) => (
          <p
            key={item.id}
            className={
              item.authorRole === "tom" ? "text-foreground" : "text-right text-navy"
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
