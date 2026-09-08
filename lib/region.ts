import type { Region } from "./utils";
/** The site prices in JPY only. Peso amounts are display conversions using the Hub's daily rate (see hub.fx). */
export async function getRegion(): Promise<Region> { return "JP"; }
