import { dict, type Lang } from "@/lib/i18n";
import type { TransferMethod } from "@/lib/types";

/**
 * Transfer methods as LABELLED CARDS, not a text blob and not one welded
 * bank+wallet pair.
 *
 * Each method the Hub has switched on for this customer's region gets its own
 * card, in the order an admin set. The Hub stores every field separately, so the
 * page can say which number is the account and which is the branch — a customer
 * copying a blob into a banking app has to guess.
 *
 * ONE REGION ONLY. The Hub sends the methods for this order's region and no
 * others, so there is nothing to filter here: the other region's accounts are
 * not in the payload and cannot appear on the page by mistake.
 *
 * An EMPTY list means the Hub has no complete, active method for the region.
 * That renders the "not yet available" notice — never a placeholder account.
 */
export function TransferDetails({
  methods, lang, className,
}: {
  methods: TransferMethod[];
  lang: Lang;
  className?: string;
}) {
  const t = dict.transfer;

  if (methods.length === 0) {
    return (
      <div className={`border border-gold px-5 py-4 text-sm text-gold-pale ${className ?? ""}`}>
        {t.unavailable[lang]}
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className ?? ""}`}>
      {methods.map((method) => (
        <MethodCard key={method.id} method={method} lang={lang} />
      ))}

      {/* Fixed under every list, both regions: a sender name that does not match
          the order is the single most common reason a transfer cannot be
          matched. Said once at the end, not repeated on every card. */}
      <p className="border border-rule bg-velvet px-5 py-4 text-sm text-champagne/75">
        <span lang="ja">{t.nameNotice.ja}</span>
        <span className="text-champagne/55"> / {t.nameNotice.en}</span>
      </p>
    </div>
  );
}

function MethodCard({ method, lang }: { method: TransferMethod; lang: Lang }) {
  const t = dict.transfer;
  const label = lang === "ja" ? method.label_ja : method.label_en;
  const note = lang === "ja" ? method.note_ja : method.note_en;
  const { bank, wallet } = method;
  // GCash and Maya label their own fields; anything else is a generic wallet.
  const walletNumberLabel = method.method_type === "gcash" ? t.gcashNumber[lang]
    : method.method_type === "maya" ? t.mayaNumber[lang]
    : t.walletNumber[lang];
  const walletNameLabel = method.method_type === "gcash" ? t.gcashName[lang]
    : method.method_type === "maya" ? t.mayaName[lang]
    : t.walletName[lang];

  return (
    <section className="border border-gold p-6">
      <h2 className="font-display text-xl text-gold-pale">{label}</h2>

      {wallet && (
        <dl className="mt-4 space-y-1.5 text-sm">
          <Row k={walletNumberLabel} v={wallet.number} mono />
          {wallet.name && <Row k={walletNameLabel} v={wallet.name} />}
        </dl>
      )}

      {bank && (
        <dl className="mt-4 space-y-1.5 text-sm">
          <Row k={t.bankName[lang]} v={bank.name} />
          {bank.branch && <Row k={t.branch[lang]} v={bank.branch} />}
          {bank.account_type && <Row k={t.accountType[lang]} v={bank.account_type} />}
          {bank.account_number && <Row k={t.accountNumber[lang]} v={bank.account_number} mono />}
          {bank.account_holder && <Row k={t.accountHolder[lang]} v={bank.account_holder} />}
        </dl>
      )}

      {note && <p className="mt-4 whitespace-pre-line text-sm text-champagne/70">{note}</p>}
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
