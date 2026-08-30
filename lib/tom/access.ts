import type { CurrentContext } from "@/types/context";
import type { TomConversation } from "@/types/tom";

export function canReadTomConversation(
  conversation: TomConversation,
  context: CurrentContext,
): boolean {
  if (conversation.companyId && context.company?.id) {
    return conversation.companyId === context.company.id;
  }
  return Boolean(context.company?.id);
}

export function canWriteTomConversation(
  ownerUserId: string,
  context: CurrentContext,
): boolean {
  return ownerUserId === context.user.id;
}
