import { cookies, headers } from "next/headers";
import type { Region } from "./utils";
export const REGION_COOKIE = "cj-region";
/** Region: explicit cookie first, then Vercel geo header, default JP. */
export async function getRegion(): Promise<Region> {
  const c = (await cookies()).get(REGION_COOKIE)?.value;
  if (c === "JP" || c === "PH") return c;
  const country = (await headers()).get("x-vercel-ip-country");
  return country === "PH" ? "PH" : "JP";
}
