"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { dict, type Lang } from "@/lib/i18n";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function SignOutButton({ lang }: { lang: Lang }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant="ghost"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await supabaseBrowser().auth.signOut();
        // refresh() so middleware re-evaluates and clears the cached shell.
        router.replace("/");
        router.refresh();
      }}
    >
      {dict.account.signOut[lang]}
    </Button>
  );
}
