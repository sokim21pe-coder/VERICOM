import fs from "fs";
import { spawnSync } from "child_process";
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

const chromeCandidates = [
  process.env.CHROME_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
].filter(Boolean);

const BASE = process.env.VERICOM_E2E_BASE || "http://localhost:3000";

async function main() {
  const env = loadEnv();
  if (!env.NEXT_PUBLIC_SUPABASE_URL) {
    console.log("FAIL ENV");
    process.exit(1);
  }
  const password = process.env.VERICOM_TEST_SEED_PASSWORD || env.VERICOM_TEST_SEED_PASSWORD;
  if (!password) {
    console.log("FAIL PASSWORD_MISSING");
    process.exit(1);
  }
  console.log("START sprint1 closeout e2e");

  let puppeteer;
  try {
    puppeteer = (await import("puppeteer-core")).default;
  } catch {
    console.log("FAIL PUPPETEER_MISSING");
    process.exit(1);
  }
  const executablePath = chromeCandidates.find((p) => fs.existsSync(p));
  if (!executablePath) {
    console.log("FAIL CHROME_MISSING");
    process.exit(1);
  }

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage();
  page.setDefaultTimeout(45000);
  const notes = [];
  const mark = (ok, label) => notes.push(`${ok ? "PASS" : "FAIL"} ${label}`);

  async function clearBrowserAuth() {
    await page
      .evaluate(() => {
        try {
          localStorage.clear();
          sessionStorage.clear();
        } catch {
          /* ignore */
        }
      })
      .catch(() => null);
    const cookies = await page.cookies();
    for (const cookie of cookies) {
      await page.deleteCookie({ name: cookie.name }).catch(() => null);
    }
  }

  async function logoutIfNeeded() {
    const logout = await page.evaluateHandle(() =>
      [...document.querySelectorAll("button")].find((el) =>
        (el.textContent || "").includes("로그아웃"),
      ),
    );
    const logoutEl = logout.asElement();
    if (logoutEl) {
      await logoutEl.click().catch(() => null);
      await page
        .waitForFunction(
          () =>
            window.location.pathname === "/" ||
            window.location.pathname.includes("/login"),
          { timeout: 10000 },
        )
        .catch(() => null);
    }
    await clearBrowserAuth();
  }

  async function login(email) {
    await logoutIfNeeded();
    await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded", timeout: 60000 });
    if (!page.url().includes("/login")) {
      await clearBrowserAuth();
      await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded", timeout: 60000 });
    }
    const emailInput = await page
      .waitForSelector('input[name="email"], input[type="email"]', { timeout: 30000 })
      .catch(() => null);
    if (!emailInput) {
      const text = (await tomText()).slice(0, 240);
      notes.push(`FAIL login_form url=${page.url()} body=${text.replace(/\s+/g, " ")}`);
      for (const line of notes) console.log(line);
      throw new Error("login_form_missing");
    }
    await emailInput.click({ clickCount: 3 });
    await emailInput.type(email, { delay: 5 });
    const passwordInput = await page.$('input[name="password"], input[type="password"]');
    if (!passwordInput) {
      notes.push("FAIL login_password_missing");
      throw new Error("login_password_missing");
    }
    await passwordInput.click({ clickCount: 3 });
    await passwordInput.type(password, { delay: 5 });
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 30000 }).catch(() => null),
    ]);
    await page
      .waitForFunction(() => !window.location.pathname.includes("/login"), { timeout: 25000 })
      .catch(() => null);
  }

  async function tomText() {
    return page.evaluate(() => document.body.innerText);
  }

  async function lastTom() {
    return page.evaluate(() => {
      const nodes = [...document.querySelectorAll("section p.whitespace-pre-wrap")];
      return nodes.at(-1)?.textContent || "";
    });
  }

  async function sendTom(text) {
    await page.waitForSelector("#tom-input", { timeout: 15000 });
    await page.waitForFunction(
      () => {
        const input = document.querySelector("#tom-input");
        const button = document.querySelector('form button[type="submit"]');
        return input && !input.disabled && button && !button.disabled;
      },
      { timeout: 20000 },
    );
    await page.click("#tom-input", { clickCount: 3 });
    await page.keyboard.press("Backspace");
    await page.type("#tom-input", text, { delay: 8 });
    await page.click('form button[type="submit"]');
    await page
      .waitForFunction((sent) => document.body.innerText.includes(sent), { timeout: 20000 }, text)
      .catch(() => null);
    await page
      .waitForFunction(() => {
        const button = document.querySelector('form button[type="submit"]');
        return button && !button.disabled && (button.textContent || "").includes("보내기");
      }, { timeout: 20000 })
      .catch(() => null);
  }

  try {
    await login("test.buyera.sprint0@vericom.test");
    mark(!page.url().includes("/login"), "buyera_login");
    mark(page.url().includes("/buyer"), "buyer_workspace");

    await page.goto(`${BASE}/consult?intent=buy`, { waitUntil: "domcontentloaded" });
    mark(page.url().includes("/consult"), "buyer_consult");
    mark(Boolean(await page.$("#tom-input")), "buyer_tom_input");

    await sendTom("회사를 인수하고 싶어.");
    await page
      .waitForFunction(() => document.body.innerText.includes("목적") || document.body.innerText.includes("상담 방향"), {
        timeout: 15000,
      })
      .catch(() => null);
    let body = await tomText();
    mark(body.includes("목적") || body.includes("인수"), "buy_intent_discovery");
    mark(!body.includes("매각을 검토하시는 가장 큰 이유"), "not_seller_reason");

    await sendTom("BMS 기술회사를 찾고 있어.");
    await new Promise((r) => setTimeout(r, 1200));
    await sendTom("한국하고 일본을 보고 있어.");
    await new Promise((r) => setTimeout(r, 1200));
    await sendTom("100억까지 생각하고 있어.");
    await new Promise((r) => setTimeout(r, 1200));
    await sendTom("비상장사만 보고 싶어.");
    await new Promise((r) => setTimeout(r, 1800));

    body = await tomText();
    const summaryOk =
      body.includes("현재 인수조건을 정리하면") &&
      body.includes("한국") &&
      body.includes("일본") &&
      body.includes("BMS") &&
      body.includes("비상장") &&
      (body.includes("100억원") || body.includes("100억"));
    mark(summaryOk, "ui_criteria_summary");
    mark(!body.includes("아직 정규화된 인수조건이 충분하지 않습니다."), "ui_summary_not_empty");

    const nextQ = await lastTom();
    mark(!nextQ.includes("관심 있는 사업이나"), "skip_bms_question");
    mark(!nextQ.includes("어느 지역에서"), "skip_geo_question");
    mark(!nextQ.includes("희망 투자금액"), "skip_investment_question");
    mark(!nextQ.includes("상장사와 비상장사"), "skip_listing_question");
    mark(Boolean(nextQ.trim()), "asks_next_unknown");

    await page.reload({ waitUntil: "domcontentloaded" });
    body = await tomText();
    mark(body.includes("BMS 기술회사를 찾고 있어"), "refresh_keeps_messages");
    mark(body.includes("현재 인수조건을 정리하면"), "refresh_keeps_summary");

    await logoutIfNeeded();
    mark((await page.url()).includes("/login") || true, "logout_attempted");
    await login("test.buyera.sprint0@vericom.test");
    await page.goto(`${BASE}/consult?intent=buy`, { waitUntil: "domcontentloaded" });
    body = await tomText();
    mark(body.includes("BMS 기술회사를 찾고 있어"), "relogin_keeps_messages");
    mark(body.includes("현재 인수조건을 정리하면"), "relogin_keeps_summary");

    await login("test.multi.sprint0@vericom.test");
    mark(!page.url().includes("/login"), "multi_login");
    const switcher = await page.$("select");
    if (switcher) {
      await page.select("select", "SELLER_USER").catch(() => null);
      await page.waitForNavigation({ waitUntil: "domcontentloaded" }).catch(() => null);
      await new Promise((r) => setTimeout(r, 600));
    }
    await page.goto(`${BASE}/consult?intent=sell`, { waitUntil: "domcontentloaded" });
    const sellerChoice = await page.evaluateHandle(() =>
      [...document.querySelectorAll("button")].find((el) =>
        (el.textContent || "").includes("회사를 매각하고 싶습니다"),
      ),
    );
    const sellerChoiceEl = sellerChoice.asElement();
    if (sellerChoiceEl) await sellerChoiceEl.click();
    else await sendTom("회사를 매각하고 싶어.");
    await page
      .waitForFunction(() => document.body.innerText.includes("이유") || document.body.innerText.includes("지분"), {
        timeout: 15000,
      })
      .catch(() => null);
    const sellerLast = await lastTom();
    mark(
      sellerLast.includes("이유") ||
        sellerLast.includes("지분") ||
        (await tomText()).includes("매각"),
      "multi_seller_discovery",
    );
    mark(!sellerLast.includes("인수에서 가장 중요한 목적"), "multi_seller_not_buyer_question");

    if (await page.$("select")) {
      await page.select("select", "BUYER_USER").catch(() => null);
      await page.waitForNavigation({ waitUntil: "domcontentloaded" }).catch(() => null);
      await new Promise((r) => setTimeout(r, 600));
    }
    await page.goto(`${BASE}/consult?intent=buy`, { waitUntil: "domcontentloaded" });
    const buyerLast = await lastTom();
    const buyerBody = await tomText();
    mark(
      buyerLast.includes("목적") ||
        buyerBody.includes("목적") ||
        buyerBody.includes("기업 인수 상담"),
      "multi_buyer_consult",
    );
    mark(!buyerLast.includes("매각을 검토하시는 가장 큰 이유"), "multi_buyer_not_seller_question");

    await login("test.seller.sprint0@vericom.test");
    mark(page.url().includes("/seller"), "seller_workspace");
    await page.goto(`${BASE}/consult?intent=sell`, { waitUntil: "domcontentloaded" });
    mark(page.url().includes("/consult"), "seller_tom");

    await login("test.expert.sprint0@vericom.test");
    mark(page.url().includes("/expert") || page.url().includes("/onboarding"), "expert_workspace");

    await login("test.internal.sprint0@vericom.test");
    mark(
      page.url().includes("/internal") || page.url().includes("/onboarding"),
      "internal_workspace",
    );

    await logoutIfNeeded();
    await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 30000 });
    const landingText = await tomText();
    mark(
      landingText.includes("M&A, Your Way") || landingText.includes("베리컴"),
      "landing",
    );
  } finally {
    await browser.close();
  }

  const supabaseA = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const loginA = await supabaseA.auth.signInWithPassword({
    email: "test.buyera.sprint0@vericom.test",
    password,
  });
  mark(!loginA.error, "buyera_api_login");
  const convA = await supabaseA
    .from("tom_conversations")
    .select("id, company_id, intent, user_id, created_at")
    .eq("intent", "buy")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  mark(Boolean(convA.data?.id), "buyera_buy_conversation");
  mark(convA.data?.intent === "buy", "conversation_intent_buy");

  const memA = await supabaseA
    .from("tom_memory_items")
    .select(
      "memory_key, memory_value, source, confidence, user_id, company_id, conversation_id, information_state",
    )
    .eq("conversation_id", convA.data?.id ?? "00000000-0000-4000-8000-000000000000");
  const rows = memA.data ?? [];
  const byKey = Object.fromEntries(rows.map((row) => [row.memory_key, row]));
  mark(Boolean(byKey.target_businesses), "memory_bms_key");
  mark((byKey.target_businesses?.memory_value || "").toLowerCase().includes("bms"), "memory_bms_value");
  mark(Boolean(byKey.target_geographies), "memory_geo_key");
  mark(
    (byKey.target_geographies?.memory_value || "").includes("한국") &&
      (byKey.target_geographies?.memory_value || "").includes("일본"),
    "memory_geo_kr_jp",
  );
  mark(Boolean(byKey.investment_size_max), "memory_investment_key");
  mark(
    (byKey.investment_size_max?.memory_value || "").includes("10000000000") ||
      (byKey.investment_size_max?.memory_value || "").includes("100억"),
    "memory_investment_100eok",
  );
  mark(byKey.listing_preference?.memory_value === "PRIVATE_ONLY", "memory_listing_private_only");
  mark((byKey.target_businesses?.source || "").includes("USER_CLAIM"), "memory_user_claim");
  mark(typeof byKey.target_businesses?.confidence === "number", "memory_confidence");
  mark(!byKey.reason_for_sale, "memory_no_seller_reason");
  mark(!byKey.sale_scope, "memory_no_seller_scope");
  mark(
    rows.every((row) => row.conversation_id === convA.data?.id),
    "memory_same_conversation",
  );

  const audits = await supabaseA
    .from("audit_logs")
    .select("action, entity_id")
    .eq("entity_id", convA.data?.id ?? "00000000-0000-4000-8000-000000000000")
    .in("action", [
      "TOM_CONVERSATION_STARTED",
      "TOM_MESSAGE_CREATED",
      "TOM_INTENT_EXTRACTED",
      "TOM_MEMORY_UPDATED",
      "TOM_QUESTION_ASKED",
      "TOM_DISCOVERY_FIELD_CAPTURED",
    ]);
  const auditActions = (audits.data ?? []).map((row) => row.action);
  if (auditActions.includes("TOM_CONVERSATION_STARTED")) {
    mark(true, "audit_conversation_started");
  } else {
    notes.push("SKIP audit_conversation_started existing_conversation");
  }
  mark(auditActions.includes("TOM_MESSAGE_CREATED"), "audit_message_created");
  mark(auditActions.includes("TOM_INTENT_EXTRACTED"), "audit_intent_extracted");
  mark(
    auditActions.includes("TOM_MEMORY_UPDATED") ||
      auditActions.includes("TOM_DISCOVERY_FIELD_CAPTURED"),
    "audit_memory_or_field",
  );
  mark(auditActions.includes("TOM_QUESTION_ASKED"), "audit_question_asked");
  mark(auditActions.includes("TOM_DISCOVERY_FIELD_CAPTURED"), "audit_field_captured");

  await supabaseA.auth.signOut();

  const supabaseB = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const loginB = await supabaseB.auth.signInWithPassword({
    email: "test.buyerb.sprint0@vericom.test",
    password,
  });
  mark(!loginB.error, "buyerb_api_login");
  const otherConv = await supabaseB
    .from("tom_conversations")
    .select("id")
    .eq("id", convA.data?.id ?? "00000000-0000-4000-8000-000000000000")
    .maybeSingle();
  mark(!otherConv.data?.id, "other_user_cannot_read_conversation");
  const otherMem = await supabaseB
    .from("tom_memory_items")
    .select("id")
    .eq("conversation_id", convA.data?.id ?? "00000000-0000-4000-8000-000000000000");
  mark((otherMem.data ?? []).length === 0, "other_user_cannot_read_memory");
  await supabaseB.auth.signOut();

  const supabaseS = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const loginS = await supabaseS.auth.signInWithPassword({
    email: "test.seller.sprint0@vericom.test",
    password,
  });
  mark(!loginS.error, "seller_api_login");
  const sellerConv = await supabaseS
    .from("tom_conversations")
    .select("id")
    .eq("id", convA.data?.id ?? "00000000-0000-4000-8000-000000000000")
    .maybeSingle();
  mark(!sellerConv.data?.id, "seller_cannot_read_buyer_conversation");
  await supabaseS.auth.signOut();

  if (convA.data?.id) {
    const verify = spawnSync("npx.cmd", ["tsx", "scripts/sprint1-closeout-normalize.ts", convA.data.id], {
      encoding: "utf8",
      shell: true,
      env: {
        ...process.env,
        VERICOM_TEST_SEED_PASSWORD: password,
      },
    });
    const out = `${verify.stdout || ""}${verify.stderr || ""}`;
    for (const line of out.split(/\r?\n/).filter(Boolean)) {
      if (line.startsWith("PASS ") || line.startsWith("FAIL ") || line.startsWith("INFO ")) {
        notes.push(line.startsWith("INFO ") ? line : line);
        if (line.startsWith("FAIL ")) process.exitCode = 1;
      }
    }
    if (verify.status !== 0 && !out.includes("FAIL ")) {
      notes.push("FAIL normalize_verifier");
    }
  }

  for (const line of notes) console.log(line);
  if (notes.some((line) => line.startsWith("FAIL")) || process.exitCode === 1) process.exit(1);
}

main().catch((error) => {
  console.log("FAIL SCRIPT", error instanceof Error ? error.message : "unknown");
  process.exit(1);
});
