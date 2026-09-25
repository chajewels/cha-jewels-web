import type { Region } from "./utils";
/** The site prices in JPY. Every peso figure a customer sees is the Hub's own (a peso quote, `down_payment_php`, a peso checkout); nothing is converted here. */
export async function getRegion(): Promise<Region> { return "JP"; }
