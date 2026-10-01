// 로그인 E2E용 테스트 계정 보장 스크립트 (Cloud/Linux).
// Supabase anon REST(signup / password grant)만 사용한다. service_role 불필요.
// 이 프로젝트는 가입 자동 확인(auto-confirm)이 켜져 있어 signup 즉시 세션이 생성된다 →
// seed 비밀번호(VERICOM_TEST_SEED_PASSWORD) 없이도 로그인 가능한 계정을 만들 수 있다.
//
// 사용:
//   node scripts/cloud-ensure-test-account.mjs
//   VERICOM_E2E_EMAIL=foo@vericom.test VERICOM_E2E_PASSWORD=... node scripts/cloud-ensure-test-account.mjs
//
// 출력(마지막 줄들, 파싱용):
//   E2E_EMAIL=<email>
//   E2E_PASSWORD=<password>
//   E2E_STATUS=<created|existing_login|email_confirmation_required|error>
import fs from "node:fs";
import path from "node:path";

function loadEnvLocal() {
  const p = path.join(process.cwd(), ".env.local");
  const env = {};
  if (!fs.existsSync(p)) return env;
  for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const i = line.indexOf("=");
    env[line.slice(0, i).trim()] = line
      .slice(i + 1)
      .trim()
      .replace(/^['"]|['"]$/g, "");
  }
  return env;
}

function env(key, fileEnv) {
  const v = process.env[key] ?? fileEnv[key];
  return typeof v === "string" ? v.trim() : "";
}

async function main() {
  const fileEnv = loadEnvLocal();
  const url = env("NEXT_PUBLIC_SUPABASE_URL", fileEnv);
  const anon = env("NEXT_PUBLIC_SUPABASE_ANON_KEY", fileEnv);
  if (!url || !anon) {
    console.log(
      "Missing Supabase env. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY " +
        "(Secrets panel) or run scripts/cloud-bootstrap-env.mjs first.",
    );
    console.log("E2E_STATUS=error");
    process.exit(1);
  }

  const email =
    env("VERICOM_E2E_EMAIL", fileEnv) || `cloud-e2e+${Date.now()}@vericom.test`;
  const password = env("VERICOM_E2E_PASSWORD", fileEnv) || "VericomE2E!2026";
  const displayName = env("VERICOM_E2E_NAME", fileEnv) || "클라우드 E2E";

  const base = url.replace(/\/+$/, "");
  const headers = {
    apikey: anon,
    Authorization: `Bearer ${anon}`,
    "Content-Type": "application/json",
  };

  async function signIn() {
    const res = await fetch(`${base}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers,
      body: JSON.stringify({ email, password }),
    });
    return { res, body: await res.json().catch(() => ({})) };
  }

  const signup = await fetch(`${base}/auth/v1/signup`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      email,
      password,
      data: { display_name: displayName },
    }),
  });
  const signupBody = await signup.json().catch(() => ({}));

  let status = "error";
  if (signup.ok && (signupBody.access_token || signupBody.session?.access_token)) {
    status = "created"; // auto-confirm → 즉시 세션
  } else if (signup.ok && !signupBody.access_token) {
    // 세션이 없으면 이메일 확인이 켜져 있거나(미지원) 이미 가입된 계정.
    const { res } = await signIn();
    status = res.ok ? "existing_login" : "email_confirmation_required";
  } else {
    const msg = (signupBody.msg || signupBody.error_description || "").toLowerCase();
    if (msg.includes("already") || signup.status === 422) {
      const { res } = await signIn();
      status = res.ok ? "existing_login" : "error";
    }
  }

  console.log(`Supabase: ${base}`);
  console.log(`E2E_EMAIL=${email}`);
  console.log(`E2E_PASSWORD=${password}`);
  console.log(`E2E_STATUS=${status}`);
  if (status === "email_confirmation_required") {
    console.log(
      "NOTE: 이 프로젝트 Supabase에서 이메일 확인이 켜져 있어 비밀번호 로그인 전 메일 인증이 필요합니다. " +
        "로그인 E2E를 위해 Auth 설정에서 자동 확인을 켜거나 seed 계정(VERICOM_TEST_SEED_PASSWORD)을 사용하세요.",
    );
  }
  process.exit(status === "error" ? 1 : 0);
}

main().catch((err) => {
  console.log(`E2E_STATUS=error`);
  console.error(err?.message || err);
  process.exit(1);
});
