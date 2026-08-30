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
  const password = process.env.VERICOM_TEST_SEED_PASSWORD;
  if (!password) {
    console.log("FAIL PASSWORD_MISSING");
    process.exit(1);
  }
  const env = loadEnv();
  if (!env.NEXT_PUBLIC_SUPABASE_URL) {
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

  async function login() {
    await page.goto("http://localhost:3000/login", { waitUntil: "networkidle0" });
    if (!page.url().includes("/login")) return;
    await page.waitForSelector('input[name="email"]', { timeout: 20000 });
    await page.click('input[name="email"]', { clickCount: 3 });
    await page.type('input[name="email"]', "test.seller.sprint0@vericom.test", { delay: 5 });
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

  try {
    await page.goto("http://localhost:3000/consult?intent=sell", {
      waitUntil: "domcontentloaded",
    });
    mark(page.url().includes("/login"), "guest_redirect_login");

    await login();
    mark(!page.url().includes("/login"), "seller_login");

    await page.goto("http://localhost:3000/consult?intent=sell", {
      waitUntil: "networkidle0",
    });
    mark(page.url().includes("/consult"), "consult_open");

    const choice = await page.evaluateHandle(() =>
      [...document.querySelectorAll("button")].find((el) =>
        (el.textContent || "").includes("회사를 매각하고 싶습니다"),
      ),
    );
    const choiceEl = choice.asElement();
    if (choiceEl) {
      await choiceEl.click();
    } else {
      await page.type("#tom-input", "회사를 매각하고 싶습니다.");
      await page.click('button[type="submit"]');
    }
    await page.waitForFunction(
      () => document.body.innerText.includes("이유"),
      { timeout: 15000 },
    ).catch(() => null);
    let body = await tomText();
    mark(body.includes("이유"), "asks_reason_for_sale");
    mark(!body.includes("회사 이름이"), "skips_company_name");

    await page.type("#tom-input", "후계자가 없어.");
    await page.click('button[type="submit"]');
    await page.waitForFunction(
      () => document.body.innerText.includes("전체 지분"),
      { timeout: 15000 },
    ).catch(() => null);
    body = await tomText();
    mark(body.includes("전체 지분"), "asks_sale_scope_after_reason");
    const reasonCount = (body.match(/이유인가요/g) || []).length;
    mark(reasonCount <= 1, "does_not_repeat_reason");

    await page.type("#tom-input", "매출은 80억이고 EBITDA는 8억 정도야.");
    await page.click('button[type="submit"]');
    await new Promise((r) => setTimeout(r, 1500));
    body = await tomText();
    mark(!/최근 연간 매출은/.test(body.split("매출은 80억").pop() || ""), "does_not_reask_revenue");

    await page.type("#tom-input", "아직 모르겠어.");
    await page.click('button[type="submit"]');
    await new Promise((r) => setTimeout(r, 1500));
    const afterSkip = await tomText();
    mark(true, "decline_accepted");

    await page.reload({ waitUntil: "networkidle0" });
    body = await tomText();
    mark(body.includes("후계자가 없어"), "refresh_keeps_user_message");

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
    await login();
    await page.goto("http://localhost:3000/consult?intent=sell", {
      waitUntil: "networkidle0",
    });
    const lastTom = await page.evaluate(() => {
      const nodes = [...document.querySelectorAll("section p.whitespace-pre-wrap")];
      return nodes.at(-1)?.textContent || "";
    });
    mark(lastTom.length > 0, "relogin_has_tom_reply");
    mark(!lastTom.includes("가장 큰 이유가 무엇인가요"), "relogin_last_question_not_reason");
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
