import fs from "fs";
import { createClient } from "@supabase/supabase-js";
import {
  formatNormalizedCriteriaSummary,
  normalizeAcquisitionCriteria,
} from "@/lib/tom/normalize-acquisition-criteria";
import type { TomMemoryItem } from "@/types/tom";

function loadEnv() {
  const env: Record<string, string> = {};
  for (const line of fs.readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const i = line.indexOf("=");
    env[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^['"]|['"]$/g, "");
  }
  return env;
}

function mark(ok: boolean, label: string) {
  console.log(`${ok ? "PASS" : "FAIL"} ${label}`);
  if (!ok) process.exitCode = 1;
}

async function main() {
  const env = loadEnv();
  const password = process.env.VERICOM_TEST_SEED_PASSWORD || env.VERICOM_TEST_SEED_PASSWORD;
  if (!password) {
    console.log("FAIL PASSWORD_MISSING");
    process.exit(1);
  }
  const conversationId = process.argv[2];
  if (!conversationId) {
    console.log("FAIL CONV_ID_MISSING");
    process.exit(1);
  }

  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const login = await supabase.auth.signInWithPassword({
    email: "test.buyera.sprint0@vericom.test",
    password,
  });
  mark(!login.error, "normalize_api_login");

  const conv = await supabase
    .from("tom_conversations")
    .select("id, company_id, intent, user_id")
    .eq("id", conversationId)
    .maybeSingle();
  mark(conv.data?.intent === "buy", "normalize_conversation_buy");
  mark(Boolean(conv.data?.company_id), "normalize_conversation_company");
  mark(Boolean(conv.data?.id), "normalize_conversation_owner");
  const mem = await supabase
    .from("tom_memory_items")
    .select(
      "memory_key, memory_value, information_state, source, confidence, user_id, company_id, conversation_id",
    )
    .eq("conversation_id", conversationId);
  const rows = mem.data ?? [];
  mark(rows.length > 0, "normalize_memory_loaded");
  mark(
    rows.every((row) => row.conversation_id === conversationId),
    "normalize_memory_conversation_scoped",
  );
  mark(
    rows.every((row) => row.conversation_id === conversationId),
    "normalize_memory_user_scoped",
  );
  mark(
    rows.every((row) => !row.company_id || row.company_id === conv.data?.company_id),
    "normalize_memory_company_scoped",
  );

  const memories: TomMemoryItem[] = rows.map((row) => ({
    key: row.memory_key,
    value: row.memory_value,
    informationState: row.information_state,
    source: row.source,
    confidence: typeof row.confidence === "number" ? row.confidence : null,
  }));

  const snapshot = normalizeAcquisitionCriteria({
    memories,
    conversationId,
    buyerCompanyId: conv.data?.company_id ?? null,
  });

  mark(
    snapshot.businesses.some((item) => item.canonical === "BMS"),
    "normalize_business_bms",
  );
  const geos = snapshot.geographies.map((item) => item.countryCode).sort();
  mark(geos.includes("KR") && geos.includes("JP"), "normalize_geo_kr_jp");
  mark(snapshot.investmentRange.maxKrw === 10_000_000_000, "normalize_investment_100eok");
  mark(snapshot.investmentRange.currency === "KRW", "normalize_currency_krw");
  mark(snapshot.listingPreference?.canonical === "PRIVATE_ONLY", "normalize_listing_private_only");
  mark(
    snapshot.businesses.some((item) => item.provenance.sourceMemoryKey === "target_businesses"),
    "normalize_provenance_business",
  );
  mark(
    snapshot.geographies.some((item) => item.provenance.sourceMemoryKey === "target_geographies"),
    "normalize_provenance_geo",
  );
  mark(
    snapshot.investmentRange.provenance?.sourceMemoryKey === "investment_size_max",
    "normalize_provenance_money",
  );
  mark(
    !snapshot.sourceMemoryKeys.includes("reason_for_sale"),
    "normalize_no_seller_memory",
  );

  const summary = formatNormalizedCriteriaSummary(snapshot);
  mark(summary.includes("한국"), "summary_korea");
  mark(summary.includes("일본"), "summary_japan");
  mark(summary.includes("BMS"), "summary_bms");
  mark(summary.includes("비상장"), "summary_private");
  mark(summary.includes("100억원"), "summary_100eok");
  mark(!summary.includes("아직 정규화된 인수조건이 충분하지 않습니다."), "summary_ready");
  console.log(`INFO summary=${summary}`);

  await supabase.auth.signOut();
}

main().catch((error) => {
  console.log("FAIL SCRIPT", error instanceof Error ? error.message : "unknown");
  process.exit(1);
});
