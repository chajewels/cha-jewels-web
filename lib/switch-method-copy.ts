import type { CheckoutMethod } from "@/lib/types";

/**
 * WEBSITE PAYMENT LIFECYCLE (task S3, 2026-10-05). "Pay another way" after a
 * rejected payment: the Hub decides whether she may switch and to what
 * (`can_switch_method`, `switch_methods`, POST /orders/:id/payment-method,
 * H6); this file only turns the Hub's refusal code into one of three lines.
 * Pure, so the server action, the client component and the tests share it.
 */
export type SwitchErrorKey = "switchInProgress" | "switchNotAllowed" | "switchFailed";

const NOT_ALLOWED = new Set(["not_rejected", "not_payable", "method_not_offered", "method_requires_yen", "unchanged", "already_switched"]);

export function switchErrorKey(code: string): SwitchErrorKey {
  if (code === "payment_in_progress") return "switchInProgress";
  if (NOT_ALLOWED.has(code)) return "switchNotAllowed";
  return "switchFailed";
}

const METHODS: readonly CheckoutMethod[] = ["transfer", "paidy", "card"];

/** Server-action arguments are untrusted: only the three checkout methods. */
export function isSwitchMethod(m: unknown): m is CheckoutMethod {
  return typeof m === "string" && (METHODS as readonly string[]).includes(m);
}
