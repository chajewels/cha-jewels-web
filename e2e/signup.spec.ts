import { test, expect, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

/**
 * Storefront signup, end to end, against a REAL deployment and the LIVE Hub
 * (owner-approved 2026-09-24). Run by hand: `npm run e2e:signup`.
 *
 *   B (first)  a new login whose profile matches an existing customer
 *              (CJ-2026-00688 by full name) is sent to /already-registered,
 *              signed out, creates no customer, and leaves exactly one
 *              duplicate_signup_blocked notification for staff.
 *   A          a new login with a fresh profile creates a customer and lands
 *              on /account.
 *
 * HOW THE TEST SIGNS IN WITHOUT EMAIL. Users are created with the service role
 * (email already confirmed) and auth.admin.generateLink makes a magic link
 * without sending anything. The test opens the storefront's own
 * /auth/callback with that link's `hashed_token`:
 *
 *   /auth/callback?token_hash=<hashed_token>&type=magiclink&next=/account
 *
 * which is exactly the server-side-link path a customer's email takes
 * (verifyOtp, then hub.authCustomer, then the profile step). The link's
 * `action_link` is NOT used: an admin-generated link carries no PKCE
 * challenge, so GoTrue's verify endpoint would hand the session back in the
 * URL fragment, which a server route never sees. The token hash is verified by
 * the storefront's server against its own Supabase project, so no GoTrue
 * redirect (and no allow-list entry) is involved.
 *
 * Every run cleans up after itself in afterAll, even when a test fails, and
 * prints what it deleted and anything it could not.
 */

const SUPABASE_URL = process.env.E2E_SUPABASE_URL?.trim();
const SERVICE_ROLE_KEY = process.env.E2E_SUPABASE_SERVICE_ROLE_KEY?.trim();
const BASE_URL = (process.env.E2E_BASE_URL || "https://www.chajewelsjp.com").replace(/\/+$/, "");

const admin = SUPABASE_URL && SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } })
  : null;

const RUN_ID = Date.now();
// A minute of slack for the gap between this machine's clock and the
// database's. The notification is still pinned to this run by the email in
// its body, which no other run can produce.
const RUN_STARTED_AT = new Date(RUN_ID - 60_000).toISOString();

// RFC 2606 reserves `.test`: nothing is ever delivered there. GoTrue checks a
// domain only when it SENDS mail (its validator wraps the mail client), and
// createUser with email_confirm plus generateLink send none.
const EMAIL_DOMAIN = "cha-jewels-e2e.test";
const userA = { email: `e2e-signup-${RUN_ID}-a@${EMAIL_DOMAIN}`, id: null as string | null };
const userB = { email: `e2e-signup-${RUN_ID}-b@${EMAIL_DOMAIN}`, id: null as string | null };

const DUPLICATE_NAME = "Maria Ian Macua Overballe";
const DUPLICATE_CODE = "CJ-2026-00688";
const REGISTERED_COPY = "You are already registered. Please contact Cha Jewels for your account details.";

function requireAdmin() {
  if (!admin) {
    throw new Error("E2E_SUPABASE_URL and E2E_SUPABASE_SERVICE_ROLE_KEY must be set (see .env.e2e.example).");
  }
  return admin;
}

async function createTestUser(email: string): Promise<string> {
  const { data, error } = await requireAdmin().auth.admin.createUser({ email, email_confirm: true });
  if (error || !data.user) throw new Error(`createUser(${email}) failed: ${error?.message ?? "no user returned"}`);
  return data.user.id;
}

/** English copy, so the assertions can use the owner's English wording. */
async function useEnglish(page: Page) {
  await page.context().addCookies([{ name: "cj-lang", value: "en", url: BASE_URL }]);
}

/** Generates a magic link (no email sent) and completes it on the storefront. */
async function openSignInLink(page: Page, email: string) {
  const { data, error } = await requireAdmin().auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo: `${BASE_URL}/auth/callback` },
  });
  if (error || !data.properties?.hashed_token) throw new Error(`generateLink(${email}) failed: ${error?.message ?? "no hashed_token"}`);
  const q = new URLSearchParams({
    token_hash: data.properties.hashed_token,
    type: data.properties.verification_type ?? "magiclink",
    next: "/account",
  });
  await page.goto(`${BASE_URL}/auth/callback?${q}`);
}

/** The Supabase session cookies (`sb-<ref>-auth-token`, possibly chunked). */
async function authCookieNames(page: Page): Promise<string[]> {
  const cookies = await page.context().cookies(BASE_URL);
  return cookies.filter((c) => /^sb-.+-auth-token/.test(c.name) && c.value).map((c) => c.name);
}

/**
 * A clearly fake Danish-prefixed number ("+45 00 …") that the Hub's own
 * duplicate check says nobody holds. The same call also covers the typed name
 * and the email. find_customer_matches ignores is_test customers, so an
 * earlier run's leftovers never collide.
 */
async function pickUnusedMobile(fullName: string, email: string): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const candidate = `+45 00 ${String(RUN_ID + i).slice(-8)}`;
    const { data, error } = await requireAdmin().rpc("find_customer_matches", {
      p_full_name: fullName,
      p_mobile: candidate,
      p_email: email,
    });
    if (error) throw new Error(`find_customer_matches failed: ${error.message}`);
    const matches = (data ?? []) as Array<{ customer_code: string | null; matched_on: string[] }>;
    if (matches.length === 0) return candidate;
    if (matches.some((m) => !m.matched_on.every((k) => k === "mobile"))) {
      throw new Error(`Scenario A's name or email already matches a customer: ${JSON.stringify(matches)}`);
    }
  }
  throw new Error("No unused fake mobile number found after 5 tries.");
}

test.describe.configure({ mode: "serial" });

test.describe("storefront signup (live Hub)", () => {
  test.beforeAll(() => {
    requireAdmin();
    console.log(`[e2e] run ${RUN_ID} against ${BASE_URL}`);
    console.log(`[e2e] user A ${userA.email}`);
    console.log(`[e2e] user B ${userB.email}`);
  });

  test("B: a signup matching an existing customer is blocked", async ({ page }) => {
    const db = requireAdmin();
    userA.id = await createTestUser(userA.email);
    await useEnglish(page);
    await openSignInLink(page, userA.email);

    await expect(page).toHaveURL((u) => u.pathname === "/account/complete-profile");
    await expect(page.getByRole("heading", { level: 1, name: "Complete your profile" })).toBeVisible();
    expect(await authCookieNames(page)).not.toHaveLength(0);

    await page.locator('input[name="full_name"]').fill(DUPLICATE_NAME);
    await page.locator('select[name="location_type"]').selectOption("japan");
    await page.getByRole("button", { name: "Save and continue" }).click();

    await expect(page).toHaveURL((u) => u.pathname === "/already-registered");
    await expect(page.getByText(REGISTERED_COPY, { exact: true })).toBeVisible();
    // EndSessionOnMount signs her out; then a gated page sends her to /login.
    await expect.poll(() => authCookieNames(page)).toEqual([]);
    await page.goto(`${BASE_URL}/account`);
    await expect(page).toHaveURL((u) => u.pathname === "/login");

    const { data: customers, error: custErr } = await db.from("customers").select("id").ilike("email", userA.email);
    expect(custErr).toBeNull();
    expect(customers).toHaveLength(0);

    const { data: notes, error: noteErr } = await db
      .from("staff_notifications")
      .select("id, body, created_at")
      .eq("type", "duplicate_signup_blocked")
      .gte("created_at", RUN_STARTED_AT)
      .like("body", `%${userA.email}%`);
    expect(noteErr).toBeNull();
    expect(notes).toHaveLength(1);
    expect(notes![0].body).toContain(userA.email);
    expect(notes![0].body).toContain(DUPLICATE_CODE);
  });

  test("A: a new customer completes the profile and reaches /account", async ({ page }) => {
    const db = requireAdmin();
    const fullName = `E2E Test ${RUN_ID}`;
    const country = "Denmark";
    const mobile = await pickUnusedMobile(fullName, userB.email);
    console.log(`[e2e] scenario A mobile ${mobile}`);

    userB.id = await createTestUser(userB.email);
    await useEnglish(page);
    await openSignInLink(page, userB.email);

    await expect(page).toHaveURL((u) => u.pathname === "/account/complete-profile");
    await expect(page.getByRole("heading", { level: 1, name: "Complete your profile" })).toBeVisible();

    await page.locator('input[name="full_name"]').fill(fullName);
    await page.locator('select[name="location_type"]').selectOption("international");
    await page.locator('select[name="country"]').selectOption(country);
    await page.locator('input[name="mobile_number"]').fill(mobile);
    await page.getByRole("button", { name: "Save and continue" }).click();

    await expect(page).toHaveURL((u) => u.pathname === "/account");

    // Marked as test data FIRST, so a failed cleanup never reaches reports.
    const { data: rows, error } = await db
      .from("customers")
      .update({ is_test: true })
      .ilike("email", userB.email)
      .select("id, customer_code, full_name, email, location, mobile_number, auth_user_id, is_test");
    expect(error).toBeNull();
    expect(rows).toHaveLength(1);
    const row = rows![0];
    console.log(`[e2e] scenario A created ${row.customer_code ?? row.id} (is_test = ${row.is_test})`);
    expect(row.full_name).toBe(fullName);
    expect(row.email).toBe(userB.email);
    expect(row.location).toBe(country);
    expect(row.mobile_number).toBe(mobile);
    expect(row.auth_user_id).toBe(userB.id);
  });

  test.afterAll(async () => {
    if (!admin) return;
    const deleted: string[] = [];
    const leftBehind: string[] = [];

    // 1. Customers, by email. The website route does not enrol in loyalty, so
    //    nothing should hold a reference; if something does, say so and go on.
    for (const u of [userA, userB]) {
      const { data, error } = await admin.from("customers").delete().ilike("email", u.email).select("id, customer_code");
      if (error) {
        console.error(`[e2e cleanup] FAILED to delete customers for ${u.email}: ${error.message}`);
        leftBehind.push(`customers row(s) with email ${u.email} (${error.message})`);
      } else if (data.length) {
        deleted.push(`customers: ${data.map((r) => r.customer_code ?? r.id).join(", ")} (${u.email})`);
      }
    }

    // 2. This run's staff notifications.
    {
      const { data, error } = await admin
        .from("staff_notifications")
        .delete()
        .eq("type", "duplicate_signup_blocked")
        .like("body", `%${userA.email}%`)
        .select("id");
      if (error) {
        console.error(`[e2e cleanup] FAILED to delete staff_notifications for ${userA.email}: ${error.message}`);
        leftBehind.push(`staff_notifications (duplicate_signup_blocked) mentioning ${userA.email} (${error.message})`);
      } else if (data.length) {
        deleted.push(`staff_notifications: ${data.length} duplicate_signup_blocked row(s)`);
      }
    }

    // 3. Auth users, last, after anything that points at them.
    for (const u of [userA, userB]) {
      if (!u.id) continue;
      const { error } = await admin.auth.admin.deleteUser(u.id);
      if (error) {
        console.error(`[e2e cleanup] FAILED to delete auth user ${u.email}: ${error.message}`);
        leftBehind.push(`auth user ${u.email} / ${u.id} (${error.message})`);
      } else {
        deleted.push(`auth user: ${u.email}`);
      }
    }

    console.log("\n[e2e cleanup] summary");
    console.log(deleted.length ? deleted.map((d) => `  deleted  ${d}`).join("\n") : "  deleted  nothing");
    console.log(leftBehind.length ? leftBehind.map((l) => `  LEFT     ${l}`).join("\n") : "  left behind: nothing");
    if (leftBehind.length) throw new Error(`Cleanup left ${leftBehind.length} item(s) behind; see the summary above.`);
  });
});
