import type { Lang } from "@/lib/i18n";
import { returnsArticles, SECONDHAND_PERMIT_NO } from "@/lib/content/legal";
import { faqSections } from "@/lib/content/faq";

/**
 * THE PRODUCT PAGE'S TRUST BLOCK, BY THE BUY BUTTON (step 2 build; comp
 * page-comps/product-collection, NOTES "Trust block"). Every sentence is
 * existing approved wording, READ FROM ITS SOURCE here rather than copied, so
 * a change to the FAQ or the Returns policy reaches this block too:
 *
 *   shipping   the FAQ answer to "Do you ship to the Philippines?", first
 *              paragraph, with its leading 「はい。」 / "Yes." dropped (D2-4)
 *   returns    the Returns policy's "Important Summary", its first and third
 *              sentences verbatim (D2-4), then a link to the full policy
 *   permit     the permit number the footer and /legal/tokusho print
 *
 * The authentication and payment rows are dictionary strings (trust.authValue
 * with home.valueQualityP; checkout.reserveExplain), read by the page.
 */
type Text = Record<Lang, string>;

function shippingText(): Text {
  for (const s of faqSections) for (const e of s.items) {
    if (e.q.en !== "Do you ship to the Philippines?") continue;
    const b = e.a[0];
    if (b?.kind === "p") return { ja: b.text.ja.replace(/^はい。/, ""), en: b.text.en.replace(/^Yes\.\s*/, "") };
  }
  return { ja: "", en: "" };
}

function returnsText(): Text {
  const list = returnsArticles[0]?.blocks.find((b) => b.kind === "list");
  if (!list || list.kind !== "list") return { ja: "", en: "" };
  return { ja: `${list.items.ja[0]}${list.items.ja[2]}`, en: `${list.items.en[0]} ${list.items.en[2]}` };
}

export const PRODUCT_TRUST = {
  shipping: shippingText(),
  returns: returnsText(),
  permit: {
    ja: `東京都公安委員会 第${SECONDHAND_PERMIT_NO}号`,
    en: `Tokyo Metropolitan Public Safety Commission No. ${SECONDHAND_PERMIT_NO}`,
  } satisfies Text,
};
