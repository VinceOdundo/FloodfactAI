/**
 * Larger section-scale illustrations, same crisp-hairline / no-gradient /
 * no-blur language as ripple-motif.tsx and blog-motifs.tsx — just built for
 * filling real space in a full-viewport section rather than a small corner
 * accent. Purely decorative (aria-hidden); the content next to each one
 * carries the actual information.
 */

type MotifProps = { className?: string };

/**
 * "The double emergency": a clean, single-frequency signal (verified) above
 * a jittery, multi-frequency one (rumour) — a real measurement-instrument
 * comparison, not an abstract squiggle. Reads on both light and dark
 * surfaces via currentColor.
 */
export function SignalMotif({ className }: MotifProps) {
  const clean = "M8 60 C 40 20, 72 100, 104 60 S 168 20, 200 60 S 264 100, 296 60 S 360 20, 392 60";
  const noisy =
    "M8 220 L 26 206 L 40 232 L 58 198 L 74 226 L 90 210 L 108 234 L 126 202 L 144 224 L 162 208 " +
    "L 180 230 L 198 200 L 216 226 L 234 210 L 252 232 L 270 204 L 288 224 L 306 210 L 324 230 " +
    "L 342 202 L 360 226 L 378 212 L 392 222";

  return (
    <svg viewBox="0 0 400 280" fill="none" className={className} aria-hidden="true">
      <g stroke="currentColor" strokeOpacity="0.25">
        <line x1="0" y1="60" x2="400" y2="60" strokeDasharray="1 6" />
        <line x1="0" y1="220" x2="400" y2="220" strokeDasharray="1 6" />
      </g>

      <path d={clean} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="392" cy="60" r="11" stroke="currentColor" strokeWidth="1.5" />
      <path d="M387 60 l3.5 3.5 7 -7.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      <text x="8" y="42" fontFamily="var(--font-mono)" fontSize="11" fill="currentColor" opacity="0.55" letterSpacing="0.5">
        VERIFIED SIGNAL
      </text>

      <path d={noisy} stroke="currentColor" strokeOpacity="0.55" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="392" cy="222" r="11" stroke="currentColor" strokeOpacity="0.55" strokeWidth="1.5" />
      <path d="M387 217 l10 10 M397 217 l-10 10" stroke="currentColor" strokeOpacity="0.55" strokeWidth="1.75" strokeLinecap="round" />
      <text x="8" y="202" fontFamily="var(--font-mono)" fontSize="11" fill="currentColor" opacity="0.45" letterSpacing="0.5">
        UNVERIFIED NOISE
      </text>
    </svg>
  );
}

/**
 * Elevation/flood-risk contour lines — a topographic reading, not a wave
 * doodle. Used as a full-bleed footer decoration on dark sections so a
 * full-viewport section still reads as considered, not stretched-out empty
 * space.
 */
export function ContourMotif({ className }: MotifProps) {
  const bands = [
    "M0 90 C 120 40, 260 140, 420 70 S 700 20, 900 80 S 1160 130, 1440 60",
    "M0 130 C 140 80, 280 170, 460 110 S 720 60, 940 120 S 1180 160, 1440 100",
    "M0 170 C 160 120, 300 200, 500 150 S 760 100, 960 160 S 1200 190, 1440 140",
  ];
  return (
    <svg viewBox="0 0 1440 220" fill="none" preserveAspectRatio="none" className={className} aria-hidden="true">
      {bands.map((d, i) => (
        <path key={d} d={d} stroke="currentColor" strokeWidth="1" opacity={0.5 - i * 0.14} />
      ))}
    </svg>
  );
}
