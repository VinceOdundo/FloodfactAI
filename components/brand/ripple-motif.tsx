/**
 * Decorative mark for dark hero sections: a detection instrument — range
 * rings, bearing ticks, and a fixed target — read as an early-warning
 * readout, not a generic globe/gradient graphic. Crisp hairline strokes
 * only: no blur, no glow, no gradient fill. Purely decorative (aria-hidden).
 */
export function RippleMotif({ className }: { className?: string }) {
  const ticks = Array.from({ length: 24 }, (_, i) => i * 15);

  return (
    <svg viewBox="0 0 400 400" fill="none" className={className} aria-hidden="true">
      <g stroke="var(--cream)" strokeWidth="1">
        <circle cx="200" cy="200" r="160" opacity="0.5" />
        <circle cx="200" cy="200" r="120" opacity="0.35" />
        <circle cx="200" cy="200" r="80" opacity="0.35" strokeDasharray="1 5" />
        <circle cx="200" cy="200" r="40" opacity="0.25" />
      </g>

      {/* bearing ticks around the outer ring — longer every 90°, matching a
          real instrument bezel rather than a decorative circle */}
      <g stroke="var(--cream)" opacity="0.55">
        {ticks.map((deg) => {
          const major = deg % 90 === 0;
          const r1 = 160;
          const r2 = major ? 172 : 166;
          const rad = (deg * Math.PI) / 180;
          const x1 = 200 + r1 * Math.sin(rad);
          const y1 = 200 - r1 * Math.cos(rad);
          const x2 = 200 + r2 * Math.sin(rad);
          const y2 = 200 - r2 * Math.cos(rad);
          return <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth={major ? 1.25 : 0.75} />;
        })}
      </g>

      {/* crosshair + label — a fixed contact, not a moving sweep */}
      <g stroke="var(--cream)" strokeWidth="1" opacity="0.8">
        <line x1="266" y1="118" x2="266" y2="134" />
        <line x1="258" y1="126" x2="274" y2="126" />
      </g>
      <circle cx="266" cy="126" r="3" fill="var(--cream)" opacity="0.85" />
      <text x="278" y="130" fontFamily="var(--font-mono)" fontSize="10" fill="var(--cream)" opacity="0.6" letterSpacing="0.5">
        VERIFIED
      </text>

      <g stroke="var(--cream)" strokeWidth="1" opacity="0.35">
        <line x1="200" y1="20" x2="200" y2="46" />
        <line x1="200" y1="354" x2="200" y2="380" />
        <line x1="20" y1="200" x2="46" y2="200" />
        <line x1="354" y1="200" x2="380" y2="200" />
      </g>
    </svg>
  );
}
