"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileText, TriangleAlert, BarChart3, Map as MapIcon, Database, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export const ADMIN_NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/reports", label: "Reports", icon: FileText },
  { href: "/admin/escalations", label: "Escalations", icon: TriangleAlert, badge: "1" },
  { href: "/admin/metrics", label: "Pilot Metrics", icon: BarChart3 },
  { href: "/admin/map", label: "GIS Map", icon: MapIcon },
  { href: "/admin/sources", label: "Data Sources", icon: Database, live: true },
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
              "flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-medium transition-all duration-150",
              active
                ? "bg-brand-700 font-semibold text-cream shadow-2xs"
                : "text-foreground/70 hover:bg-surface-muted hover:text-foreground"
            )}
          >
            <div className="flex items-center gap-2.5">
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </div>
            {item.badge && (
              <span className={cn(
                "rounded-full px-1.5 py-0.5 text-2xs font-bold leading-none",
                active ? "bg-cream text-brand-800" : "bg-verified/15 text-verified"
              )}>
                {item.badge}
              </span>
            )}
            {item.live && !item.badge && (
              <span className="flex h-1.5 w-1.5 rounded-full bg-safe" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
