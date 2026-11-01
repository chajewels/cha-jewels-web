import type { Metadata } from "next";
import { localePath } from "@/lib/locale";
import Image from "next/image";
import Link from "next/link";
import { hub } from "@/lib/hub-api";
import { getLang } from "@/lib/i18n-server";
import { dict, tr } from "@/lib/i18n";
import { isOptimizableImage } from "@/lib/image-hosts";
import { follow } from "@/lib/settings";
import type { ReviewInvite } from "@/lib/reviews";
import { ReviewForm } from "@/components/site/review-form";
import { ReviewUsedOrThanks } from "@/components/site/review-done";
import { Eyebrow, MessengerCta } from "@/components/site/support-stage";
import { PageHead, PageSection } from "@/components/lumiere/page/page-head";

/**
 * noindex, nofollow: a personal, one-use link. It must never be crawled, and
 * nothing on it is for anyone but the one customer it was sent to.
 */
export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  return { title: dict.meta.review.title[lang], robots: { index: false, follow: false } };
}

/** Rendered per request: a link turns "used" the moment its review is sent. */
export const dynamic = "force-dynamic";

/**
 * THE REVIEW PAGE (/review/[token]; PR-R2).
 *
 * Reached only from the personal link staff copy from a completed Hub order
 * ("Copy review message") and send on Messenger. The token is the proof of
 * purchase, so there is no sign-in. The Hub says whether the link is usable;
 * this page never decides that itself.
 *
 * Laid out like /contact (the owner's rule: "form should match to the existing
 * format"): eyebrow, heading and lede, then a dark panel beside a white form
 * card from `lg`, stacked on a phone. The panel names the piece (with its photo
 * when staff linked the order to a website piece) and holds the one orange
 * action, Messenger, for anyone who would rather talk.
 *
 * A link that is used, expired or unknown gets its own plain answer and the
 * Messenger button, never the form. A Hub that cannot be reached says so and
 * offers a retry, rather than pretending the link is bad.
 */
export default async function ReviewPage({ params }: { params: Promise<{ token: string }> }) {
  const [{ token }, lang] = await Promise.all([params, getLang()]);
  const t = tr(lang);

  let invite: ReviewInvite | null = null;
  try {
    invite = await hub.reviewInvite(token);
  } catch {
    invite = null;
  }
  const messenger = await follow().then((links) => links.find((l) => l.key === "messenger")?.href ?? null, () => null);

  if (!invite || invite.status !== "valid") {
    const [h, p] = !invite ? [t("reviews", "unavailableH"), t("reviews", "unavailableP")]
      : invite.status === "used" ? [t("reviews", "usedH"), t("reviews", "usedP")]
      : invite.status === "expired" ? [t("reviews", "expiredH"), t("reviews", "expiredP")]
      : [t("reviews", "notFoundH"), t("reviews", "notFoundP")];
    const actions = (
      <div className="flex flex-wrap items-center gap-4">
        {invite?.status !== "used" && messenger && <MessengerCta href={messenger} label={t("social", "messengerButton")} />}
        <Link href={localePath("/collections", lang)} className="iac-link">{t("reviews", "browse")} →</Link>
      </div>
    );
    if (invite?.status === "used") {
      // The sender's own browser gets the thank-you, not "already used"
      // (components/site/review-done.tsx says why; that component owns the h1).
      return (
        <section className="iac-shell iac-form text-charcoal">
          <div className="wrap iac-solo pt-[clamp(40px,6vw,88px)]">
            <Eyebrow rule>{t("reviews", "pageEyebrow")}</Eyebrow>
            <div className="iac-plate iac-sheet lm-rise mt-6 grid gap-5">
              <ReviewUsedOrThanks token={token} usedH={h} usedP={p} thanksH={t("reviews", "thanksH")} thanksP={t("reviews", "thanksP")} />
              {actions}
            </div>
          </div>
        </section>
      );
    }
    return (
      <div className="iac-shell">
        <PageHead eyebrow={t("reviews", "pageEyebrow")} title={h} lead={p} />
        <PageSection>{actions}</PageSection>
      </div>
    );
  }

  const name = invite.first_name?.trim() || null;
  const piece = invite.piece_name?.trim() || null;
  const image = invite.product?.image ?? null;

  return (
    <div className="iac-shell iac-form text-charcoal">
      <PageHead
        eyebrow={t("reviews", "pageEyebrow")}
        title={piece ? t("reviews", "ask", { piece }) : t("reviews", "askNoPiece")}
        lead={<>{name ? t("reviews", "hello", { name }) : t("reviews", "helloNoName")} {t("reviews", "lede")}</>}
      />
      <PageSection>
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-8">
          <div className="band-dark iac-ink lm-rise relative grid gap-4 p-6 text-chalk sm:p-[34px]">
            <div aria-hidden="true" className="cs-pool" />
            {image && (
              <div className="relative mx-auto aspect-square w-full max-w-[320px] overflow-hidden rounded-[20px] bg-chalk">
                {isOptimizableImage(image)
                  ? <Image src={image} alt={invite.product?.name ?? piece ?? ""} fill sizes="320px" className="object-contain" />
                  // eslint-disable-next-line @next/next/no-img-element
                  : <img src={image} alt={invite.product?.name ?? piece ?? ""} className="h-full w-full object-contain" />}
              </div>
            )}
            {piece && <p className="relative font-display text-[clamp(21px,2.2vw,28px)] leading-snug text-gold-pale [:lang(ja)_&]:text-[19px] [:lang(ja)_&]:leading-[1.6]">{piece}</p>}
            {invite.product && (
              <Link href={localePath(`/products/${invite.product.slug}`, lang)} className="relative inline-flex min-h-8 items-center text-sm text-gold-pale underline-offset-4 hover:underline">
                {invite.product.name} →
              </Link>
            )}
            {messenger && (
              <div className="relative mt-2 grid gap-3 border-t border-chalk/20 pt-5">
                <p className="text-sm text-chalk/80">{t("support", "contactLine")}</p>
                <MessengerCta href={messenger} label={t("social", "messengerButton")} className="w-full" />
              </div>
            )}
          </div>

          <div className="iac-plate lm-rise grid gap-5 p-[22px] sm:p-8">
            <ReviewForm token={token} lang={lang} />
          </div>
        </div>
      </PageSection>
    </div>
  );
}
