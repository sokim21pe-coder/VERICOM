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

const actors = {
  seller: "test.seller.sprint0@vericom.test",
  buyerA: "test.buyera.sprint0@vericom.test",
  buyerB: "test.buyerb.sprint0@vericom.test",
  expert: "test.expert.sprint0@vericom.test",
  internal: "test.internal.sprint0@vericom.test",
  multi: "test.multi.sprint0@vericom.test",
};

async function asUser(email) {
  const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { supabase, session: data.session, error: error?.message ?? null };
}

async function probe(label, email) {
  const { supabase, session, error } = await asUser(email);
  if (error || !session) {
    return { label, email, login: error ?? "no-session" };
  }
  const user = await supabase.from("users").select("id, email, display_name").maybeSingle();
  const roles = await supabase.from("user_platform_roles").select("platform_role");
  const memberships = await supabase
    .from("company_memberships")
    .select("company_id, membership_role, status");
  const companies = await supabase.from("companies").select("id, name");
  const deals = await supabase.from("deals").select("id, title");
  const parts = await supabase.from("deal_participants").select("deal_id, deal_role");
  const perms = await supabase.from("deal_permissions").select("deal_id, permission_code");
  const workstreams = await supabase.from("dd_workstreams").select("deal_id, code");
  const persons = await supabase.from("persons").select("id, user_id, full_name");

  const sellerCo = (companies.data ?? []).find((row) => row.name === "TEST_DEV_SELLER_CO");
  const otherPath = sellerCo
    ? `${sellerCo.id}/00000000-0000-4000-8000-000000000001_probe.txt`
    : null;
  let storageOther = null;
  if (otherPath) {
    const listed = await supabase.storage.from("vericom-private").list(sellerCo.id);
    const signed = await supabase.storage
      .from("vericom-private")
      .createSignedUrl(otherPath, 60);
    storageOther = {
      listError: listed.error?.message ?? null,
      listCount: listed.data?.length ?? 0,
      signedError: signed.error?.message ?? null,
      signedUrl: Boolean(signed.data?.signedUrl),
    };
  }

  await supabase.auth.signOut();
  return {
    label,
    email,
    login: "ok",
    user: user.data,
    userError: user.error?.message ?? null,
    persons: persons.data,
    roles: (roles.data ?? []).map((row) => row.platform_role),
    memberships: memberships.data,
    companies: companies.data,
    deals: deals.data,
    participants: parts.data,
    permissions: perms.data,
    workstreams: workstreams.data,
    storageOther,
  };
}

const out = [];
for (const [label, email] of Object.entries(actors)) {
  out.push(await probe(label, email));
}
console.log(JSON.stringify(out, null, 2));
