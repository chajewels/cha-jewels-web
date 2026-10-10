"use client";

import Link from "next/link";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { tr, type Lang } from "@/lib/i18n";
import { paidyAbandonAction, paidyAuthorizedAction, paidyStartAction } from "@/lib/paidy-actions";
import { paidyStatus } from "@/lib/paidy";
import type { HubOrderPaidy, PaidyCheckoutPayload } from "@/lib/types";
import { paidy612Active } from "@/lib/paidy-widget";
import {
  afterAuthorized, closedOutcome, holdAfterFiling, holdAfterResend, holdBeforeResend, holdOnLoad, holdTick, parseHold, resendDue,
  PAIDY_POLL_MS, safeAction, startRefusal, type HoldReason, type PaidyHold,
} from "@/lib/paidy-flow";

/**
 * Paidy "ato-barai" on a confirmed order (Paidy Checkout, 2026-10-03).
 *
 * Paidy's own window does the whole thing — email, Japanese mobile number, SMS
 * code — and comes back with an authorisation. This component only (1) loads
 * Paidy's script, (2) opens that window with the payload the Hub built, and
 * (3) hands the resulting id to the server, where the Hub verifies it and
 * files it for a reviewer. No figure is computed or edited here: `checkout`
 * is passed to `launch()` exactly as the Hub sent it.
 *
 * Shown only when the Hub says `offered` — the Hub's paidy-rules decide (she
 * chose Paidy, a confirmed yen order with money due and nothing paid or
 * pending, a complete Japanese delivery address, her names, a Japanese mobile
 * and a Japanese billing address). While the Paidy window or its payment is
 * being processed the Hub hides every other option (owner rule 2026-10-04).
 *
 * PA15B (owner 2026-10-08 17:17 JST): she chooses where Paidy BILLS her from
 * her own Japanese address-book entries (the Hub lists them, default first,
 * and checks the choice again); the piece still goes to the order's delivery
 * address. Nothing is chosen for her silently.
 *
 * Reference: paidy.com/docs/en/paidycheckout.html — `Paidy.configure({api_key,
 * logo_url, closed})` returns a handler; `handler.launch(payload)`; `closed`
 * receives `{id, amount, currency, created_at, status}` with status
 * AUTHORIZED | REJECTED | CLOSED (the customer left the window).
 */
const PAIDY_SRC = "https://apps.paidy.com/";

// Paidy's reference documents the status in upper case; the live Checkout
// (test run 2026-10-03, pay_asDHekoAAEkAmsmA) sent "authorized" in lower case,
// so paidyStatus() compares case-insensitively. An exact compare dropped a real
// authorisation as "window closed".
type PaidyResult = { id: string; amount: number; currency: string; created_at: string; status: string };

type PaidyHandler = { launch: (payload: PaidyCheckoutPayload) => void };
type PaidyGlobal = { configure: (opts: { api_key: string; logo_url?: string; closed: (r: PaidyResult) => void }) => PaidyHandler };

declare global {
  interface Window { Paidy?: PaidyGlobal }
}

type State = "idle" | "starting" | "open" | "filing" | "rejected" | "error" | "uncertain" | "releasing";

// H3 (Paidy QC PR-B): a hold survives a reload of the page in the same tab.
// Its rules (reload, per tick, the one re-send of an approved id — L3/L6) are
// pure helpers in lib/paidy-flow.ts; this file only stores and acts on them.
const holdKey = (orderId: string) => `cj-paidy-hold:${orderId}`;
function readHold(orderId: string): PaidyHold | null {
  try {
    return parseHold(window.sessionStorage.getItem(holdKey(orderId)));
  } catch { return null; }
}
function writeHold(orderId: string, h: PaidyHold | null) {
  try {
    if (h) window.sessionStorage.setItem(holdKey(orderId), JSON.stringify(h));
    else window.sessionStorage.removeItem(holdKey(orderId));
  } catch { /* storage unavailable: the hold lasts while the page is open */ }
}

// M8: how long a server action may take before the button gives a calm answer.
const START_MS = 20_000;
const ABANDON_MS = 15_000;
const FILE_MS = 30_000;

export function PaidyPay({ orderId, paidy, logoUrl, lang, windowOpen = false }: { orderId: string; paidy: HubOrderPaidy; logoUrl: string; lang: Lang; windowOpen?: boolean }) {
  const t = tr(lang);
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [state, setState] = useState<State>("idle");
  const [code, setCode] = useState<string | null>(null);
  const [, start] = useTransition();
  const choices = paidy.billing_choices ?? [];
  const [billingId, setBillingId] = useState<string | null>(paidy.billing_address_id ?? choices[0]?.id ?? null);
  const [scriptFailed, setScriptFailed] = useState(false);
  const hold = useRef<PaidyHold | null>(null);
  // M-1: this page load's own id. A re-send that failed on THIS page load is
  // tried once more only from another one (a reload carries fresh
  // server-action ids); lib/paidy-flow.ts resendDue.
  const pageId = useRef<string>(`${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`).current;

  // H3: enter a hold — the button stays disabled until the Hub's answer.
  const enterHold = (h: PaidyHold) => {
    hold.current = h;
    writeHold(orderId, h);
    setState(h.reason);
    router.refresh();
  };
  const beginHold = (reason: HoldReason) => enterHold({ reason, since: Date.now(), saw: false });

  // L3 / M-1: hand an approved Paidy id the Hub never received to the Hub
  // again (idempotent there for a known id) — only when resendDue says so: one
  // poll interval after the failure, at most twice per approval, the second
  // only after a reload. Counted BEFORE the call, so a reload during it never
  // repeats it.
  const resend = (h: PaidyHold) => {
    if (!resendDue(h, Date.now(), pageId) || !h.paidyId) return;
    const sent = holdBeforeResend(h, Date.now(), pageId);
    hold.current = sent;
    writeHold(orderId, sent);
    const id = h.paidyId;
    start(async () => {
      const r = await safeAction(() => paidyAuthorizedAction(orderId, id), FILE_MS, (code) => ({ ok: false as const, code }));
      const next = holdAfterResend(sent, r.ok ? null : r.code, Date.now());
      if (hold.current === sent) {
        hold.current = next;
        writeHold(orderId, next);
        if (next.reason !== sent.reason) setState(next.reason);
      }
      router.refresh();
    });
  };

  // A hold from before a reload of this page carries on (L6: holdOnLoad).
  useEffect(() => {
    const h = readHold(orderId);
    const d = holdOnLoad(h, windowOpen, Date.now());
    if (d === "keep" && h) {
      hold.current = h;
      setState(h.reason);
    } else if (d === "drop") writeHold(orderId, null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  // While held: ask the Hub again every few seconds, and end the hold only
  // when the Hub has shown the window open and then ended it (nothing was
  // filed), or after the Hub's own window length (L6: holdTick). When the Hub
  // files the payment the page shows "being processed" and this component is
  // gone.
  useEffect(() => {
    const h = hold.current;
    if (!h || (state !== "uncertain" && state !== "releasing")) return;
    if (windowOpen && !h.saw) { h.saw = true; writeHold(orderId, h); }
    const release = () => { hold.current = null; writeHold(orderId, null); setState("idle"); };
    const act = () => {
      const cur = hold.current;
      if (!cur) return;
      const d = holdTick(cur, windowOpen, Date.now(), pageId);
      if (d === "resend") resend(cur);
      else if (d === "release") release();
      else router.refresh();
    };
    const first = holdTick(h, windowOpen, Date.now(), pageId);
    if (first === "release") { release(); return; }
    if (first === "resend") resend(h);
    const timer = setInterval(act, PAIDY_POLL_MS);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, windowOpen, orderId, router]);

  // P06 (2026-10-04): next/script fires onLoad only the first time the script
  // loads. After a client-side navigation back to this page the script is
  // already there and onLoad never fires again, so the button stayed disabled.
  // onReady (below) runs on every mount once loaded; this check covers the
  // same case if the script was injected by an earlier render.
  useEffect(() => {
    if (typeof window !== "undefined" && window.Paidy) setReady(true);
  }, []);

  // Follow-up 2026-10-04 (owner: while Paidy processes, no other way to pay):
  //   1. the Hub records the window BEFORE Paidy opens (paidyStartAction) —
  //      refused when another tab or payment is already in progress;
  //   2. every SDK call is guarded, so an exception never leaves the button
  //      stuck; a launch that throws ends the window on the Hub;
  //   3. Paidy's "closed" / "rejected" end the window so the other options
  //      come back; an AUTHORIZED result is filed;
  //   4. a filing whose outcome is unknown (network, server error) is NOT
  //      retried blindly: the page re-reads the order from the Hub, which
  //      keeps every option hidden while the authorisation is being recovered.
  const open = () => {
    const Paidy = window.Paidy;
    if (!Paidy) return;
    setState("starting");
    setCode(null);
    start(async () => {
      const started = await safeAction(() => paidyStartAction(orderId, choices.length > 0 ? billingId : null), START_MS, (code) => ({ ok: false as const, code }));
      if (!started.ok) {
        // M1 (2026-10-10): 409 payment_in_progress — something already holds
        // the order, possibly an approval Paidy reported that the Hub has not
        // filed yet — is the "being checked" hold, never an error under a
        // live button. L4: other start failures get the start's own words.
        const r = startRefusal(started.code);
        if (r.hold) { beginHold("uncertain"); return; }
        setCode(r.code);
        setState("error");
        if (r.code === "paidy_not_offered" || r.code === "billing_address_invalid") router.refresh();
        return;
      }
      const { attemptId, checkout } = started.data;
      // PA04 (2026-10-08): a rejected / closed window still names the payment
      // Paidy created for it — handed to the Hub so its hourly check can
      // verify with Paidy that nothing is held before the window ends.
      const endWindow = (reason: "closed" | "rejected" | "error", paidyPaymentId?: unknown) => {
        start(async () => {
          // Not fatal when it fails: the Hub ends the window by itself.
          await safeAction(() => paidyAbandonAction(orderId, attemptId, reason, paidyPaymentId), ABANDON_MS, (code) => ({ ok: false as const, code }));
          router.refresh();
        });
      };
      try {
        const handler = Paidy.configure({
          api_key: paidy.public_key,
          logo_url: logoUrl,
          closed: (result) => {
            // L6: the branch decision is closedOutcome (lib/paidy-flow.ts).
            //  - AUTHORIZED without an id: never end the window — the Hub
            //    recovers the authorisation from Paidy's own notification.
            //  - UNKNOWN (PA15A): never "closed" — the window is NOT ended
            //    (Paidy may still hold an authorisation); the Hub decides.
            const outcome = closedOutcome(paidyStatus(result?.status), !!result?.id);
            if (outcome === "hold") { beginHold("uncertain"); return; }
            if (outcome === "file") {
              setState("filing");
              start(async () => {
                const r = await safeAction(() => paidyAuthorizedAction(orderId, result.id), FILE_MS, (code) => ({ ok: false as const, code }));
                // Paidy holds money for her in every case but "filed": the
                // button never simply comes back (H3) — the Hub's answer decides.
                const failCode = r.ok ? null : r.code;
                const next = afterAuthorized(failCode);
                // L3: a filing the Hub never saw (network, timeout, failed,
                // signed_out) keeps the Paidy id for a later re-send.
                if (next === "uncertain" || next === "releasing") enterHold(holdAfterFiling(next, failCode, result.id, Date.now(), pageId));
                else if (next === "refresh") { setCode(failCode); setState("error"); router.refresh(); }
                else router.refresh();
              });
            } else if (outcome === "end_rejected") {
              setState("rejected");
              endWindow("rejected", result?.id);
            } else {
              setState("idle");
              endWindow("closed", result?.id);
            }
          },
        });
        if (!checkout) throw new Error("no checkout payload");
        setState("open");
        handler.launch(checkout);
      } catch {
        // Paidy could not be opened: nothing was approved, nothing recorded (L4).
        setCode("start_failed");
        setState("error");
        endWindow("error");
      }
    });
  };

  const busy = state === "starting" || state === "open" || state === "filing" || state === "uncertain" || state === "releasing";

  const held = state === "uncertain" || state === "releasing";
  // L5: the disabled button names the message that says why.
  const holdMsgId = `paidy-hold-${orderId}`;

  return (
    <>
    {/* Review fix 4: the "not completed — open Paidy again" notice lives here,
        so it never shows above a button that is held for the Hub's answer. */}
    {windowOpen && !held && (
      <div className="mb-5 border border-gold-dark bg-white p-4 sm:p-5" role="status" data-testid="paidy-window-open">
        <h3 className="font-display text-[17px] text-charcoal-deep">{t("paidy", "windowOpenTitle")}</h3>
        <p className="mt-1 text-sm text-charcoal/80">{t("paidy", "windowOpenBody")}</p>
      </div>
    )}
    <div className="mb-5 border border-gold-dark/60 bg-gold-pale/40 p-4 sm:p-5" data-testid="paidy-pay">
      <Script src={PAIDY_SRC} strategy="afterInteractive" charSet="utf-8" onLoad={() => setReady(true)} onReady={() => setReady(true)} onError={() => setScriptFailed(true)} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-[17px] text-charcoal-deep">{t("paidy", "label")}</p>
          <p className="mt-1 text-[13px] leading-relaxed text-charcoal/80">{t("paidy", paidy612Active() ? "lede612" : "lede")}</p>
        </div>
        <button
          type="button"
          onClick={open}
          disabled={!ready || busy || scriptFailed}
          aria-busy={state === "starting" || state === "filing" ? true : undefined}
          aria-describedby={held ? holdMsgId : undefined}
          className="inline-flex h-11 items-center justify-center bg-charcoal-deep px-5 text-[13px] font-medium uppercase tracking-[0.12em] text-white transition hover:bg-charcoal disabled:cursor-not-allowed disabled:opacity-50 [:lang(ja)_&]:normal-case [:lang(ja)_&]:tracking-[0.04em]"
        >
          {state === "filing" ? t("paidy", "filing") : t("paidy", "button")}
        </button>
      </div>
      {choices.length === 1 && (
        // S-L3: one address is shown, not offered as a choice.
        <div className="mt-4" data-testid="paidy-billing-single">
          <p className="text-xs uppercase tracking-[0.14em] text-charcoal/70 [:lang(ja)_&]:normal-case [:lang(ja)_&]:tracking-[0.04em]">{t("paidy", "billingTitle")}</p>
          <p className="mt-1 break-words text-[13px] text-charcoal-deep">{addressLine(choices[0])}</p>
          <p className="mt-1 text-[12px] leading-relaxed text-charcoal/70">{t("paidy", "billingHelp")}</p>
          <p className="mt-2 text-[12px]">
            <Link href="/account/addresses" className="text-gold-dark underline underline-offset-4 hover:text-charcoal-deep">{t("paidy", "billingAdd")}</Link>
          </p>
        </div>
      )}
      {choices.length > 1 && (
        <fieldset className="mt-4" data-testid="paidy-billing">
          <legend className="text-xs uppercase tracking-[0.14em] text-charcoal/70 [:lang(ja)_&]:normal-case [:lang(ja)_&]:tracking-[0.04em]">{t("paidy", "billingTitle")}</legend>
          <p className="mt-1 text-[12px] leading-relaxed text-charcoal/70">{t("paidy", "billingHelp")}</p>
          <div className="mt-2 space-y-2">
            {choices.map((c) => (
              <label key={c.id} className="flex cursor-pointer items-start gap-3 border border-hairline bg-white p-3 text-[13px] text-charcoal-deep has-[:checked]:border-gold-dark">
                <input
                  type="radio" name="paidy-billing" value={c.id} className="mt-1 accent-charcoal-deep"
                  checked={billingId === c.id} onChange={() => setBillingId(c.id)} disabled={busy}
                />
                <span className="min-w-0 break-words">
                  {addressLine(c)}
                  {c.is_default && <span className="ml-2 text-[11px] text-charcoal/60">({t("paidy", "billingDefault")})</span>}
                </span>
              </label>
            ))}
          </div>
          <p className="mt-2 text-[12px]">
            <Link href="/account/addresses" className="text-gold-dark underline underline-offset-4 hover:text-charcoal-deep">{t("paidy", "billingAdd")}</Link>
          </p>
        </fieldset>
      )}
      {paidy.test && <p className="mt-2 text-[12px] text-charcoal/60">{t("paidy", "testMode")}</p>}
      {scriptFailed && <p className="mt-3 text-sm text-red-700" role="alert">{t("paidy", "errScript")}</p>}
      {state === "rejected" && <p className="mt-3 text-sm text-red-700" role="alert">{t("paidy", "rejected")}</p>}
      {state === "error" && (
        <p className="mt-3 text-sm text-red-700" role="alert">
          {errorText(code, t)}
          {code === "signed_out" && (
            <>{" "}<Link href={`/login?next=${encodeURIComponent(`/account/orders/${orderId}`)}`} className="text-gold-dark underline underline-offset-4 hover:text-charcoal-deep">{t("paidy", "signInAgain")}</Link></>
          )}
        </p>
      )}
      {state === "uncertain" && <p id={holdMsgId} className="mt-3 text-sm text-charcoal/80" role="status">{t("paidy", "uncertain")}</p>}
      {state === "releasing" && <p id={holdMsgId} className="mt-3 text-sm text-charcoal/80" role="status">{t("paidy", "releasing")}</p>}
      <p className="mt-3 text-[12px] leading-relaxed text-charcoal/70">{t("paidy", "note")}</p>
    </div>
    </>
  );
}

function addressLine(c: { postal_code?: string | null; region?: string | null; city?: string | null; line1?: string | null; line2?: string | null }): string {
  return `${c.postal_code ? `〒${c.postal_code} ` : ""}${[c.region, c.city, c.line1, c.line2].filter(Boolean).join(" ")}`;
}

function errorText(code: string | null, t: ReturnType<typeof tr>): string {
  switch (code) {
    // L4: a start that failed — Paidy never opened, so nothing to "record".
    case "start_failed": return t("paidy", "errStartFailed");
    case "paidy_not_offered":
    case "not_ready_for_payment": return t("paidy", "errNotOffered");
    case "submission_pending":
    case "payment_in_progress": return t("paidy", "errPending");
    case "too_many_submissions": return t("paidy", "errTooMany");
    case "signed_out": return t("paidy", "errSignedOut");
    case "billing_address_invalid": return t("paidy", "errBillingInvalid");
    case "network":
    case "timeout": return t("paidy", "errNetwork");
    default: return t("paidy", "errFailed");
  }
}
