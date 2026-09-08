"use client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { Region } from "@/lib/utils";
export function RegionSwitcher({ region }: { region: Region }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  function set(r: Region) {
    start(async () => { await fetch("/api/region", { method: "POST", body: JSON.stringify({ region: r }) }); router.refresh(); });
  }
  return (
    <div role="group" aria-label="Shop region" className="flex overflow-hidden rounded-sm border border-rule text-xs">
      {(["JP", "PH"] as const).map((r) => (
        <button key={r} type="button" disabled={pending} aria-pressed={region === r} onClick={() => set(r)} className={`min-h-9 px-3 ${region === r ? "bg-gold text-ink" : "text-champagne/75"}`}>{r === "JP" ? "¥ Japan" : "₱ Philippines"}</button>
      ))}
    </div>
  );
}
