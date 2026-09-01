/**
 * Decorative mark for dark hero sections: overlapping spheres, one carrying
 * concentric contour rings — a flood-depth contour map read as an abstract
 * emblem, in place of a generic globe/wireframe graphic. Purely decorative
 * (aria-hidden); never used to convey information.
 */
export function RippleMotif({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 520 520"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="rm-sphere" cx="38%" cy="32%" r="72%">
          <stop offset="0%" stopColor="var(--sage)" stopOpacity="0.55" />
          <stop offset="55%" stopColor="var(--brand-500)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--brand-800)" stopOpacity="0.15" />
        </radialGradient>
        <radialGradient id="rm-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--cream)" stopOpacity="0.18" />
          <stop offset="100%" stopColor="var(--cream)" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx="230" cy="220" r="190" fill="url(#rm-sphere)" />
      <circle cx="230" cy="220" r="190" fill="url(#rm-glow)" />

      {/* contour rings — flood-depth isolines, offset lower-right to overlap
          the sphere like the reference's wireframe/solid pairing */}
      <g stroke="var(--cream)" strokeWidth="1" fill="none">
        <circle cx="300" cy="330" r="150" opacity="0.5" />
        <circle cx="300" cy="330" r="118" opacity="0.4" />
        <circle cx="300" cy="330" r="86" opacity="0.32" />
        <circle cx="300" cy="330" r="54" opacity="0.24" strokeDasharray="2 5" />
      </g>

      <circle cx="300" cy="330" r="4" fill="var(--cream)" opacity="0.7" />
      <circle cx="120" cy="120" r="3" fill="var(--cream)" opacity="0.4" />
      <circle cx="420" cy="150" r="2.5" fill="var(--cream)" opacity="0.35" />
    </svg>
  );
}
