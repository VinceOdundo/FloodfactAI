import Image, { type StaticImageData } from "next/image";
import { CheckCircle2, ExternalLink } from "lucide-react";

import openMeteoLogo from "@/public/logos/open-meteo.png";
import esriLogo from "@/public/logos/esri.png";
import africasTalkingLogo from "@/public/logos/africas-talking.png";
import whatsappLogo from "@/public/logos/whatsapp.svg";
import claudeLogo from "@/public/logos/anthropic-claude.svg";
import voyageLogo from "@/public/logos/voyage-ai.svg";

interface Partner {
  name: string;
  category: string;
  role: string;
  status: string;
  href: string;
  logo: StaticImageData | string;
}

const PARTNERS: Partner[] = [
  {
    name: "Open‑Meteo",
    category: "Weather Intelligence",
    role: "Hyper-local rainfall & hourly forecast telemetry",
    status: "Live Integration",
    href: "https://open-meteo.com",
    logo: openMeteoLogo,
  },
  {
    name: "Esri ArcGIS",
    category: "Spatial Hydrology",
    role: "Living Atlas riverine flood hazard layers",
    status: "Live WRI Layer",
    href: "https://www.esri.com",
    logo: esriLogo,
  },
  {
    name: "Africa's Talking",
    category: "Telecom Gateway",
    role: "Sub-second SMS delivery across Kenyan networks",
    status: "Live Gateway",
    href: "https://africastalking.com",
    logo: africasTalkingLogo,
  },
  {
    name: "Meta WhatsApp",
    category: "Community Messaging",
    role: "Direct resident WhatsApp reporting channel",
    status: "Cloud API Ready",
    href: "https://business.whatsapp.com",
    logo: whatsappLogo,
  },
  {
    name: "Anthropic Claude",
    category: "AI Understanding",
    role: "Structured Swahili & Sheng message extraction",
    status: "Live Sonnet",
    href: "https://www.anthropic.com",
    logo: claudeLogo,
  },
  {
    name: "Voyage AI",
    category: "Vector Embeddings",
    role: "Semantic similarity search for viral rumor patterns",
    status: "Live Embeddings",
    href: "https://www.voyageai.com",
    logo: voyageLogo,
  },
];

export function PartnerLogos() {
  return (
    <div className="mx-auto mt-12 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {PARTNERS.map((p) => (
        <a
          key={p.name}
          href={p.href}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative flex flex-col justify-between rounded-2xl border border-border bg-surface p-5 shadow-xs transition-colors duration-150 hover:border-brand-500/60 hover:bg-surface-muted/30"
        >
          <div className="flex flex-col items-center text-center">
            <div className="absolute right-4 top-4">
              <ExternalLink className="h-4 w-4 text-foreground/30 transition-colors group-hover:text-brand-600" />
            </div>

            {/* Large centered logo showcase */}
            <div className="flex h-20 w-full items-center justify-center rounded-xl  p-3 shadow-2xs transition-transform duration-150 group-hover:scale-105">
              <Image
                src={p.logo}
                alt={`${p.name} logo`}
                className="max-h-14 w-auto max-w-[180px] object-contain"
              />
            </div>

            <p className="mt-4 text-sm leading-relaxed text-foreground/75">{p.role}</p>
          </div>

          <div className="mt-5 flex items-center justify-center gap-1.5 border-t border-border/60 pt-3 text-xs font-medium text-safe">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-safe" />
            <span>{p.status}</span>
          </div>
        </a>
      ))}
    </div>
  );
}
