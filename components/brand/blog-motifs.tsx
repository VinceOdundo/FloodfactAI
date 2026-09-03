/**
 * Small line-art cover illustrations for the blog, one per post topic —
 * same crisp-hairline, no-gradient/no-blur language as
 * components/brand/ripple-motif.tsx, just content-scoped instead of a
 * full-bleed decorative mark. Purely decorative (aria-hidden); real
 * information lives in the post title/excerpt next to each one.
 */

type MotifProps = { className?: string };

const STROKE = "currentColor";

/** how-classification-works: nodes flowing left to right into a checkmark. */
export function PipelineMotif({ className }: MotifProps) {
  return (
    <svg viewBox="0 0 120 60" fill="none" className={className} aria-hidden="true">
      <g stroke={STROKE} strokeWidth="1.5">
        <line x1="14" y1="30" x2="94" y2="30" strokeDasharray="3 4" opacity="0.5" />
        <circle cx="14" cy="30" r="7" />
        <circle cx="46" cy="30" r="7" />
        <circle cx="78" cy="30" r="7" />
        <circle cx="106" cy="30" r="10" opacity="0.9" />
        <path d="M101 30 l4 4 8 -8" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

/** why-not-let-the-llm-decide: a shield with a fixed rule inside, not a dice/gear. */
export function ShieldMotif({ className }: MotifProps) {
  return (
    <svg viewBox="0 0 120 60" fill="none" className={className} aria-hidden="true">
      <g stroke={STROKE} strokeWidth="1.5" strokeLinejoin="round">
        <path d="M60 8 L84 16 V32 C84 46 74 52 60 56 C46 52 36 46 36 32 V16 Z" />
        <path d="M48 32 h24 M48 38 h16" strokeLinecap="round" opacity="0.85" />
      </g>
    </svg>
  );
}

/** flood-safety-basics: rising water lines beneath a simple rooftop. */
export function WaveMotif({ className }: MotifProps) {
  return (
    <svg viewBox="0 0 120 60" fill="none" className={className} aria-hidden="true">
      <g stroke={STROKE} strokeWidth="1.5">
        <path d="M42 14 L60 2 L78 14 V30 H42 Z" strokeLinejoin="round" opacity="0.85" />
        <path d="M14 40 q8 -7 16 0 t16 0 t16 0 t16 0 t16 0 t16 0" strokeLinecap="round" />
        <path d="M14 50 q8 -7 16 0 t16 0 t16 0 t16 0 t16 0 t16 0" strokeLinecap="round" opacity="0.5" />
      </g>
    </svg>
  );
}

/** understanding-the-three-labels: three stacked, distinctly-weighted badges. */
export function LabelsMotif({ className }: MotifProps) {
  return (
    <svg viewBox="0 0 120 60" fill="none" className={className} aria-hidden="true">
      <g strokeWidth="1.5" strokeLinecap="round">
        <rect x="20" y="10" width="80" height="12" rx="6" stroke={STROKE} fill="none" opacity="0.95" />
        <rect x="20" y="28" width="80" height="12" rx="6" stroke={STROKE} fill="none" opacity="0.6" />
        <rect x="20" y="46" width="56" height="12" rx="6" stroke={STROKE} fill="none" opacity="0.3" />
      </g>
    </svg>
  );
}

/** why-youth-ambassadors: three connected human nodes — the trust network. */
export function NetworkMotif({ className }: MotifProps) {
  return (
    <svg viewBox="0 0 120 60" fill="none" className={className} aria-hidden="true">
      <g stroke={STROKE} strokeWidth="1.5">
        <line x1="60" y1="18" x2="30" y2="42" />
        <line x1="60" y1="18" x2="90" y2="42" />
        <line x1="30" y1="42" x2="90" y2="42" opacity="0.4" />
        <circle cx="60" cy="14" r="7" />
        <circle cx="26" cy="44" r="7" />
        <circle cx="94" cy="44" r="7" />
      </g>
    </svg>
  );
}

/** sandbox-mode-and-what-a-partnership-unlocks: a lock opening onto a path forward. */
export function UnlockMotif({ className }: MotifProps) {
  return (
    <svg viewBox="0 0 120 60" fill="none" className={className} aria-hidden="true">
      <g stroke={STROKE} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="34" y="26" width="28" height="20" rx="3" />
        <path d="M40 26 v-6 a8 8 0 0 1 15 -3" opacity="0.85" />
        <circle cx="48" cy="36" r="2.5" fill={STROKE} stroke="none" />
        <path d="M72 36 h20 M92 36 l-5 -5 M92 36 l-5 5" opacity="0.6" />
      </g>
    </svg>
  );
}

const MOTIF_BY_SLUG: Record<string, (props: MotifProps) => React.JSX.Element> = {
  "how-classification-works": PipelineMotif,
  "why-not-let-the-llm-decide": ShieldMotif,
  "flood-safety-basics": WaveMotif,
  "understanding-the-three-labels": LabelsMotif,
  "why-youth-ambassadors": NetworkMotif,
  "sandbox-mode-and-what-a-partnership-unlocks": UnlockMotif,
};

export function BlogCoverArt({ slug, className }: { slug: string; className?: string }) {
  const Motif = MOTIF_BY_SLUG[slug] ?? PipelineMotif;
  return (
    <div className={className}>
      <Motif className="h-full w-full text-brand-500" />
    </div>
  );
}
