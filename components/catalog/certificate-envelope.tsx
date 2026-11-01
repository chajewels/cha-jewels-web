import type { PieceCertificate } from "@/lib/certificate";

/**
 * THE ENVELOPE (Herbier Blanc's product reveal, docs/design-refs/herbier-blanc/:
 * a paper envelope whose flap opens as it scrolls into view to show the letter
 * inside) carrying THIS PIECE'S CERTIFICATE — and rendered only when the Hub's
 * product data carries one (lib/certificate.ts; today none does, so no product
 * page shows it). The letter lists exactly what the Hub sent: the kind, the
 * issuer and the number when present. Pure CSS: the flap turns on a view
 * timeline where the browser has one (at rest, open, where it does not);
 * reduced motion shows it open.
 */
export function CertificateEnvelope({ certificate, label, kindLabel, issuerLabel, numberLabel }: {
  certificate: PieceCertificate;
  /** The section's heading (a string from lib/i18n). */
  label: string;
  kindLabel: string;
  issuerLabel: string;
  numberLabel: string;
}) {
  const rows: [string, string][] = [[kindLabel, certificate.kind], ...(certificate.issuer ? [[issuerLabel, certificate.issuer] as [string, string]] : []), ...(certificate.number ? [[numberLabel, certificate.number] as [string, string]] : [])];
  return (
    <figure className="pdp-envelope" aria-label={label}>
      <div className="pdp-envelope__back" aria-hidden="true" />
      <div className="pdp-envelope__letter">
        <p className="pdp-envelope__title font-manrope">{label}</p>
        <dl>
          {rows.map(([k, v]) => (
            <div key={k}>
              <dt className="font-manrope">{k}</dt>
              <dd className="font-serif">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="pdp-envelope__front" aria-hidden="true" />
      <div className="pdp-envelope__flap" aria-hidden="true" />
    </figure>
  );
}
