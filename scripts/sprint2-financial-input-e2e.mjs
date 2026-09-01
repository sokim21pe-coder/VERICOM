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
    await page.deleteCookie(...(await page.cookies("http://localhost:3000")));
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

  try {
    await login("test.seller.sprint0@vericom.test");
    mark(!page.url().includes("/login"), "seller_login");

    await page.goto("http://localhost:3000/consult?intent=sell", {
      waitUntil: "domcontentloaded",
    });
    mark(page.url().includes("/consult"), "seller_consult_open");

    const honestValuation = (text) =>
      text.includes("기업가치 숫자는 아직 계산하지 않습니다") ||
      text.includes("비교배수가 아직") ||
      text.includes("기업가치 금액은 계산하지 않았습니다") ||
      text.includes("재무정보 입력 필요");

    let body = await page.evaluate(() => document.body.innerText);
    if (!honestValuation(body) && !/\d+\s*억/.test(body)) {
      const input = await page.$("#tom-input");
      if (input) {
        await page.type("#tom-input", "매출은 100억이야.");
        await page.click('button[type="submit"]');
        await page.waitForFunction(
          () => {
            const text = document.body.innerText;
            return (
              text.includes("비교배수가 아직") ||
              text.includes("기업가치 금액은 계산하지 않았습니다") ||
              text.includes("재무정보 입력 필요") ||
              /\d+\s*억/.test(text)
            );
          },
          { timeout: 20000 },
        ).catch(() => null);
      }
    }
    body = await page.evaluate(() => document.body.innerText);
    mark(honestValuation(body), "seller_financial_summary");
    mark(body.includes("매출") || /\d+\s*억/.test(body), "seller_revenue_label");
    mark(
      !body.includes("예상가치") &&
        !body.includes("대략 1~2배") &&
        !/Indicative EV 계산됨/.test(body),
      "no_invented_ev",
    );

    await page.reload({ waitUntil: "domcontentloaded" });
    body = await page.evaluate(() => document.body.innerText);
    mark(honestValuation(body), "refresh_keeps_summary");

    await page.goto("http://localhost:3000/seller/valuation", {
      waitUntil: "domcontentloaded",
    });
    body = await page.evaluate(() => document.body.innerText);
    mark(
      body.includes("LEVEL 1") &&
        body.includes("EV/EBITDA") &&
        body.includes("DCF는 사용하지 않습니다") &&
        !body.includes("WACC"),
      "seller_valuation_level1_honest",
    );

    await login("test.buyera.sprint0@vericom.test");
    await page.goto("http://localhost:3000/consult?intent=buy", {
      waitUntil: "domcontentloaded",
    });
    body = await page.evaluate(() => document.body.innerText);
    mark(
      !body.includes("비교배수가 아직") &&
        !body.includes("기업가치 금액은 계산하지 않았습니다") &&
        !body.includes("Indicative EV"),
      "buyer_cannot_see_seller_financials",
    );
  } finally {
    await browser.close();
  }

  for (const line of notes) console.log(line);
  if (notes.some((line) => line.startsWith("FAIL"))) process.exit(1);
}

main().catch((error) => {
  console.log("FAIL SCRIPT", error instanceof Error ? error.message : "unknown");
  process.exit(1);
});
