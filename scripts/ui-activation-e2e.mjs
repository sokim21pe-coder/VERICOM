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

const BASE = process.env.VERICOM_E2E_BASE || "http://localhost:3000";

async function main() {
  const env = loadEnv();
  const password = process.env.VERICOM_TEST_SEED_PASSWORD || env.VERICOM_TEST_SEED_PASSWORD;
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !password) {
    console.log("FAIL ENV");
    process.exit(1);
  }

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

  async function bodyText() {
    return page.evaluate(() => document.body.innerText);
  }

  async function navLabels() {
    return page.evaluate(() =>
      [...document.querySelectorAll('nav[aria-label="워크스페이스 메뉴"] a')].map(
        (el) => el.textContent.replace(/\s+/g, " ").trim(),
      ),
    );
  }

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
    const clicked = await page.evaluate(() => {
      const button = [...document.querySelectorAll("button")].find((el) =>
        (el.textContent || "").includes("로그아웃"),
      );
      if (!button) return false;
      button.click();
      return true;
    });
    if (clicked) {
      await page
        .waitForFunction(
          () =>
            window.location.pathname === "/" ||
            window.location.pathname.includes("/login"),
          { timeout: 15000 },
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
    const emailInput = await page.waitForSelector('input[name="email"], input[type="email"]', {
      timeout: 30000,
    });
    await emailInput.click({ clickCount: 3 });
    await emailInput.type(email, { delay: 5 });
    const passwordInput = await page.$('input[name="password"], input[type="password"]');
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

  try {
    await login("test.seller.sprint0@vericom.test");
    mark(page.url().includes("/seller"), "seller_workspace");
    const sellerHome = await bodyText();
    mark(sellerHome.includes("매각 워크스페이스"), "seller_home_title");
    mark(sellerHome.includes("플랫폼 역할"), "seller_context");
    mark(sellerHome.includes("매각 Discovery") || sellerHome.includes("매각 이유"), "seller_discovery");
    mark(sellerHome.includes("재무 입력"), "seller_financial");
    mark(sellerHome.includes("가치평가"), "seller_valuation_section");
    mark(!/\d+원입니다/.test(sellerHome) || sellerHome.includes("Benchmark") || sellerHome.includes("계산 전") || sellerHome.includes("재무 입력"), "seller_no_fake_ev_home");
    mark(!sellerHome.includes("추천 회사"), "seller_no_fake_buyers");
    const sellerNav = await navLabels();
    mark(sellerNav.some((item) => item.includes("홈")) && sellerNav.some((item) => item.includes("TOM")), "seller_nav_core");
    mark(!sellerNav.some((item) => item.includes("경영진 미팅")), "seller_nav_no_mm");

    await page.goto(`${BASE}/seller/valuation`, { waitUntil: "domcontentloaded" });
    const valText = await bodyText();
    mark(valText.includes("가치평가"), "seller_valuation_page");
    mark(
      valText.includes("비교배수") ||
        valText.includes("재무정보 입력") ||
        valText.includes("계산 불가") ||
        valText.includes("데이터 없음") ||
        valText.includes("Indicative EV") ||
        valText.includes("LEVEL 0"),
      "seller_valuation_honest_status",
    );
    mark(
      valText.includes("LEVEL 1") &&
        valText.includes("EV/EBITDA") &&
        valText.includes("DCF는 사용하지 않습니다"),
      "seller_valuation_level1_honest",
    );
    mark(
      valText.includes("3개년") &&
        valText.includes("매출 1년차") &&
        valText.includes("EBITDA 1년차") &&
        (valText.includes("진행상태") || valText.includes("재무 입력")),
      "seller_valuation_level1_years_progress",
    );

    await page.goto(`${BASE}/consult?intent=sell`, { waitUntil: "domcontentloaded" });
    const consultSeller = await bodyText();
    mark(consultSeller.includes("기업 매각 상담"), "seller_tom_purpose");
    mark(Boolean(await page.$("#tom-input")), "seller_tom_input");
    mark(!consultSeller.includes("{") || !consultSeller.includes("memory_key"), "seller_tom_no_dev_json");
    mark(
      consultSeller.includes("가치평가") &&
        !consultSeller.includes("대략 1") &&
        !consultSeller.includes("예상가치"),
      "seller_tom_valuation_no_placeholder",
    );

    await page.goto(`${BASE}/buyer`, { waitUntil: "domcontentloaded" });
    mark(!page.url().includes("/buyer") || (await bodyText()).includes("권한이 없습니다") || page.url().includes("/seller"), "seller_blocked_from_buyer");

    await login("test.buyera.sprint0@vericom.test");
    mark(page.url().includes("/buyer"), "buyer_workspace");
    const buyerHome = await bodyText();
    mark(buyerHome.includes("인수 워크스페이스"), "buyer_home_title");
    mark(buyerHome.includes("인수조건"), "buyer_criteria_section");
    mark(buyerHome.includes("Matching Engine 준비 전") || buyerHome.includes("미입력") || buyerHome.includes("인수조건 정리"), "buyer_matching_honest");
    mark(!buyerHome.includes("추천 1") && !buyerHome.includes("가짜"), "buyer_no_fake_matches");
    const buyerNav = await navLabels();
    mark(buyerNav.some((item) => item.includes("인수조건")), "buyer_nav_criteria");
    mark(!buyerNav.some((item) => item.includes("추천 Deal")), "buyer_nav_no_recommended");

    await page.goto(`${BASE}/buyer/criteria`, { waitUntil: "domcontentloaded" });
    const criteriaText = await bodyText();
    mark(criteriaText.includes("인수조건"), "buyer_criteria_page");

    await page.goto(`${BASE}/consult?intent=buy`, { waitUntil: "domcontentloaded" });
    const consultBuyer = await bodyText();
    mark(consultBuyer.includes("기업 인수 상담"), "buyer_tom_purpose");
    mark(Boolean(await page.$("#tom-input")), "buyer_tom_input");

    await page.goto(`${BASE}/seller`, { waitUntil: "domcontentloaded" });
    mark(!page.url().includes("/seller") || page.url().includes("/buyer"), "buyer_blocked_from_seller");

    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    const other = await supabase.auth.signInWithPassword({
      email: "test.buyerb.sprint0@vericom.test",
      password,
    });
    mark(Boolean(other.data.session), "buyerb_api_login");
    if (other.data.session) {
      const files = await supabase.storage.from("vericom-private").list("00000000-0000-0000-0000-000000000000");
      mark(Boolean(files.error) || !(files.data ?? []).length, "buyerb_cannot_list_foreign_prefix");
    }
  } catch (error) {
    notes.push(`FAIL exception ${error.message}`);
  } finally {
    await browser.close();
    for (const line of notes) console.log(line);
    const failed = notes.some((line) => line.startsWith("FAIL"));
    process.exit(failed ? 1 : 0);
  }
}

main();
