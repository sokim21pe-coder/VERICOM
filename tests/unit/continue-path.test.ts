import assert from "node:assert/strict";
import test from "node:test";
import {
  intendedNextPath,
  resolveContinuePath,
  resolveOnboardedContinuePath,
} from "@/lib/auth/continue-path";
import {
  authQuery,
  loginHrefForWorkspace,
  safeNextPath,
  startFlowHref,
  startOnboardingHref,
} from "@/lib/tom/paths";
import { afterAuthHref } from "@/lib/auth/client-continue";

test("landing sell/buy start goes through /start with intent", () => {
  assert.equal(startFlowHref("sell"), "/start?intent=sell");
  assert.equal(startFlowHref("buy"), "/start?intent=buy");
  assert.equal(startOnboardingHref("sell", false), "/start?intent=sell");
  assert.equal(startOnboardingHref("buy", true), "/start?intent=buy");
});

test("login query keeps relative next and intent", () => {
  const query = authQuery("/consult?intent=sell", "sell");
  assert.equal(query, "?next=%2Fconsult%3Fintent%3Dsell&intent=sell");
});

test("safeNextPath allows consult and workspace, rejects open redirects", () => {
  assert.equal(safeNextPath("/consult?intent=sell"), "/consult?intent=sell");
  assert.equal(safeNextPath("/seller"), "/seller");
  assert.equal(safeNextPath("/buyer/criteria"), "/buyer/criteria");
  assert.equal(safeNextPath("/internal"), "/internal");
  assert.equal(safeNextPath("//evil.example"), null);
  assert.equal(safeNextPath("https://evil.example"), null);
  assert.equal(safeNextPath("/login"), null);
  assert.equal(safeNextPath("/start?intent=sell"), null);
});

test("intent without next continues to consult after onboarding", () => {
  assert.equal(intendedNextPath(null, "sell"), "/consult?intent=sell");
  const blocked = resolveContinuePath({
    next: "/consult?intent=buy",
    intent: "buy",
    onboardedPath: "/onboarding/company",
  });
  assert.equal(blocked.redirectTo, "/onboarding/company");
  assert.equal(blocked.pendingNext, "/consult?intent=buy");

  const ready = resolveContinuePath({
    next: "/consult?intent=sell",
    intent: "sell",
    onboardedPath: "/seller",
  });
  assert.equal(ready.redirectTo, "/consult?intent=sell");
  assert.equal(ready.pendingNext, null);
});

test("generic login without intent stays on workspace after onboarding", () => {
  const ready = resolveContinuePath({
    next: null,
    intent: null,
    onboardedPath: "/seller",
  });
  assert.equal(ready.redirectTo, "/seller");
  assert.equal(
    resolveOnboardedContinuePath("/onboarding/company", "/consult?intent=sell"),
    "/onboarding/company",
  );
  assert.equal(
    resolveOnboardedContinuePath("/seller", "/consult?intent=sell"),
    "/consult?intent=sell",
  );
});

test("unauthenticated workspace guard keeps return path", () => {
  assert.equal(
    loginHrefForWorkspace("seller"),
    "/login?next=%2Fseller&intent=sell",
  );
  assert.equal(
    loginHrefForWorkspace("buyer"),
    "/login?next=%2Fbuyer&intent=buy",
  );
});

test("after login fallback keeps consult next when redirect is missing", () => {
  assert.equal(
    afterAuthHref("/consult?intent=sell", "/consult?intent=sell", "sell"),
    "/consult?intent=sell",
  );
  assert.equal(
    afterAuthHref(undefined, "/consult?intent=buy", "buy"),
    "/login?next=%2Fconsult%3Fintent%3Dbuy&intent=buy",
  );
});
