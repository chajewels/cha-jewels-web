import type { HubPaymentOption } from "@/lib/types";

/**
 * Why a payment method is greyed at checkout: the i18n key (section
 * "checkout") for the Hub's `reason`. The reason is always the Hub's — this
 * only picks the words. Cash on delivery (代金引換, Hub 2026-10-10) has its own
 * wording for each reason the Hub gives it: layaway, currency_not_yen, off,
 * address_not_jp, nothing_to_collect, over_cod_limit.
 */
export type MethodWhyKey =
  | "methodWhyLayaway" | "methodWhyCardYen" | "methodWhyPaidyYen" | "methodWhyPaidyJp"
  | "methodWhyNoAccount" | "methodWhyOff"
  | "methodWhyCodLayaway" | "methodWhyCodYen" | "methodWhyCodJp" | "methodWhyCodOff"
  | "methodWhyCodLimit" | "methodWhyCodNothing";

export function methodWhyKey(o: Pick<HubPaymentOption, "method" | "reason">): MethodWhyKey {
  const cod = o.method === "cod";
  if (o.reason === "layaway") return cod ? "methodWhyCodLayaway" : "methodWhyLayaway";
  if (o.reason === "currency_not_yen") return o.method === "card" ? "methodWhyCardYen" : cod ? "methodWhyCodYen" : "methodWhyPaidyYen";
  if (o.reason === "address_not_jp") return cod ? "methodWhyCodJp" : "methodWhyPaidyJp";
  if (o.reason === "no_account") return "methodWhyNoAccount";
  if (o.reason === "over_cod_limit") return "methodWhyCodLimit";
  if (o.reason === "nothing_to_collect") return "methodWhyCodNothing";
  return cod ? "methodWhyCodOff" : "methodWhyOff";
}
