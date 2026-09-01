import assert from "node:assert/strict";
import test from "node:test";
import { MACRO_MA_PROCESS } from "@/lib/deal/macro-process";
import {
  getLandingJourneyPage,
  journeyProcessHref,
  landingJourneyHrefs,
} from "@/lib/landing/journey-pages";
import { serviceAuthHrefs } from "@/lib/landing/service-pages";
import { safeNextPath } from "@/lib/tom/paths";

test("all ten macro process cards have public explain pages", () => {
  assert.equal(MACRO_MA_PROCESS.length, 10);
  assert.equal(landingJourneyHrefs().length, 10);
  for (const step of MACRO_MA_PROCESS) {
    const href = journeyProcessHref(step.id);
    assert.ok(href.startsWith("/about/process/"));
    const slug = href.replace("/about/process/", "");
    const page = getLandingJourneyPage(slug);
    assert.ok(page, slug);
    assert.equal(page.title, step.label);
    assert.equal(safeNextPath(page.loginNext), page.loginNext);
    const auth = serviceAuthHrefs(page);
    assert.ok(auth.login.startsWith("/login"));
    assert.ok(auth.signup.startsWith("/signup"));
    assert.ok(auth.login.includes("next="));
    assert.ok(auth.signup.includes("next="));
    assert.equal(page.showStartCta, false);
  }
});

test("NDA and LOI pages stay honest that documents are not live", () => {
  const nda = getLandingJourneyPage("nda");
  const loi = getLandingJourneyPage("loi");
  assert.ok(nda && loi);
  assert.ok(nda.upcoming.join(" ").includes("준비"));
  assert.ok(loi.upcoming.join(" ").includes("준비"));
  assert.ok(nda.lead.includes("비밀유지"));
  assert.ok(loi.lead.includes("인수의향"));
});
