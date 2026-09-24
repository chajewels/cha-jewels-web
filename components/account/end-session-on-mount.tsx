"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { endSessionAction } from "@/lib/profile-actions";

/**
 * Signs the customer out once the already-registered notice is on screen, then
 * refreshes so the header stops showing her as signed in. She has a login but
 * no customer record until staff attach one; leaving her half signed in would
 * send every account page back to the profile step.
 *
 * A Server Action (a POST) rather than a GET route, so a link elsewhere cannot
 * sign anyone out. Runs once, even under Strict Mode's double effect.
 */
export function EndSessionOnMount() {
  const router = useRouter();
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    endSessionAction().then(() => router.refresh(), () => router.refresh());
  }, [router]);
  return null;
}
