import type { TextRun } from "@/lib/lumiere/text-runs";

export interface TextRunsProps {
  runs: readonly TextRun[];
}

/**
 * Renders a run-list where some runs are italic.
 *
 * The wordmark, headline and CTA all switch between Instrument Serif roman and
 * italic mid-word. The italics are purely typographic, so they use `span` —
 * `em`/`i` would assert an emphasis or change of voice that is not intended.
 */
export const TextRuns = ({ runs }: TextRunsProps) => (
  <>
    {runs.map((run, index) => (
      <span key={index} className={run.italic ? "italic" : undefined}>
        {run.text}
      </span>
    ))}
  </>
);
