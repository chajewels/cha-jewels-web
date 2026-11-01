// Scenario runner for tests/security-batch2.test.mjs. Each scenario runs in its
// own node process (the env decides module-level constants such as
// PREVIEW_FIXTURES), exercises the REAL server code with the network replaced,
// and prints one JSON line: { result, fetches }. Test-only.
const scenario = process.argv[2];
const root = "file://" + process.cwd() + "/";
const load = (p) => import(new URL(p, root).href);

globalThis.__sb2 = { headers: JSON.parse(process.env.SB2_HEADERS ?? "{}"), jwt: process.env.SB2_JWT || null, user: { email: "buyer@example.com", user_metadata: { full_name: "Buyer" } } };

/** Every outbound request, as the Hub would receive it. */
const fetches = [];
const routes = JSON.parse(process.env.SB2_ROUTES ?? "{}");
globalThis.fetch = async (input, init = {}) => {
  const url = String(input);
  const h = new Headers(init.headers ?? {});
  let body = init.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { /* text */ } }
  fetches.push({ url, method: init.method ?? "GET", headers: Object.fromEntries(h.entries()), body: typeof body === "string" || (body && typeof body === "object" && !(body instanceof FormData)) ? body : null });
  const path = url.replace(/^https?:\/\/[^/]+/, "").split("?")[0];
  const hit = routes[`${init.method ?? "GET"} ${path}`] ?? routes[path];
  const status = hit?.status ?? (hit ? 200 : 500);
  return new Response(JSON.stringify(hit?.body ?? { error: "unrouted" }), { status, headers: { "content-type": "application/json" } });
};

const out = {};
try {
  switch (scenario) {
    case "fixtures": {
      const { PREVIEW_FIXTURES } = await load("lib/fixtures-mode.ts");
      const { hub } = await load("lib/hub-api.ts");
      const { agreementStatus } = await load("lib/agreement-lookup.ts");
      out.flag = PREVIEW_FIXTURES;
      out.collections = await hub.collections().then((c) => ({ ok: true, n: c.length }), (e) => ({ ok: false, message: String(e?.message ?? e) }));
      out.agreement = await agreementStatus("8c1e2f3a-1111-4222-8333-944455556666");
      out.cardAgreement = await agreementStatus({ doc: "card", order: "8c1e2f3a-1111-4222-8333-944455556666" });
      const { pointsLineAction } = await load("lib/points-actions.ts");
      out.points = await pointsLineAction("v-1");
      break;
    }
    case "address": {
      const { saveAddressAction } = await load("lib/checkout-actions.ts");
      const fresh = { recipient_name: " Ana ", line1: " 1-2-3 Tateishi ", city: "Katsushika", postal_code: "124-0012", country: "jp", phone: "090" };
      const tampered = [{ id: "victim-id", line1: "<script>", is_default: true }, { id: "a1", line1: "CHANGED BY CLIENT", country: "XX" }];
      out.current = await saveAddressAction(fresh);
      out.legacy = await saveAddressAction(tampered, fresh);
      const before = fetches.length;
      out.longLine = await saveAddressAction({ ...fresh, line1: "x".repeat(301) });
      out.noLine = await saveAddressAction({ ...fresh, line1: "  " });
      out.wrongType = await saveAddressAction({ ...fresh, city: { $ne: 1 } });
      out.fetchesForRefused = fetches.length - before;
      out.anyCountry = await saveAddressAction({ ...fresh, country: "ATLANTIS" });
      break;
    }
    case "quote": {
      const { quoteAction } = await load("lib/checkout-actions.ts");
      const base = { ship_to_address_id: "a1", order_type: "SELF", mode: "full", term_months: 6, settlement_currency: "JPY", lang: "en" };
      out.badOrderType = await quoteAction({ ...base, order_type: "STAFF" });
      out.longGift = await quoteAction({ ...base, order_type: "GIFT", gift_note: "x".repeat(1001) });
      out.badCurrency = await quoteAction({ ...base, settlement_currency: "USD" });
      out.badMode = await quoteAction({ ...base, mode: "free" });
      out.fractionTerm = await quoteAction({ ...base, term_months: 6.5 });
      out.fetchesForRefused = fetches.length;
      out.noAddress = await quoteAction({ ...base, ship_to_address_id: "" });
      // A valid input passes validation and reaches the cart (empty here).
      out.valid = await quoteAction({ ...base, order_type: "GIFT", gift_note: "x".repeat(1000), recipient_name: "Mika" });
      break;
    }
    case "ip": {
      const { contactAction } = await load("app/actions/contact.ts");
      const { subscribeAction } = await load("app/actions/newsletter.ts");
      const { enrolInLoyaltyAction } = await load("lib/loyalty-actions.ts");
      const { POST: wholesale } = await load("app/api/wholesale/route.ts");
      const fd = (o) => { const f = new FormData(); for (const [k, v] of Object.entries(o)) f.set(k, v); return f; };
      out.contact = await contactAction("idle", fd({ full_name: "Ana", email: "ana@example.com", message: "Hello there, a question." }));
      out.newsletter = await subscribeAction("idle", fd({ email: "ana@example.com" }));
      out.loyalty = await enrolInLoyaltyAction("JP");
      const req = new Request("https://site.test/api/wholesale", { method: "POST", headers: { "content-type": "application/json", ...globalThis.__sb2.headers }, body: JSON.stringify({ name: "Ana", business: "Shop", email: "ana@example.com", market: "JP", volume: "TEST", lang: "en" }) });
      out.wholesale = (await wholesale(req)).status;
      break;
    }
    case "revalidate": {
      // REVALIDATE_SECRET comes from the env of this process; SB2_SENT is the header (absent when unset).
      const { POST } = await load("app/api/revalidate/route.ts");
      const errors = [];
      const orig = console.error;
      console.error = (...a) => { errors.push(a.map(String).join(" ")); };
      const send = async (sent) => {
        const h = { "content-type": "application/json" };
        if (sent !== undefined) h["x-revalidate-secret"] = sent;
        const res = await POST(new Request("https://site.test/api/revalidate", { method: "POST", headers: h, body: JSON.stringify({ tag: "content" }) }));
        return res.status;
      };
      const sent = JSON.parse(process.env.SB2_SENT ?? "[]");
      out.statuses = [];
      for (const s of sent) out.statuses.push(await send(s === null ? undefined : s));
      console.error = orig;
      out.errors = errors;
      out.revalidated = globalThis.__sb2.revalidated ?? [];
      break;
    }
    case "lang": {
      const { POST } = await load("app/api/lang/route.ts");
      const post = async (body) => {
        const res = await POST(new Request("https://site.test/api/lang", { method: "POST", headers: { "content-type": "application/json" }, body }));
        return { status: res.status, cookie: res.headers.get("set-cookie") };
      };
      out.notJson = await post("{not json");
      out.empty = await post("");
      out.nullBody = await post("null");
      out.array = await post("[]");
      out.badLang = await post(JSON.stringify({ lang: "fr" }));
      out.en = await post(JSON.stringify({ lang: "en" }));
      out.ja = await post(JSON.stringify({ lang: "ja" }));
      break;
    }
    default:
      throw new Error(`unknown scenario ${scenario}`);
  }
} catch (e) {
  out.threw = String(e?.stack ?? e);
}
process.stdout.write("\n@@SB2@@" + JSON.stringify({ result: out, fetches }) + "\n");
