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

    let body = await page.evaluate(() => document.body.innerText);
    if (!body.includes("기업가치 숫자는 아직 계산하지 않습니다")) {
      const input = await page.$("#tom-input");
      if (input) {
        await page.type("#tom-input", "매출은 100억이야.");
        await page.click('button[type="submit"]');
        await page.waitForFunction(
          () => document.body.innerText.includes("기업가치 숫자는 아직 계산하지 않습니다"),
          { timeout: 20000 },
        ).catch(() => null);
      }
    }
    body = await page.evaluate(() => document.body.innerText);
    mark(body.includes("기업가치 숫자는 아직 계산하지 않습니다"), "seller_financial_summary");
    mark(/매출\s+\d+억원/.test(body), "seller_revenue_label");
    mark(!/Enterprise Value|지분가치|Equity Value/.test(body), "no_invented_ev");

    await page.reload({ waitUntil: "domcontentloaded" });
    body = await page.evaluate(() => document.body.innerText);
    mark(body.includes("기업가치 숫자는 아직 계산하지 않습니다"), "refresh_keeps_summary");

    await login("test.buyera.sprint0@vericom.test");
    await page.goto("http://localhost:3000/consult?intent=buy", {
      waitUntil: "domcontentloaded",
    });
    body = await page.evaluate(() => document.body.innerText);
    mark(!body.includes("기업가치 숫자는 아직 계산하지 않습니다"), "buyer_cannot_see_seller_financials");
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
