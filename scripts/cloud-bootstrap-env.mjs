// Cloud Agent 부팅용 .env.local 부트스트랩.
// 주입된 Secret 환경변수(NEXT_PUBLIC_SUPABASE_URL 등)를 .env.local로 기록해
// dev 서버와 scripts/*-e2e.mjs(.env.local 직접 읽음)가 동일하게 Supabase에 연결되게 한다.
//
// 규칙:
// - 이미 유효한 .env.local 이 있으면 덮어쓰지 않는다(사용자 수동 설정 보호).
// - Secret이 하나도 없으면 아무것도 쓰지 않고 안내만 출력한다(비파괴).
// - Secret 값은 로그로 출력하지 않는다.
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const ENV_PATH = path.join(ROOT, ".env.local");

const KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "VERICOM_TEST_SEED_PASSWORD",
];

function hasConfiguredEnvLocal() {
  if (!fs.existsSync(ENV_PATH)) return false;
  const text = fs.readFileSync(ENV_PATH, "utf8");
  return /^\s*NEXT_PUBLIC_SUPABASE_URL\s*=\s*\S+/m.test(text);
}

function present(key) {
  const v = process.env[key];
  return typeof v === "string" && v.trim().length > 0;
}

if (hasConfiguredEnvLocal()) {
  console.log("[cloud-bootstrap-env] .env.local already configured — leaving as is.");
  process.exit(0);
}

const available = KEYS.filter(present);
if (!available.includes("NEXT_PUBLIC_SUPABASE_URL") || !available.includes("NEXT_PUBLIC_SUPABASE_ANON_KEY")) {
  console.log(
    "[cloud-bootstrap-env] Supabase secrets not found in env. " +
      "Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in the Cursor Secrets panel " +
      "to enable login E2E. Skipping .env.local creation.",
  );
  process.exit(0);
}

const lines = available.map((key) => `${key}=${process.env[key].trim()}`);
fs.writeFileSync(ENV_PATH, lines.join("\n") + "\n", { mode: 0o600 });
console.log(
  `[cloud-bootstrap-env] Wrote .env.local from secrets (${available.join(", ")}).`,
);
