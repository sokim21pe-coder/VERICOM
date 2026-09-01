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
    await login("test.expert.sprint0@vericom.test");
    mark(page.url().includes("/expert"), "expert_workspace");
    await page.goto(`${BASE}/expert/benchmarks`, { waitUntil: "domcontentloaded" });
    const expertText = await bodyText();
    mark(page.url().includes("/expert/benchmarks"), "expert_benchmark_route");
    mark(expertText.includes("E-BENCHMARK") && expertText.includes("승인 비교배수"), "expert_benchmark_screen");
    mark(expertText.includes("PLACEHOLDER") || expertText.includes("TEST_ONLY"), "expert_honest_no_placeholder_policy");

    const multipleValues = await page.evaluate(() =>
      ["benchmark-low", "benchmark-base", "benchmark-high"].map((id) => {
        const el = document.getElementById(id);
        return el && "value" in el ? String(el.value) : null;
      }),
    );
    const hasForm = multipleValues.every((value) => value != null);
    const emptyOrPresent = !hasForm || multipleValues.every((value) => value === "");
    mark(emptyOrPresent, "expert_no_prefilled_multiple");
    mark(
      !hasForm || !multipleValues.some((value) => value === "1.5" || value === "0.5" || value === "2.0"),
      "expert_no_default_range",
    );

    const sourceTypes = await page.evaluate(() =>
      [...document.querySelectorAll("#benchmark-source-type option")].map((el) => el.value),
    );
    mark(
      !sourceTypes.includes("TEST_FIXTURE") &&
        !sourceTypes.includes("UNKNOWN") &&
        !sourceTypes.includes("TEST_ONLY"),
      "expert_source_types_production_only",
    );
    mark(
      Boolean(await page.$('input[name="confirmed"]')),
      "expert_confirmation_checkbox",
    );

    await login("test.internal.sprint0@vericom.test");
    mark(page.url().includes("/internal"), "internal_workspace");
    await page.goto(`${BASE}/internal/benchmarks`, { waitUntil: "domcontentloaded" });
    const internalText = await bodyText();
    mark(page.url().includes("/internal/benchmarks"), "internal_benchmark_route");
    mark(internalText.includes("I-BENCHMARK"), "internal_benchmark_screen");
    const internalBase = await page.evaluate(() => {
      const el = document.getElementById("benchmark-base");
      return el && "value" in el ? String(el.value) : "";
    });
    mark(internalBase !== "1.5", "internal_no_prefilled_15");

    await login("test.seller.sprint0@vericom.test");
    mark(page.url().includes("/seller"), "seller_workspace");
    await page.goto(`${BASE}/expert/benchmarks`, { waitUntil: "domcontentloaded" });
    mark(
      !page.url().includes("/expert/benchmarks") ||
        (await bodyText()).includes("권한이 없습니다"),
      "seller_blocked_from_expert_benchmarks",
    );
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
