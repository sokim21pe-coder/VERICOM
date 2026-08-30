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

const actors = [
  { email: "test.seller.sprint0@vericom.test", name: "TEST_DEV_SELLER" },
  { email: "test.buyera.sprint0@vericom.test", name: "TEST_DEV_BUYER_A" },
  { email: "test.buyerb.sprint0@vericom.test", name: "TEST_DEV_BUYER_B" },
  { email: "test.expert.sprint0@vericom.test", name: "TEST_DEV_EXPERT" },
  { email: "test.internal.sprint0@vericom.test", name: "TEST_DEV_INTERNAL" },
  { email: "test.multi.sprint0@vericom.test", name: "TEST_DEV_MULTI" },
];

const env = loadEnv();
const password = process.env.VERICOM_TEST_SEED_PASSWORD;
if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error("missing supabase env");
}
if (!password || password.length < 8) {
  throw new Error("set VERICOM_TEST_SEED_PASSWORD");
}

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

for (const actor of actors) {
  const signed = await supabase.auth.signUp({
    email: actor.email,
    password,
    options: { data: { display_name: actor.name } },
  });
  if (signed.error) {
    const login = await supabase.auth.signInWithPassword({
      email: actor.email,
      password,
    });
    console.log(
      JSON.stringify({
        email: actor.email,
        signup: signed.error.message,
        login: login.error ? login.error.message : "ok",
        session: Boolean(login.data.session),
      }),
    );
    await supabase.auth.signOut();
    continue;
  }
  console.log(
    JSON.stringify({
      email: actor.email,
      signup: "ok",
      session: Boolean(signed.data.session),
      userId: signed.data.user?.id ?? null,
    }),
  );
  await supabase.auth.signOut();
}
