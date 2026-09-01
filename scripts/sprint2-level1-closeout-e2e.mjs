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

  console.log("START closeout e2e");
  const browser = await puppeteer.launch({
    executablePath,
    headless: "new",
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  console.log("BROWSER up");
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
    await login("test.seller.sprint0@vericom.test");
    mark(page.url().includes("/seller"), "seller_workspace");
    await page.goto(`${BASE}/consult?intent=sell`, { waitUntil: "domcontentloaded" });
    const sellerConsult = await bodyText();
    if (sellerConsult.includes("EBITDA") || /매출/.test(sellerConsult)) {
      const input = await page.$("#tom-input");
      if (input) {
        await page.type("#tom-input", "EBITDA는 20억이야.", { delay: 5 });
        await page.click('button[type="submit"]');
        await page
          .waitForFunction(
            () => {
              const text = document.body.innerText;
              return (
                text.includes("20") ||
                text.includes("비교배수") ||
                text.includes("기업가치") ||
                text.includes("EBITDA")
              );
            },
            { timeout: 20000 },
          )
          .catch(() => null);
      }
    }
    mark(true, "seller_ebitda_claim_attempted");

    await login("test.expert.sprint0@vericom.test");
    mark(page.url().includes("/expert"), "expert_workspace");
    await page.goto(`${BASE}/expert/benchmarks`, { waitUntil: "domcontentloaded" });
    const expertPage = await bodyText();
    mark(
      expertPage.includes("E-BENCHMARK") && !expertPage.includes("배정된 Deal의 매각 회사가 없습니다"),
      "expert_has_assigned_seller",
    );

    const companyId = await page.evaluate(() => {
      const sel = document.getElementById("benchmark-company");
      if (!sel || !("options" in sel)) return "";
      const opt = [...sel.options].find((item) => item.value);
      return opt ? String(opt.value) : "";
    });
    mark(Boolean(companyId), "expert_assigned_company_option");
    if (companyId) {
      await page.select("#benchmark-company", companyId);
      await page.select("#benchmark-method", "EV_EBITDA");
      await page.click("#benchmark-base", { clickCount: 3 });
      await page.type("#benchmark-base", "8.1");
      await page.click("#benchmark-low", { clickCount: 3 });
      await page.type("#benchmark-low", "7.4");
      await page.click("#benchmark-high", { clickCount: 3 });
      await page.type("#benchmark-high", "8.8");
      await page.type("#benchmark-source", "내부 검토 LEVEL1 closeout");
      await page.select("#benchmark-source-type", "INTERNAL_REVIEW");
      await page.$eval("#benchmark-as-of", (el) => {
        el.value = "2026-09-01";
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
      });
      await page.select("#benchmark-confidence", "HIGH");
      await page.click('input[name="confirmed"]');
      await page.click('button[type="submit"]');
      await page
        .waitForFunction(
          () => {
            const text = document.body.innerText;
            return (
              text.includes("저장했습니다") ||
              text.includes("이미 같은 회사") ||
              text.includes("0017") ||
              text.includes("저장하지 못했습니다")
            );
          },
          { timeout: 25000 },
        )
        .catch(() => null);
    }
    const saveText = await bodyText();
    const saved =
      saveText.includes("승인된 EV/EBITDA 비교배수를 저장했습니다") ||
      saveText.includes("이미 같은 회사의 같은 평가방식");
    const needs0017 = saveText.includes("0017") || saveText.includes("아직 EV/EBITDA 평가방식을 허용하지 않습니다");
    mark(saved || needs0017, "expert_ev_ebitda_save_attempted");
    mark(saved, "expert_ev_ebitda_persisted_or_exists");
    mark(!needs0017, "remote_0017_method_check");

    await login("test.seller.sprint0@vericom.test");
    await page.goto(`${BASE}/seller/valuation`, { waitUntil: "domcontentloaded" });
    const valuation = await bodyText();
    mark(valuation.includes("LEVEL 1") && valuation.includes("EV / EBITDA"), "seller_level1_section");
    mark(valuation.includes("DCF는 사용하지 않습니다") && !valuation.includes("WACC"), "seller_level1_no_dcf");
    if (saved) {
      const missingBenchmark =
        valuation.includes("적용할 EV/EBITDA 비교배수가 아직 확정되지 않아");
      mark(!missingBenchmark, "seller_level1_no_missing_ebitda_benchmark");
      const calculable = valuation.includes("Indicative EV 계산됨");
      const waitingEbitda =
        valuation.includes("EBITDA가 없어 LEVEL 1") ||
        valuation.includes("재무정보 입력 필요");
      mark(calculable || waitingEbitda, "seller_level1_honest_after_approved_multiple");
    }

    await login("test.buyera.sprint0@vericom.test");
    await page.goto(`${BASE}/seller/valuation`, { waitUntil: "domcontentloaded" });
    mark(
      !page.url().includes("/seller/valuation") ||
        (await bodyText()).includes("권한이 없습니다") ||
        !(await bodyText()).includes("Indicative EV 계산됨"),
      "buyer_blocked_or_no_seller_ev",
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
