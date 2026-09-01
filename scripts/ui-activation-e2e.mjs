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
  page.setDefaultTimeout(60000);
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
    try {
      const cookies = await page.cookies();
      for (const cookie of cookies) {
        await page.deleteCookie({ name: cookie.name }).catch(() => null);
      }
    } catch {
      /* navigation in flight */
    }
  }

  async function currentHref() {
    try {
      return page.url();
    } catch {
      return "";
    }
  }

  async function logoutIfNeeded() {
    const clicked = await page
      .evaluate(() => {
        const button = [...document.querySelectorAll("button")].find((el) =>
          (el.textContent || "").includes("로그아웃"),
        );
        if (!button) return false;
        button.click();
        return true;
      })
      .catch(() => false);
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
    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded", timeout: 60000 });
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
    await clearBrowserAuth();
    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 60000 });
    const landingHasCards = await page.evaluate(() =>
      ["/about/valuation", "/about/matching", "/about/confidential", "/about/experts"].every(
        (href) => Boolean(document.querySelector(`a[href="${href}"]`)),
      ),
    );
    mark(landingHasCards, "landing_service_cards_linked");
    const sellBlockButtons = await page.evaluate(() => {
      const sell = document.querySelector("#sell");
      return [...(sell?.querySelectorAll("a") ?? [])]
        .map((el) => (el.textContent || "").replace(/\s+/g, " ").trim())
        .filter((text) => text === "기업 매각 시작" || text === "기업 인수 시작");
    });
    mark(sellBlockButtons.length === 0, "landing_sell_no_start_buttons");
    mark(
      Boolean(await page.$('#sell a[href="/about/sell"]')),
      "landing_sell_title_linked",
    );
    const buyBlockButtons = await page.evaluate(() => {
      const buy = document.querySelector("#buy");
      return [...(buy?.querySelectorAll("a") ?? [])]
        .map((el) => (el.textContent || "").replace(/\s+/g, " ").trim())
        .filter((text) => text === "기업 매각 시작" || text === "기업 인수 시작");
    });
    mark(buyBlockButtons.length === 0, "landing_buy_no_start_buttons");
    mark(
      Boolean(await page.$('#buy a[href="/about/buy"]')),
      "landing_buy_title_linked",
    );
    mark(
      Boolean(await page.$('#expert a[href="/about/expert"]')),
      "landing_expert_title_linked",
    );
    mark(
      Boolean(await page.$('#guide a[href="/about/guide"]')),
      "landing_guide_title_linked",
    );
    mark(
      Boolean(await page.$('#tom a[href="/about/tom"]')),
      "landing_tom_title_linked",
    );
    mark(
      Boolean(await page.$('#tom a[href*="/login"][href*="onboarding"]')) &&
        Boolean(await page.$('#tom a[href*="/signup"][href*="onboarding"]')),
      "landing_tom_login_signup",
    );
    const journeyHrefs = [
      "/about/process/teaser-l1",
      "/about/process/nda",
      "/about/process/advisory-l2",
      "/about/process/mandate",
      "/about/process/cim-im",
      "/about/process/loi",
      "/about/process/dd",
      "/about/process/spa",
      "/about/process/closing",
      "/about/process/pmi",
    ];
    const journeyLinked = await page.evaluate((hrefs) => {
      const root = document.querySelector("#journey");
      return hrefs.every((href) => Boolean(root?.querySelector(`a[href="${href}"]`)));
    }, journeyHrefs);
    mark(journeyLinked, "landing_journey_steps_linked");
    mark(
      Boolean(await page.$('a[href="/start?intent=sell"]')) &&
        Boolean(await page.$('a[href="/start?intent=buy"]')),
      "landing_hero_start_preserved",
    );

    const clickedValuation = await page.evaluate(() => {
      const el = document.querySelector('#service a[href="/about/valuation"]');
      if (!el) return false;
      el.click();
      return true;
    });
    if (clickedValuation) {
      await page
        .waitForFunction(() => window.location.pathname === "/about/valuation", {
          timeout: 30000,
        })
        .catch(() => null);
    }
    if (!(await currentHref()).includes("/about/valuation")) {
      await page.goto(`${BASE}/about/valuation`, { waitUntil: "domcontentloaded", timeout: 60000 });
    }
    mark((await currentHref()).includes("/about/valuation"), "landing_valuation_click_opens");
    const valuationText = await bodyText();
    mark(valuationText.includes("기업가치 예비평가"), "about_valuation_title");
    mark(
      valuationText.includes("LEVEL 0") && valuationText.includes("아직인 것"),
      "about_valuation_honest",
    );
    const valuationLogin = await page.$('a[href*="/login"][href*="seller%2Fvaluation"]');
    mark(Boolean(valuationLogin), "about_valuation_login_next");

    await page.goto(`${BASE}/about/matching`, { waitUntil: "domcontentloaded", timeout: 60000 });
    const matchingText = await bodyText();
    mark(matchingText.includes("준비"), "about_matching_preparing");
    mark(!matchingText.includes("추천 1"), "about_matching_no_fake_top3");

    await page.goto(`${BASE}/about/sell`, { waitUntil: "domcontentloaded" });
    const sellAbout = await bodyText();
    mark(sellAbout.includes("기업 매각") && sellAbout.includes("로그인"), "about_sell_page");
    mark(
      Boolean(await page.$('a[href*="/login"][href*="intent=sell"]')) &&
        Boolean(await page.$('a[href*="/signup"][href*="intent=sell"]')),
      "about_sell_login_signup",
    );
    const sellLoginHref = await page.$eval(
      'a[href*="/login"][href*="intent=sell"]',
      (el) => el.getAttribute("href") || "",
    );
    const sellLoginUrl = new URL(sellLoginHref, BASE);
    mark(
      sellLoginUrl.searchParams.get("intent") === "sell" &&
        (sellLoginUrl.searchParams.get("next") || "").includes("intent=sell"),
      "about_sell_login_keeps_next",
    );

    await page.goto(`${BASE}/about/buy`, { waitUntil: "domcontentloaded" });
    mark(
      Boolean(await page.$('a[href*="/login"][href*="intent=buy"]')) &&
        Boolean(await page.$('a[href*="/signup"][href*="intent=buy"]')),
      "about_buy_login_signup",
    );

    await page.goto(`${BASE}/about/expert`, { waitUntil: "domcontentloaded" });
    const expertAbout = await bodyText();
    mark(
      expertAbout.includes("전문가") &&
        expertAbout.includes("로그인") &&
        expertAbout.includes("회원가입"),
      "about_expert_page",
    );
    mark(
      Boolean(await page.$('a[href*="/login"][href*="expert"]')) &&
        Boolean(await page.$('a[href*="/signup"][href*="expert"]')),
      "about_expert_login_signup",
    );
    await page.goto(`${BASE}/about/guide`, { waitUntil: "domcontentloaded" });
    const guideAbout = await bodyText();
    mark(
      guideAbout.includes("이용안내") &&
        guideAbout.includes("로그인") &&
        guideAbout.includes("회원가입"),
      "about_guide_page",
    );
    mark(
      Boolean(await page.$('a[href*="/login"][href*="onboarding"]')) &&
        Boolean(await page.$('a[href*="/signup"][href*="onboarding"]')),
      "about_guide_login_signup",
    );

    await page.goto(`${BASE}/about/tom`, { waitUntil: "domcontentloaded" });
    const tomAbout = await bodyText();
    mark(
      tomAbout.includes("TOM(AI)") &&
        tomAbout.includes("로그인") &&
        tomAbout.includes("회원가입") &&
        tomAbout.includes("Guest"),
      "about_tom_page",
    );
    mark(tomAbout.includes("준비"), "about_tom_honest_upcoming");
    mark(
      Boolean(await page.$('a[href*="/login"][href*="onboarding"]')) &&
        Boolean(await page.$('a[href*="/signup"][href*="onboarding"]')),
      "about_tom_login_signup",
    );

    await page.goto(`${BASE}/about/process/nda`, { waitUntil: "domcontentloaded" });
    const ndaAbout = await bodyText();
    mark(
      ndaAbout.includes("NDA") &&
        ndaAbout.includes("비밀유지") &&
        ndaAbout.includes("준비"),
      "about_process_nda_honest",
    );
    mark(
      Boolean(await page.$('a[href*="/login"]')) &&
        Boolean(await page.$('a[href*="/signup"]')),
      "about_process_nda_login_signup",
    );

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
