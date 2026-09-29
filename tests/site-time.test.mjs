// Customer-facing dates are Japan time (lib/site-time.ts). Found in the owner's
// draft-mode acceptance test (2026-09-30): a deadline of 01:59 JST on 3 Oct
// showed on the order page as "2 Oct 2026, 16:59" — the server's UTC clock,
// unlabelled — while the email said "Sat 3 October 2026 at 01:59 JST".
// Run: npm run test:unit.
import { test } from "node:test";
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import { join } from "node:path";
import { readFileSync } from "node:fs";

const { formatDeadline, formatSiteDate, siteDay } = await import(pathToFileURL(join(process.cwd(), "lib/site-time.ts")).href);

// The deadline from the test order CJ-W-900052.
const DUE = "2026-10-02T16:59:00+00:00";

test("a deadline is Japan time with the zone named, whatever the server's zone", () => {
  assert.equal(formatDeadline(DUE, "en"), "3 Oct 2026, 01:59 JST");
  assert.match(formatDeadline(DUE, "ja"), /^2026\/10\/03 1:59（日本時間）$/);
});

test("a timestamp's day is the Japan day", () => {
  // 00:58 JST on 30 Sep is still 29 Sep in UTC.
  assert.equal(siteDay("2026-09-29T15:58:00+00:00"), "2026-09-30");
  assert.equal(siteDay("2026-09-30"), "2026-09-30");
});

test("a date-only value keeps its day", () => {
  assert.equal(formatSiteDate("2026-10-15", "en"), "15 Oct 2026");
});

test("no customer page formats a date or time without the Japan zone", () => {
  for (const f of ["app/account/orders/[id]/page.tsx", "app/account/layaway/[id]/page.tsx", "app/checkout/complete/[order_id]/page.tsx"]) {
    const src = readFileSync(join(process.cwd(), f), "utf8");
    assert.doesNotMatch(src, /toLocale(Date|Time)?String\(/, `${f} formats a date itself; use lib/site-time.ts`);
  }
});
