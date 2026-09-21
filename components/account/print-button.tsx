"use client";
import { Button } from "@/components/ui/button";

/**
 * Prints the invoice, or saves it as a PDF — the browser's own dialog offers
 * both, which is why the label names both rather than promising a download
 * this page cannot produce on its own.
 *
 * `print-hide` keeps the button out of its own output.
 */
export function PrintButton({ label }: { label: string }) {
  return (
    <Button type="button" variant="outline" className="print-hide" onClick={() => window.print()}>
      {label}
    </Button>
  );
}
