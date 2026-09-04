/**
 * The actual logomark (also public/icon.svg, used for the favicon and PWA
 * install icon) — a water drop with a fixed checkmark inside it: flood +
 * fact-checked, the whole product in one mark. Inlined as a component
 * (rather than <img src="/icon.svg">) so it can sit directly next to the
 * wordmark at whatever size the header/footer/sidebar needs.
 */
export function Logomark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <rect width="100" height="100" rx="20" fill="#0c5a5e" />
      <path d="M50 20 C50 20 30 48 30 63 a20 20 0 0 0 40 0 C70 48 50 20 50 20 Z" fill="#ffffff" />
      <path d="M38 66 l8 8 16 -18" fill="none" stroke="#0c5a5e" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
