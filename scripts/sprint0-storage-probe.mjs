import fs from "fs";
import { createClient } from "@supabase/supabase-js";

function loadEnv() {
  const env = {};
  for (const line of fs.readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const i = line.indexOf("=");
    env[line.slice(0, i).trim()] = line
      .slice(i + 1)
      .trim()
      .replace(/^['"]|['"]$/g, "");
  }
  return env;
}

const env = loadEnv();
const password = process.env.VERICOM_TEST_SEED_PASSWORD;
if (!password) throw new Error("set VERICOM_TEST_SEED_PASSWORD");

const sellerCo = "cbb434bb-7ef8-4300-88aa-d19ef14b96cf";
const path = `${sellerCo}/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1_test_dev.txt`;

function client() {
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

const s = client();
await s.auth.signInWithPassword({
  email: "test.seller.sprint0@vericom.test",
  password,
});
const up = await s.storage
  .from("vericom-private")
  .upload(path, Buffer.from("test-dev-private-storage"), {
    contentType: "text/plain",
    upsert: true,
  });
const signed = await s.storage.from("vericom-private").createSignedUrl(path, 60);
const list = await s.storage.from("vericom-private").list(sellerCo);
await s.auth.signOut();

const b = client();
await b.auth.signInWithPassword({
  email: "test.buyerb.sprint0@vericom.test",
  password,
});
const listB = await b.storage.from("vericom-private").list(sellerCo);
const signB = await b.storage.from("vericom-private").createSignedUrl(path, 60);
const companiesB = await b.from("companies").select("id, name").eq("id", sellerCo);
const dealA = await b.from("deals").select("id, title").eq("title", "TEST_DEV_DEAL_A");
await b.auth.signOut();

const e = client();
await e.auth.signInWithPassword({
  email: "test.expert.sprint0@vericom.test",
  password,
});
const dealB = await e
  .from("deals")
  .select("id, title")
  .eq("title", "TEST_DEV_DEAL_B_NO_EXPERT");
await e.auth.signOut();

console.log(
  JSON.stringify(
    {
      sellerUpload: up.error?.message ?? "ok",
      sellerSigned: Boolean(signed.data?.signedUrl),
      sellerExpHint: signed.data?.signedUrl ? "present" : null,
      sellerList: (list.data || []).map((x) => x.name),
      buyerBListError: listB.error?.message ?? null,
      buyerBListCount: listB.data?.length ?? 0,
      buyerBSignedError: signB.error?.message ?? null,
      buyerBSignedUrl: Boolean(signB.data?.signedUrl),
      buyerBSellerCompany: companiesB.data,
      buyerBDealA: dealA.data,
      expertDealB: dealB.data,
    },
    null,
    2,
  ),
);
