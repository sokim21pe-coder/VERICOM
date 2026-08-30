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

const wanted = [
  "ROLE_ADDED",
  "SELECT_PLATFORM_ROLE",
  "WORKSPACE_SWITCHED",
  "UPLOAD_PRIVATE_FILE",
  "DOWNLOAD_PRIVATE_FILE",
];

async function probe(email) {
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { email, login: error.message };
  }
  const logs = await supabase
    .from("audit_logs")
    .select("action, entity_type, created_at")
    .order("created_at", { ascending: false })
    .limit(30);
  const acts = await supabase
    .from("activities")
    .select("activity_type, entity_type, created_at")
    .order("created_at", { ascending: false })
    .limit(30);
  const actions = [...new Set((logs.data ?? []).map((row) => row.action))];
  const activityTypes = [...new Set((acts.data ?? []).map((row) => row.activity_type))];
  await supabase.auth.signOut();
  return {
    email,
    login: "ok",
    auditError: logs.error?.message ?? null,
    activityError: acts.error?.message ?? null,
    wantedHits: Object.fromEntries(
      wanted.map((name) => [
        name,
        {
          audit: actions.includes(name),
          activity: activityTypes.includes(name),
        },
      ]),
    ),
    recentAudit: (logs.data ?? []).slice(0, 8),
    recentActivity: (acts.data ?? []).slice(0, 8),
  };
}

const out = [];
for (const email of [
  "test.seller.sprint0@vericom.test",
  "test.multi.sprint0@vericom.test",
]) {
  out.push(await probe(email));
}
console.log(JSON.stringify(out, null, 2));
