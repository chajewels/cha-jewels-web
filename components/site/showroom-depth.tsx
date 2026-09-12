"use client";
import { useRef, type ReactNode } from "react";

/** Progressive enhancement: content is visible without JS; touch and reduced-motion stay still. */
export function ShowroomDepth({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  function reset() {
    ref.current?.style.removeProperty("--tilt-x");
    ref.current?.style.removeProperty("--tilt-y");
  }
  return <div className="showroom-stage" onPointerLeave={reset} onPointerCancel={reset} onPointerMove={(event) => {
    if (event.pointerType !== "mouse" || !window.matchMedia("(prefers-reduced-motion: no-preference) and (hover: hover)").matches) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    ref.current?.style.setProperty("--tilt-x", `${-((event.clientY - bounds.top) / bounds.height - 0.5) * 5}deg`);
    ref.current?.style.setProperty("--tilt-y", `${((event.clientX - bounds.left) / bounds.width - 0.5) * 5}deg`);
  }}><div ref={ref} className="showroom-depth">{children}</div></div>;
}
