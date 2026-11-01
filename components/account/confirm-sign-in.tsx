"use client";

import { useFormStatus } from "react-dom";
import { type Lang } from "@/lib/i18n-core";
import { trOf } from "@/lib/i18n-client";
import { account as accountDict } from "@/lib/i18n/sections/account";
import { confirmSignInAction } from "@/lib/auth-actions";
import { Button } from "@/components/ui/button";

/**
 * The one button on /auth/confirm. A form POST to a server action — not a
 * link, not an effect on mount — so nothing is exchanged until a person
 * presses it. See lib/auth-actions.ts for why.
 */
export function ConfirmSignIn({ tokenHash, type, next, lang }: { tokenHash: string; type: string; next: string; lang: Lang }) {
  return (
    <form action={confirmSignInAction} className="mt-0">
      <input type="hidden" name="token_hash" value={tokenHash} />
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="next" value={next} />
      <SubmitButton lang={lang} />
    </form>
  );
}

function SubmitButton({ lang }: { lang: Lang }) {
  const t = trOf({ account: accountDict }, lang);
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? t("account", "confirming") : t("account", "confirmBtn")}
    </Button>
  );
}
