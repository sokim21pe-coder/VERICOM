import { PlatformRole } from "@/types/enums";
import type { TomMemoryItem } from "@/types/tom";
import {
  DISCOVERY_LAST_QUESTION_KEY,
  askableFields,
  fieldById,
  fieldProfile,
  isKnownMemoryState,
  isSkippedMemoryState,
  requiredFields,
  type DiscoveryFieldDef,
  type DiscoveryFieldId,
  type DiscoveryProfile,
} from "@/lib/tom/discovery-fields";

export type { DiscoveryProfile };

export type DiscoveryContextFacts = {
  companyName: string | null;
  industry: string | null;
  platformRole: PlatformRole | null;
  dealId: string | null;
  dealRole: string | null;
  dealStage: string | null;
  conversationIntent?: "sell" | "buy" | null;
  profile?: DiscoveryProfile | null;
};

export type TomQuestion = {
  field: DiscoveryFieldId;
  question: string;
  reason: string;
  priority: number;
};

export type TomQuestionState = {
  knownFields: DiscoveryFieldId[];
  unknownFields: DiscoveryFieldId[];
  skippedFields: DiscoveryFieldId[];
  lastQuestion: DiscoveryFieldId | null;
  nextQuestion: TomQuestion | null;
  completion: { knownRequired: number; requiredTotal: number };
};

function memoryMap(memories: TomMemoryItem[]): Map<string, TomMemoryItem> {
  return new Map(memories.map((item) => [item.key, item]));
}

export function lastAskedField(memories: TomMemoryItem[]): DiscoveryFieldId | null {
  const row = memories.find((item) => item.key === DISCOVERY_LAST_QUESTION_KEY);
  if (!row?.value) return null;
  return fieldById(row.value)?.id ?? null;
}

export function isSellerDiscoveryRole(
  platformRole: PlatformRole | null | undefined,
): boolean {
  return platformRole === PlatformRole.SELLER_USER;
}

export function isBuyerDiscoveryRole(
  platformRole: PlatformRole | null | undefined,
): boolean {
  return platformRole === PlatformRole.BUYER_USER;
}

export function discoveryProfileFrom(
  platformRole: PlatformRole | null | undefined,
  conversationIntent?: "sell" | "buy" | null,
): DiscoveryProfile | null {
  if (platformRole === PlatformRole.SELLER_USER) {
    if (conversationIntent === "buy") return null;
    return "SELLER";
  }
  if (platformRole === PlatformRole.BUYER_USER) {
    if (conversationIntent === "sell") return null;
    return "BUYER";
  }
  return null;
}

export function resolveDiscoveryProfile(
  context: DiscoveryContextFacts,
  explicit?: DiscoveryProfile | null,
): DiscoveryProfile | null {
  if (explicit) return explicit;
  if (context.profile) return context.profile;
  return discoveryProfileFrom(context.platformRole, context.conversationIntent);
}

function knownFromContext(
  context: DiscoveryContextFacts,
): Partial<Record<DiscoveryFieldId, string>> {
  const known: Partial<Record<DiscoveryFieldId, string>> = {};
  const name = context.companyName?.trim();
  if (name) known.company_name = name;
  const industry = context.industry?.trim();
  if (industry) known.industry = industry;
  return known;
}

export function classifyDiscoveryFields(input: {
  memories: TomMemoryItem[];
  context: DiscoveryContextFacts;
  profile?: DiscoveryProfile | null;
}): {
  known: Set<DiscoveryFieldId>;
  skipped: Set<DiscoveryFieldId>;
} {
  const profile = resolveDiscoveryProfile(input.context, input.profile);
  const byKey = memoryMap(input.memories);
  const known = new Set<DiscoveryFieldId>();
  const skipped = new Set<DiscoveryFieldId>();
  if (!profile) return { known, skipped };

  for (const [field, value] of Object.entries(knownFromContext(input.context)) as [
    DiscoveryFieldId,
    string,
  ][]) {
    if (value) known.add(field);
  }

  for (const id of ["company_name", "industry"] as DiscoveryFieldId[]) {
    const row = byKey.get(id);
    if (!row) continue;
    if (isSkippedMemoryState(row.informationState, row.value)) skipped.add(id);
    else if (isKnownMemoryState(row.informationState) && row.value?.trim()) {
      known.add(id);
    }
  }

  for (const def of askableFields(profile)) {
    const row = byKey.get(def.id);
    if (!row) continue;
    if (isSkippedMemoryState(row.informationState, row.value)) {
      skipped.add(def.id);
      continue;
    }
    if (isKnownMemoryState(row.informationState) && row.value?.trim()) {
      known.add(def.id);
    }
  }

  if (
    profile === "SELLER" &&
    known.has("reason_for_sale") &&
    !skipped.has("seller_objective")
  ) {
    known.add("seller_objective");
  }

  if (
    profile === "SELLER" &&
    known.has("cash") &&
    known.has("debt") &&
    !skipped.has("net_debt")
  ) {
    known.add("net_debt");
  }

  return { known, skipped };
}

export function discoveryProgress(input: {
  memories: TomMemoryItem[];
  context: DiscoveryContextFacts;
  profile?: DiscoveryProfile | null;
}): { knownRequired: number; requiredTotal: number } {
  const profile = resolveDiscoveryProfile(input.context, input.profile);
  const required = profile ? requiredFields(profile) : [];
  const { known, skipped } = classifyDiscoveryFields(input);
  const requiredTotal = required.length;
  const knownRequired = required.filter(
    (field) => known.has(field.id) || skipped.has(field.id),
  ).length;
  return { knownRequired, requiredTotal };
}

export function getNextBestQuestion(input: {
  memories: TomMemoryItem[];
  context: DiscoveryContextFacts;
  profile?: DiscoveryProfile | null;
  suppressField?: DiscoveryFieldId | null;
}): TomQuestion | null {
  const profile = resolveDiscoveryProfile(input.context, input.profile);
  if (!profile) return null;

  const { known, skipped } = classifyDiscoveryFields(input);
  const last = lastAskedField(input.memories);

  for (const def of askableFields(profile)) {
    if (known.has(def.id) || skipped.has(def.id)) continue;
    if (input.suppressField && def.id === input.suppressField) continue;
    return toQuestion(def);
  }

  if (last && !known.has(last) && !skipped.has(last) && last !== input.suppressField) {
    const def = fieldById(last);
    if (def && def.requirement !== "context" && fieldProfile(def) === profile) {
      return toQuestion(def);
    }
  }

  return null;
}

export function questionForField(id: DiscoveryFieldId | null): TomQuestion | null {
  if (!id) return null;
  const def = fieldById(id);
  if (!def || def.requirement === "context") return null;
  return toQuestion(def);
}

function toQuestion(def: DiscoveryFieldDef): TomQuestion {
  return {
    field: def.id,
    question: def.question,
    reason: def.reason,
    priority: def.priority,
  };
}

export function shouldAskField(
  field: DiscoveryFieldId,
  memories: TomMemoryItem[],
  context: DiscoveryContextFacts,
  profile?: DiscoveryProfile | null,
): boolean {
  const { known, skipped } = classifyDiscoveryFields({ memories, context, profile });
  return !known.has(field) && !skipped.has(field);
}

export function buildQuestionState(input: {
  memories: TomMemoryItem[];
  context: DiscoveryContextFacts;
  nextQuestion: TomQuestion | null;
  profile?: DiscoveryProfile | null;
}): TomQuestionState {
  const profile = resolveDiscoveryProfile(input.context, input.profile);
  const { known, skipped } = classifyDiscoveryFields(input);
  const unknown = profile
    ? askableFields(profile)
        .filter((field) => !known.has(field.id) && !skipped.has(field.id))
        .map((field) => field.id)
    : [];
  return {
    knownFields: [...known],
    unknownFields: unknown,
    skippedFields: [...skipped],
    lastQuestion: lastAskedField(input.memories),
    nextQuestion: input.nextQuestion,
    completion: discoveryProgress(input),
  };
}
