"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, TriangleAlert, BarChart3, Map as MapIcon, Database, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export const ADMIN_NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/escalations", label: "Escalations", icon: TriangleAlert },
  { href: "/admin/metrics", label: "Pilot Metrics", icon: BarChart3 },
  { href: "/admin/map", label: "GIS Map", icon: MapIcon },
  { href: "/admin/sources", label: "Data Sources", icon: Database },
  { href: "/admin/ambassadors", label: "Ambassadors", icon: Users },
];

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {ADMIN_NAV.map((item) => {
        const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
              active ? "bg-brand-800 text-cream" : "text-foreground/70 hover:bg-surface-muted hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
