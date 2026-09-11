import { dict, type Lang } from "@/lib/i18n";
import type { TransferInstructions } from "@/lib/types";

/**
 * Transfer details as a LABELLED LIST, not a text blob.
 *
 * The Hub stores each field separately, so the page can say which number is the
 * account and which is the branch — a customer copying a blob into a banking app
 * has to guess. Field order is fixed here, not in the data.
 *
 * PH shows GCash first: it is how most Philippine customers actually pay, and
 * burying it under a bank block costs them a scroll at the moment they are
 * trying to send money.
 *
 * `instructions === null` means the Hub has no complete method for this country.
 * That renders the "not yet available" notice — never a placeholder account.
 */
export function TransferDetails({
  instructions, lang, className,
}: {
  instructions: TransferInstructions | null;
  lang: Lang;
  className?: string;
}) {
  const t = dict.transfer;

  if (!instructions) {
    return (
      <div className={`border border-gold px-5 py-4 text-sm text-gold-pale ${className ?? ""}`}>
        {t.unavailable[lang]}
      </div>
    );
  }

  const { bank, gcash } = instructions;
  const label = lang === "ja" ? instructions.method_label_ja : instructions.method_label_en;
  const note = lang === "ja" ? instructions.note_ja : instructions.note_en;
  // Philippines leads with GCash; everywhere else the bank block is the method.
  const gcashFirst = instructions.country === "PH";

  const gcashBlock = gcash ? (
    <Block key="gcash" title={t.gcash[lang]}>
      <Row k={t.gcashNumber[lang]} v={gcash.number} mono />
      <Row k={t.gcashName[lang]} v={gcash.name} />
    </Block>
  ) : null;

  const bankBlock = bank ? (
    <Block key="bank" title={t.bank[lang]}>
      <Row k={t.bankName[lang]} v={bank.name} />
      {bank.branch && <Row k={t.branch[lang]} v={bank.branch} />}
      {bank.account_type && <Row k={t.accountType[lang]} v={bank.account_type} />}
      <Row k={t.accountNumber[lang]} v={bank.account_number} mono />
      <Row k={t.accountHolder[lang]} v={bank.account_holder} />
    </Block>
  ) : null;

  return (
    <div className={`border border-gold p-6 ${className ?? ""}`}>
      <h2 className="font-display text-xl text-gold-pale">{label}</h2>

      <div className="mt-4 space-y-6">
        {(gcashFirst ? [gcashBlock, bankBlock] : [bankBlock, gcashBlock]).filter(Boolean)}
      </div>

      {/* Fixed on every order, both countries: the single most common reason a
          transfer cannot be matched to an order is a different sender name. */}
      <p className="mt-6 border-t border-rule pt-4 text-sm text-champagne/75">
        <span lang="ja">{t.nameNotice.ja}</span>
        <span className="text-champagne/55"> / {t.nameNotice.en}</span>
      </p>

      {note && <p className="mt-3 whitespace-pre-line text-sm text-champagne/70">{note}</p>}
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="text-xs uppercase tracking-[0.14em] text-champagne/45">{title}</h3>
      <dl className="mt-2 space-y-1.5 text-sm">{children}</dl>
    </section>
  );
}

function Row({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex flex-wrap justify-between gap-x-6 gap-y-0.5 border-b border-rule pb-1.5">
      <dt className="text-champagne/55">{k}</dt>
      <dd className={`text-right text-champagne ${mono ? "font-mono" : ""}`}>{v}</dd>
    </div>
  );
}
