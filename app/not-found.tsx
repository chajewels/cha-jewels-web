import Link from "next/link";
export default function NotFound() {
  return <section className="py-32"><div className="wrap"><h1 className="text-5xl">That piece is not here.</h1><p className="mt-4 text-champagne/75">It may have sold, or the link is old. <Link className="text-gold-pale underline" href="/">Back to the collections</Link>.</p></div></section>;
}
