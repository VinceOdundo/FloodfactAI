import type { SVGProps } from "react";
import { cn } from "@/lib/utils";

/**
 * FloodFact AI Logomark (100% bg-less / transparent background)
 *
 * Visual Motifs:
 *  1. Hydrodynamic Water Droplet: Represents the physical floodwaters & rainfall in Nairobi.
 *  2. Verified Checkmark: Bold white center mark representing fact-checking & truth vs. rumour.
 *  3. AI Early Warning Beacon & Radar Arc: Cyan pulse point representing real-time AI classification & telemetry.
 *
 * Pure SVG without any bounding rectangle, floating seamlessly on both light and dark surfaces.
 */
export function Logomark({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden="true"
      {...props}
    >
      <defs>
        <linearGradient id="ff-logo-grad" x1="20" y1="10" x2="80" y2="95" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#06B6D4" />
          <stop offset="45%" stopColor="#0D9488" />
          <stop offset="100%" stopColor="#0A474A" />
        </linearGradient>
        <linearGradient id="ff-logo-highlight" x1="24" y1="15" x2="48" y2="70" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Water Droplet Body (Transparent / bg-less) */}
      <path
        d="M50 8 C50 8 84 46 84 64 A34 34 0 0 1 16 64 C16 46 50 8 50 8 Z"
        fill="url(#ff-logo-grad)"
      />

      {/* Fluid Specular Highlight */}
      <path
        d="M50 14 C50 14 23 48 23 64 C23 72 26 80 32 86 C26 79 23 70 24 60 C25 46 43 23 50 14 Z"
        fill="url(#ff-logo-highlight)"
      />

      {/* Verified Fact Checkmark */}
      <path
        d="M34 62 L46 74 L69 45"
        stroke="#FFFFFF"
        strokeWidth="8.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* AI Radar Beacon & Pulse Arc */}
      <circle cx="69" cy="45" r="3.5" fill="#38BDF8" />
      <path
        d="M73 40 C76.5 43.5 78 48 78 53"
        fill="none"
        stroke="#67E8F9"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.85"
      />
    </svg>
  );
}

/**
 * Full FloodFact AI Brand Lockup (Logomark + Typography)
 */
export function BrandLogo({
  className,
  markClassName = "h-7 w-7",
  textClassName = "text-lg",
  variant = "default",
}: {
  className?: string;
  markClassName?: string;
  textClassName?: string;
  variant?: "default" | "light" | "dark";
}) {
  const isLight = variant === "light";
  return (
    <div className={cn("flex items-center gap-2 font-serif font-semibold tracking-tight", className)}>
      <Logomark className={markClassName} />
      <span className={cn(textClassName, isLight ? "text-cream" : "text-foreground")}>
        FloodFact{" "}
        <span className={isLight ? "text-sage" : "text-brand-600 font-sans text-xs uppercase tracking-widest font-bold ml-0.5"}>
          AI
        </span>
      </span>
    </div>
  );
}
