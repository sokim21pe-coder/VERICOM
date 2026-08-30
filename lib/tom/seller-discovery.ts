import type { TomMemoryItem } from "@/types/tom";
import {
  extractDiscoveryFromMessage,
  reverseQuestionAnswer,
} from "@/lib/tom/extract-discovery";
import {
  getNextBestQuestion,
  lastAskedField,
  questionForField,
  shouldAskField,
  type DiscoveryContextFacts,
} from "@/lib/tom/question-policy";
import type { DiscoveryCapture } from "@/lib/tom/extract-discovery";
import type { DiscoveryFieldId, DiscoveryProfile } from "@/lib/tom/discovery-fields";
import type { TomQuestion } from "@/lib/tom/question-policy";

export type DiscoveryTurn = {
  captures: DiscoveryCapture[];
  declinedLast: boolean;
  reverseQuestion: boolean;
  nextQuestion: TomQuestion | null;
  reply: string;
  askedField: DiscoveryFieldId | null;
};

export type SellerDiscoveryTurn = DiscoveryTurn;

export function runDiscoveryTurn(input: {
  text: string;
  memories: TomMemoryItem[];
  context: DiscoveryContextFacts;
  profile: DiscoveryProfile;
}): DiscoveryTurn {
  const lastQuestion = lastAskedField(input.memories);
  const extracted = extractDiscoveryFromMessage({
    text: input.text,
    lastQuestion,
    profile: input.profile,
  });

  const projected: TomMemoryItem[] = [
    ...input.memories.filter(
      (item) => !extracted.captures.some((capture) => capture.field === item.key),
    ),
    ...extracted.captures.map((capture) => ({
      key: capture.field,
      value: capture.value,
      informationState: capture.informationState,
      source: "user_message:USER_CLAIM",
      confidence: capture.skipped ? 0 : 1,
    })),
  ];

  const suppress =
    extracted.declinedLast && lastQuestion ? lastQuestion : null;
  let nextQuestion = getNextBestQuestion({
    profile: input.profile,
    memories: projected,
    context: input.context,
    suppressField: suppress,
  });
  if (
    extracted.reverseQuestion &&
    lastQuestion &&
    !extracted.declinedLast &&
    shouldAskField(lastQuestion, projected, input.context, input.profile)
  ) {
    nextQuestion = questionForField(lastQuestion) ?? nextQuestion;
  }

  const parts: string[] = [];
  if (extracted.reverseQuestion) {
    parts.push(reverseQuestionAnswer(lastQuestion));
  }

  if (nextQuestion) {
    if (
      extracted.reverseQuestion &&
      lastQuestion &&
      nextQuestion.field === lastQuestion &&
      !extracted.declinedLast
    ) {
      parts.push(nextQuestion.question);
    } else if (!extracted.reverseQuestion || nextQuestion.field !== lastQuestion) {
      parts.push(nextQuestion.question);
    } else if (extracted.reverseQuestion && !extracted.declinedLast) {
      parts.push(nextQuestion.question);
    }
  } else if (!extracted.reverseQuestion) {
    parts.push(
      "알려 주신 내용을 저장했습니다. 더 말씀해 주실 내용이 있으면 적어 주세요.",
    );
  }

  return {
    captures: extracted.captures,
    declinedLast: extracted.declinedLast,
    reverseQuestion: extracted.reverseQuestion,
    nextQuestion,
    reply: parts.join("\n"),
    askedField: nextQuestion?.field ?? null,
  };
}

export function runSellerDiscoveryTurn(input: {
  text: string;
  memories: TomMemoryItem[];
  context: DiscoveryContextFacts;
}): SellerDiscoveryTurn {
  return runDiscoveryTurn({ ...input, profile: "SELLER" });
}

export function runBuyerDiscoveryTurn(input: {
  text: string;
  memories: TomMemoryItem[];
  context: DiscoveryContextFacts;
}): DiscoveryTurn {
  return runDiscoveryTurn({ ...input, profile: "BUYER" });
}
