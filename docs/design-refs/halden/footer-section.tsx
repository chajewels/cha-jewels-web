import Link from "next/link";

import { Inview } from "@/components/common/robot-inview";

import { NavItem } from "@/views/home/motion/nav-item";

import { Newsletter } from "./newsletter";
import { springWeight, springWeightSoft } from "@/lib/springs/config";
import { LetterReveal } from "@/views/home/motion/letter-reveal";
import { LineReveal } from "@/views/home/motion/line-reveal";

import { FOOTER_COLUMNS, FOOTER_LEGAL, FOOTER_SOCIAL } from "@/data/mocks/home";

/**
 * Block 6 — footer. Figma 2384:202 (1440×551).
 *
 * Newsletter lockup left, three link columns right, then legal / social over a
 * hairline and the letter-spaced HALDEN wordmark filling the base.
 */
export const FooterSection = () => {
  return (
    <footer
      className="relative h-[34.4375rem] w-full overflow-hidden bg-surface-accent text-foreground-on-accent at1024:h-[32.625rem] at768:h-[27.6875rem] at390:h-[37.6875rem]"
      data-header-accent
    >
      <div className="absolute left-[2rem] top-[2rem] flex w-[26.875rem] flex-col items-start gap-[2rem] at768:left-[1.5rem] at768:w-[21.5rem] at390:left-[1rem] at390:top-[1.5rem] at390:w-[22.375rem]">
        <h2 className="w-full font-serif text-headline font-normal leading-[1.0435] text-foreground-on-accent at768:text-[2.25rem] at390:text-[1.75rem]">
          {/* The comp breaks this sentence by hand, and it breaks it in a
              different place at 768 — no box width makes a natural wrap land
              on both, so each band gets its own copy and the other is removed
              from the document (and from the accessibility tree) outright. */}
          <span className="block at768:hidden at390:block">
            <LineReveal tag="span" from="left" className="block">
              Four emails a year,
            </LineReveal>
            <LineReveal tag="span" from="left" delay={110} className="block">
              and none of them are sales
            </LineReveal>
          </span>
          <span className="hidden at768:block at390:hidden">
            <LineReveal tag="span" from="left" className="block">
              Four emails a year, and
            </LineReveal>
            <LineReveal tag="span" from="left" delay={110} className="block">
              none of them are sales
            </LineReveal>
          </span>
        </h2>

        <Newsletter />
      </div>

      <nav
        aria-label="Footer"
        className="absolute left-[52.625rem] top-[2rem] flex items-center gap-[8rem] whitespace-nowrap font-serif leading-normal at1024:left-[42.5rem] at1024:w-[19.5rem] at1024:justify-between at1024:gap-0 at768:left-[27.75rem] at768:w-auto at768:justify-start at768:gap-[3rem] at390:left-[1rem] at390:top-[13.125rem] at390:gap-[3rem]"
      >
        {FOOTER_COLUMNS.map((column, index) => (
          <Inview
            tag="div"
            mode="once"
            delayIn={index * 110}
            from={{ opacity: 0, y: 20 }}
            to={{ opacity: 1, y: 0 }}
            config={springWeightSoft}
            key={column.heading}
            className="flex shrink-0 flex-col items-start gap-[0.875rem] at390:gap-[1.0625rem]"
          >
            <h3 className="shrink-0 text-label font-normal tracking-[0.08em] text-foreground-on-accent">
              {column.heading}
            </h3>
            <ul className="flex flex-col items-start gap-[0.875rem] at390:gap-[1.4375rem]">
              {column.links.map((link, linkIndex) => (
                <NavItem
                  key={link.label}
                  label={link.label}
                  href={link.href}
                  onAccent
                  delay={index * 110 + linkIndex * 50}
                  className="text-body text-foreground-on-accent"
                />
              ))}
            </ul>
          </Inview>
        ))}
      </nav>

      <Inview
        tag="div"
        aria-hidden
        mode="once"
        delayIn={340}
        from={{ scaleX: 0 }}
        to={{ scaleX: 1 }}
        config={springWeight}
        className="absolute left-[2rem] top-[17.25rem] h-px w-[86rem] origin-left bg-foreground-on-accent/35 at1024:w-[60rem] at768:left-[1.5rem] at768:top-[13.875rem] at768:w-[45rem] at390:left-[1rem] at390:top-[24.5rem] at390:w-[22.375rem]"
      />

      <Inview
        tag="div"
        mode="once"
        delayIn={420}
        from={{ opacity: 0, y: 14 }}
        to={{ opacity: 1, y: 0 }}
        config={springWeightSoft}
        className="absolute left-[2rem] top-[18.5625rem] flex flex-col items-start gap-[0.5rem] whitespace-pre font-serif text-label leading-normal text-foreground-on-accent at768:left-[1.5rem] at768:top-[15.9375rem] at768:gap-[0.3125rem] at390:left-[1rem] at390:top-[26.0625rem] at390:gap-[0.5rem] at390:w-[18.25rem] at390:whitespace-pre-wrap at390:text-caption"
      >
        {FOOTER_LEGAL.map((line, index) => (
          <p
            key={line}
            /* At 390 the comp reads address, contacts, wordmark, then the
               closing line — so the last line leaves this stack and is set
               again below the wordmark. */
            className={`shrink-0 ${
              index === FOOTER_LEGAL.length - 1 ? "at390:hidden" : ""
            }`}
          >
            {line}
          </p>
        ))}
      </Inview>

      <Inview
        tag="p"
        mode="once"
        delayIn={500}
        from={{ opacity: 0, y: 14 }}
        to={{ opacity: 1, y: 0 }}
        config={springWeightSoft}
        className="absolute left-[1rem] top-[35.625rem] hidden whitespace-pre font-serif text-caption leading-normal text-foreground-on-accent at390:block"
      >
        {FOOTER_LEGAL[FOOTER_LEGAL.length - 1]}
      </Inview>

      <Inview
        tag="p"
        mode="once"
        delayIn={470}
        from={{ opacity: 0, y: 14 }}
        to={{ opacity: 1, y: 0 }}
        config={springWeightSoft}
        className="absolute left-[75.8125rem] top-[18.5625rem] whitespace-pre font-serif text-label leading-normal text-foreground-on-accent at1024:left-[49.8125rem] at768:left-[35.1875rem] at768:top-[15.9375rem] at768:text-[0.8125rem] at390:left-[1rem] at390:top-[27.5rem] at390:text-caption"
      >
        {FOOTER_SOCIAL}
      </Inview>

      <span
        aria-hidden
        className="absolute left-[2rem] top-[23.8125rem] -mt-[0.1875rem] at768:left-[1.5rem] at768:top-[20.625rem] at390:left-[1rem] at390:top-[30.6875rem]"
      >
        <LetterReveal
          tag="span"
          className="whitespace-nowrap font-serif text-wordmark leading-[1.0204] tracking-[0.85em] text-foreground-on-accent at1024:text-[8.382rem] at768:text-[6.25rem] at390:text-[5rem] at390:tracking-[0.31em] [text-box-edge:cap_alphabetic] [text-box-trim:trim-both]"
        >
          HALDEN
        </LetterReveal>
      </span>
    </footer>
  );
};
