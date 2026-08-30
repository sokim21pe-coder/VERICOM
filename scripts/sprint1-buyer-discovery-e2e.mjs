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

const chromeCandidates = [
  process.env.CHROME_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
].filter(Boolean);

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
  console.log("START buyer discovery e2e");

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

  async function login(email) {
    await page.goto("http://localhost:3000/login", { waitUntil: "domcontentloaded" });
    if (!page.url().includes("/login")) {
      const logout = await page.evaluateHandle(() =>
        [...document.querySelectorAll("button")].find((el) =>
          (el.textContent || "").includes("로그아웃"),
        ),
      );
      const logoutEl = logout.asElement();
      if (logoutEl) {
        await Promise.all([
          logoutEl.click(),
          page.waitForNavigation({ waitUntil: "domcontentloaded" }).catch(() => null),
        ]);
      }
      await page.goto("http://localhost:3000/login", { waitUntil: "domcontentloaded" });
    }
    await page.waitForSelector('input[name="email"]', { timeout: 20000 });
    await page.click('input[name="email"]', { clickCount: 3 });
    await page.type('input[name="email"]', email, { delay: 5 });
    await page.click('input[name="password"]', { clickCount: 3 });
    await page.type('input[name="password"]', password, { delay: 5 });
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: "domcontentloaded" }).catch(() => null),
    ]);
    await page.waitForFunction(() => !window.location.pathname.includes("/login"), {
      timeout: 20000,
    }).catch(() => null);
  }

  async function tomText() {
    return page.evaluate(() => document.body.innerText);
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
    await page.waitForFunction(
      (sent) => document.body.innerText.includes(sent),
      { timeout: 20000 },
      text,
    ).catch(() => null);
    await page.waitForFunction(
      () => {
        const button = document.querySelector('form button[type="submit"]');
        return button && !button.disabled && (button.textContent || "").includes("보내기");
      },
      { timeout: 20000 },
    ).catch(() => null);
  }

  try {
    await login("test.buyera.sprint0@vericom.test");
    mark(!page.url().includes("/login"), "buyera_login");

    await page.goto("http://localhost:3000/consult?intent=buy", {
      waitUntil: "domcontentloaded",
    });
    mark(page.url().includes("/consult"), "buyer_consult_open");

    const choice = await page.evaluateHandle(() =>
      [...document.querySelectorAll("button")].find((el) =>
        (el.textContent || "").includes("기업을 인수하고 싶습니다"),
      ),
    );
    const choiceEl = choice.asElement();
    if (choiceEl) {
      await choiceEl.click();
    } else {
      await sendTom("회사를 인수하고 싶어.");
    }
    await page.waitForFunction(
      () => document.body.innerText.includes("목적"),
      { timeout: 15000 },
    ).catch(() => null);
    let body = await tomText();
    mark(body.includes("목적"), "asks_acquisition_objective");
    mark(!body.includes("매각을 검토하시는 가장 큰 이유"), "not_seller_reason_question");

    await sendTom("BMS 기술회사를 사고 싶어.");
    await page.waitForFunction(
      () => document.body.innerText.includes("BMS"),
      { timeout: 15000 },
    ).catch(() => null);
    await new Promise((r) => setTimeout(r, 1200));
    body = await tomText();
    const lastAfterBms = await page.evaluate(() => {
      const nodes = [...document.querySelectorAll("section p.whitespace-pre-wrap")];
      return nodes.at(-1)?.textContent || "";
    });
    mark(!lastAfterBms.includes("관심 있는 사업이나"), "does_not_reask_bms");

    await sendTom("100억까지 생각하고 있어.");
    await new Promise((r) => setTimeout(r, 1200));
    await sendTom("매출 300억에서 1000억 회사.");
    await new Promise((r) => setTimeout(r, 1200));
    await sendTom("상장사는 싫고 비상장만 보고 싶어.");
    await new Promise((r) => setTimeout(r, 1200));
    await sendTom("한국하고 일본.");
    await new Promise((r) => setTimeout(r, 1200));
    await sendTom("아직 모르겠어.");
    await new Promise((r) => setTimeout(r, 1200));
    await sendTom("150억까지도 가능할 것 같아.");
    await new Promise((r) => setTimeout(r, 1500));
    body = await tomText();
    mark(body.includes("한국하고 일본"), "geo_message_kept");
    mark(body.includes("150억"), "override_message_kept");

    await page.reload({ waitUntil: "domcontentloaded" });
    body = await tomText();
    mark(body.includes("BMS 기술회사"), "refresh_keeps_buyer_message");

    await login("test.buyera.sprint0@vericom.test");
    await page.goto("http://localhost:3000/consult?intent=buy", {
      waitUntil: "domcontentloaded",
    });
    body = await tomText();
    mark(body.includes("BMS 기술회사"), "relogin_keeps_buyer_criteria_thread");

    await login("test.multi.sprint0@vericom.test");
    mark(!page.url().includes("/login"), "multi_login");
    await page.goto("http://localhost:3000/consult?intent=sell", {
      waitUntil: "domcontentloaded",
    });
    const sellerChoice = await page.evaluateHandle(() =>
      [...document.querySelectorAll("button")].find((el) =>
        (el.textContent || "").includes("회사를 매각하고 싶습니다"),
      ),
    );
    const sellerChoiceEl = sellerChoice.asElement();
    if (sellerChoiceEl) {
      await sellerChoiceEl.click();
    } else {
      await sendTom("회사를 매각하고 싶습니다.");
    }
    await page.waitForFunction(
      () => document.body.innerText.includes("이유"),
      { timeout: 15000 },
    ).catch(() => null);
    body = await tomText();
    const sellerLast = await page.evaluate(() => {
      const nodes = [...document.querySelectorAll("section p.whitespace-pre-wrap")];
      return nodes.at(-1)?.textContent || "";
    });
    mark(
      !sellerLast.includes("인수에서 가장 중요한 목적") &&
        (body.includes("이유") ||
          body.includes("지분") ||
          body.includes("시점") ||
          body.includes("알려 주신")),
      "multi_seller_discovery",
    );

    const switcher = await page.$("select");
    if (switcher) {
      await page.select("select", "BUYER_USER");
      await page.waitForNavigation({ waitUntil: "domcontentloaded" }).catch(() => null);
      await new Promise((r) => setTimeout(r, 800));
    }
    await page.goto("http://localhost:3000/consult?intent=buy", {
      waitUntil: "domcontentloaded",
    });
    const buyerChoice = await page.evaluateHandle(() =>
      [...document.querySelectorAll("button")].find((el) =>
        (el.textContent || "").includes("기업을 인수하고 싶습니다"),
      ),
    );
    const buyerChoiceEl = buyerChoice.asElement();
    if (buyerChoiceEl) {
      await buyerChoiceEl.click();
      await page.waitForFunction(
        () => document.body.innerText.includes("목적"),
        { timeout: 15000 },
      ).catch(() => null);
    }
    body = await tomText();
    const lastTom = await page.evaluate(() => {
      const nodes = [...document.querySelectorAll("section p.whitespace-pre-wrap")];
      return nodes.at(-1)?.textContent || "";
    });
    mark(
      lastTom.includes("목적") || body.includes("목적"),
      "multi_buyer_asks_objective",
    );
    mark(!lastTom.includes("매각을 검토하시는 가장 큰 이유"), "multi_buyer_not_seller_question");
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
    .select("id, company_id, intent, created_at")
    .eq("intent", "buy")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  mark(Boolean(convA.data?.id), "buyera_buy_conversation");
  const memA = await supabaseA
    .from("tom_memory_items")
    .select("memory_key, memory_value, source")
    .eq("conversation_id", convA.data?.id ?? "00000000-0000-4000-8000-000000000000");
  const keys = (memA.data ?? []).map((row) => row.memory_key);
  mark(keys.includes("target_businesses"), "memory_target_businesses");
  mark(keys.includes("investment_size_max"), "memory_investment_size_max");
  mark(keys.includes("target_revenue_min"), "memory_target_revenue_min");
  mark(keys.includes("listing_preference"), "memory_listing_preference");
  mark(keys.includes("target_geographies"), "memory_target_geographies");
  mark(!keys.includes("reason_for_sale"), "buyer_memory_no_seller_reason");
  const maxRow = (memA.data ?? []).find((row) => row.memory_key === "investment_size_max");
  mark((maxRow?.memory_value || "").includes("15000000000"), "memory_override_150eok");
  mark((maxRow?.source || "").includes("USER_CLAIM"), "memory_user_claim");

  const audits = await supabaseA
    .from("audit_logs")
    .select("action, entity_id")
    .eq("entity_id", convA.data?.id ?? "00000000-0000-4000-8000-000000000000")
    .in("action", [
      "TOM_CONVERSATION_STARTED",
      "TOM_MESSAGE_CREATED",
      "TOM_QUESTION_ASKED",
      "TOM_DISCOVERY_FIELD_CAPTURED",
      "TOM_MEMORY_UPDATED",
    ]);
  const auditActions = (audits.data ?? []).map((row) => row.action);
  mark(auditActions.includes("TOM_CONVERSATION_STARTED"), "audit_conversation_started");
  mark(auditActions.includes("TOM_MESSAGE_CREATED"), "audit_message_created");
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

  for (const line of notes) console.log(line);
  if (notes.some((line) => line.startsWith("FAIL"))) process.exit(1);
}

main().catch((error) => {
  console.log("FAIL SCRIPT", error instanceof Error ? error.message : "unknown");
  process.exit(1);
});
