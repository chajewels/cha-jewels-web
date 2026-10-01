"use client";

import { useState, useTransition } from "react";
import { setCartRemindersAction } from "@/lib/cart-reminder-actions";
import { tr, type Lang } from "@/lib/i18n";
import { alertLight } from "@/lib/form-classes";

/**
 * The cart-reminder consent on /account (cart reminders, the Hub's
 * docs/CART-REMINDERS.md). A separate, unticked-by-default checkbox whose
 * label names Cha Jewels and says "promotional" — the Japanese anti-spam law opt-in.
 * The state shown is the Hub's (GET /me); a change is saved at once through
 * the Server Action, and the Hub records the wording version with it.
 *
 * The 22px box sits inside a 44px row so the whole line is the tap target.
 */
export function CartReminderToggle({ lang, optedIn }: { lang: Lang; optedIn: boolean }) {
  const t = tr(lang);
  const [checked, setChecked] = useState(optedIn);
  const [pending, start] = useTransition();
  const [note, setNote] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  function onChange(next: boolean) {
    const before = checked;
    setChecked(next);
    setNote(null);
    start(async () => {
      const res = await setCartRemindersAction(next, "account");
      if (res.ok) {
        setChecked(res.data.opted_in);
        setNote({ tone: "ok", text: t("cartReminders", res.data.opted_in ? "on" : "off") });
      } else {
        setChecked(before);
        setNote({ tone: "err", text: t("cartReminders", "failed") });
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm text-charcoal-deep">
        <input
          type="checkbox"
          checked={checked}
          disabled={pending}
          onChange={(e) => onChange(e.target.checked)}
          aria-describedby="cart-reminders-help"
          className="mt-0.5 h-[22px] w-[22px] shrink-0 rounded-sm border-charcoal/60 text-charcoal-deep focus:ring-2 focus:ring-gold-dark"
        />
        <span>
          {t("cartReminders", "label")}
          <span className="ml-2 text-xs text-charcoal/70">{pending ? t("cartReminders", "saving") : checked ? t("cartReminders", "stateOn") : t("cartReminders", "stateOff")}</span>
        </span>
      </label>
      <p id="cart-reminders-help" className="text-xs leading-relaxed text-charcoal/70">{t("cartReminders", "help")}</p>
      {note && (
        <p role="status" className={note.tone === "err" ? `rounded-sm px-3 py-2 text-sm ${alertLight}` : "text-sm text-charcoal-deep"}>{note.text}</p>
      )}
    </div>
  );
}
