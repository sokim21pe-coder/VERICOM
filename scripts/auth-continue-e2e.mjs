import fs from "fs";

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
  const password =
    process.env.VERICOM_TEST_SEED_PASSWORD || env.VERICOM_TEST_SEED_PASSWORD;
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
  await page.setViewport({ width: 1280, height: 800 });
  page.setDefaultTimeout(45000);
  const notes = [];
  const mark = (ok, label) => notes.push(`${ok ? "PASS" : "FAIL"} ${label}`);

  async function clickLandingTab(label, hrefIncludes) {
    await page.waitForSelector(`a[href*="${hrefIncludes}"]`, { timeout: 20000 });
    const clicked = await page.evaluate((href) => {
      const el = [...document.querySelectorAll("a")].find((a) =>
        a.getAttribute("href")?.includes(href),
      );
      if (!el) return false;
      el.click();
      return true;
    }, hrefIncludes);
    if (!clicked) return false;
    await page
      .waitForFunction(
        () => {
          const path = window.location.pathname;
          return (
            path === "/login" ||
            path === "/consult" ||
            path === "/seller" ||
            path === "/buyer" ||
            path.startsWith("/onboarding")
          );
        },
        { timeout: 25000 },
      )
      .catch(() => null);
    return true;
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

  async function login(email) {
    await page.waitForSelector('input[name="email"]', { timeout: 25000 });
    await page.click('input[name="email"]', { clickCount: 3 });
    await page.type('input[name="email"]', email, { delay: 5 });
    await page.click('input[name="password"]', { clickCount: 3 });
    await page.type('input[name="password"]', password, { delay: 5 });
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: "domcontentloaded" }).catch(() => null),
    ]);
    await page
      .waitForFunction(
        () => !window.location.pathname.includes("/login"),
        { timeout: 20000 },
      )
      .catch(() => null);
  }

  try {
    await clearBrowserAuth();
    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
    mark(await clickLandingTab("기업 매각", "/start?intent=sell"), "sell_tab_clicked");
    const sellLoginUrl = new URL(page.url());
    mark(sellLoginUrl.pathname === "/login", `sell_guest_login path=${sellLoginUrl.pathname}`);
    mark(
      sellLoginUrl.searchParams.get("intent") === "sell" &&
        (sellLoginUrl.searchParams.get("next") || "").includes("intent=sell"),
      "sell_login_keeps_next",
    );

    await login("test.seller.sprint0@vericom.test");
    const afterSell = new URL(page.url());
    mark(
      afterSell.pathname === "/consult" &&
        afterSell.searchParams.get("intent") === "sell",
      `sell_after_login path=${afterSell.pathname}${afterSell.search}`,
    );

    const sellToken = `이어가기매각-${Date.now()}`;
    const sellInput = await page.$("#tom-input");
    if (!sellInput) {
      mark(false, "sell_tom_input_missing");
    } else {
      await sellInput.type(sellToken, { delay: 5 });
      await page.click('button[type="submit"]');
      await page
        .waitForFunction(
          (token) => document.body.innerText.includes(token),
          { timeout: 20000 },
          sellToken,
        )
        .catch(() => null);
      await page.reload({ waitUntil: "domcontentloaded" });
      const afterReload = await page.evaluate(() => document.body.innerText);
      mark(afterReload.includes(sellToken), "sell_message_persists");
    }

    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
    mark(await clickLandingTab("기업 매각", "/start?intent=sell"), "sell_signed_in_clicked");
    const signedInSell = new URL(page.url());
    mark(
      signedInSell.pathname === "/consult" &&
        signedInSell.searchParams.get("intent") === "sell" &&
        !signedInSell.pathname.includes("/login"),
      `sell_signed_in_no_login path=${signedInSell.pathname}${signedInSell.search}`,
    );

    await clearBrowserAuth();
    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
    mark(await clickLandingTab("기업 인수", "/start?intent=buy"), "buy_tab_clicked");
    const buyLoginUrl = new URL(page.url());
    mark(buyLoginUrl.pathname === "/login", `buy_guest_login path=${buyLoginUrl.pathname}`);
    mark(
      buyLoginUrl.searchParams.get("intent") === "buy" &&
        (buyLoginUrl.searchParams.get("next") || "").includes("intent=buy"),
      "buy_login_keeps_next",
    );

    await login("test.buyera.sprint0@vericom.test");
    const afterBuy = new URL(page.url());
    mark(
      afterBuy.pathname === "/consult" &&
        afterBuy.searchParams.get("intent") === "buy",
      `buy_after_login path=${afterBuy.pathname}${afterBuy.search}`,
    );

    const buyToken = `이어가기인수-${Date.now()}`;
    const buyInput = await page.$("#tom-input");
    if (!buyInput) {
      mark(false, "buy_tom_input_missing");
    } else {
      await buyInput.type(buyToken, { delay: 5 });
      await page.click('button[type="submit"]');
      await page
        .waitForFunction(
          (token) => document.body.innerText.includes(token),
          { timeout: 20000 },
          buyToken,
        )
        .catch(() => null);
      await page.reload({ waitUntil: "domcontentloaded" });
      const afterBuyReload = await page.evaluate(() => document.body.innerText);
      mark(afterBuyReload.includes(buyToken), "buy_message_persists");
    }
  } catch (error) {
    notes.push(
      `FAIL exception:${error instanceof Error ? error.message : "unknown"}`,
    );
  } finally {
    await browser.close();
  }

  for (const line of notes) console.log(line);
  if (notes.some((line) => line.startsWith("FAIL"))) process.exit(1);
}

main();
