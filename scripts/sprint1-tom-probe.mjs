import fs from "fs";
import { createClient } from "@supabase/supabase-js";

function loadEnv() {
  const env = {};
  for (const line of fs.readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const i = line.indexOf("=");
    env[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^['"]|['"]$/g, "");
  }
  return env;
}

const env = loadEnv();
const password = process.env.VERICOM_TEST_SEED_PASSWORD;
if (!password) throw new Error("set VERICOM_TEST_SEED_PASSWORD");

async function asUser(email) {
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return { supabase, error: error?.message ?? null };
}

const seller = await asUser("test.seller.sprint0@vericom.test");
if (seller.error) {
  console.log(JSON.stringify({ sellerLogin: seller.error }));
  process.exit(1);
}

const conv = await seller.supabase
  .from("tom_conversations")
  .select("id, user_id, company_id, deal_id, intent, platform_role")
  .eq("intent", "sell")
  .eq("status", "active")
  .order("created_at", { ascending: false })
  .limit(1)
  .maybeSingle();

const mem = await seller.supabase
  .from("tom_memory_items")
  .select("memory_key, memory_value, information_state, source, confidence, user_id, company_id, deal_id")
  .eq("conversation_id", conv.data?.id ?? "00000000-0000-4000-8000-000000000000")
  .eq("memory_key", "intent_router");

const msgs = await seller.supabase
  .from("tom_messages")
  .select("author_role, body")
  .eq("conversation_id", conv.data?.id ?? "00000000-0000-4000-8000-000000000000")
  .order("created_at", { ascending: false })
  .limit(4);

const audits = await seller.supabase
  .from("audit_logs")
  .select("action, entity_type, created_at")
  .in("action", [
    "TOM_CONVERSATION_STARTED",
    "TOM_MESSAGE_CREATED",
    "TOM_INTENT_EXTRACTED",
    "TOM_MEMORY_UPDATED",
  ])
  .order("created_at", { ascending: false })
  .limit(20);

await seller.supabase.auth.signOut();

const buyerB = await asUser("test.buyerb.sprint0@vericom.test");
const otherConv = buyerB.error
  ? { error: buyerB.error }
  : await buyerB.supabase
      .from("tom_conversations")
      .select("id, intent")
      .eq("id", conv.data?.id ?? "00000000-0000-4000-8000-000000000000")
      .maybeSingle();
const otherMem = buyerB.error
  ? { error: buyerB.error }
  : await buyerB.supabase
      .from("tom_memory_items")
      .select("id")
      .eq("conversation_id", conv.data?.id ?? "00000000-0000-4000-8000-000000000000");
const otherInsert = buyerB.error
  ? { error: buyerB.error }
  : await buyerB.supabase.from("tom_messages").insert({
      conversation_id: conv.data?.id,
      author_role: "user",
      body: "spoof",
    });
if (!buyerB.error) await buyerB.supabase.auth.signOut();

console.log(
  JSON.stringify(
    {
      conversation: conv.data,
      conversationError: conv.error?.message ?? null,
      memory: mem.data,
      memoryError: mem.error?.message ?? null,
      recentMessages: (msgs.data ?? []).map((row) => ({
        author: row.author_role,
        hasSellPhrase: String(row.body).includes("매각"),
      })),
      audits: (audits.data ?? []).map((row) => row.action),
      buyerBSeesConversation: otherConv.data ?? null,
      buyerBSeesConversationError: otherConv.error?.message ?? null,
      buyerBMemoryCount: otherMem.data?.length ?? 0,
      buyerBInsertError: otherInsert.error?.message ?? otherInsert.error ?? null,
    },
    null,
    2,
  ),
);
