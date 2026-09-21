import { dict, type Lang } from "@/lib/i18n";
import { signOutAction } from "@/lib/session-actions";
import { Button } from "@/components/ui/button";

/** Same server action as the header menu: cookies cleared, home, "Signed out" notice. */
export function SignOutButton({ lang }: { lang: Lang }) {
  return (
    <form action={signOutAction}>
      <Button type="submit" variant="ghost">{dict.account.signOut[lang]}</Button>
    </form>
  );
}
