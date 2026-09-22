"use client";
import { Component, type ReactNode } from "react";

/**
 * A homepage section that fails renders NOTHING, and the page carries on.
 *
 * The site-wide rule is that content throws (lib/hub-api.ts) — a blank FAQ is
 * a lie about the FAQ, so /blog, /faq and /contact still let the error out and
 * Next keeps serving the last good render. The homepage is the one page where
 * that rule needs a qualifier: it is a shop window made of independent
 * sections, and testimonials being unreachable is not a reason nobody can see
 * the collections.
 *
 * So the boundary is HERE, per section, and not in the fetch. The read still
 * throws; this decides what that means for this one strip of the page.
 * Deliberately not a fallback UI: a section with nothing to show should take
 * up no room, not apologise.
 *
 * A class component because that is still the only way to catch a render
 * error in React.
 */
export class SectionBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? null : this.props.children; }
}
