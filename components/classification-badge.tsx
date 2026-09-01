import { cn } from "@/lib/utils";
import type { ClassificationLabel } from "@/lib/data/queries/admin";

const STYLES: Record<ClassificationLabel, { label: string; className: string }> = {
  verified_warning: { label: "Verified Warning", className: "bg-verified-bg text-verified" },
  elevated_risk: { label: "Elevated Risk", className: "bg-elevated-bg text-elevated" },
  false_information: { label: "False Information", className: "bg-false-info-bg text-false-info" },
};

export function ClassificationBadge({ classification, className }: { classification: ClassificationLabel; className?: string }) {
  const style = STYLES[classification];
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", style.className, className)}>
      {style.label}
    </span>
  );
}
