import { GraduationCap, Clock, Circle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { listAmbassadors } from "@/lib/data/queries/admin";
import { cn } from "@/lib/utils";

const TRAINING_STYLES: Record<string, string> = {
  trained: "bg-safe/15 text-safe",
  in_progress: "bg-elevated-bg text-elevated",
  not_started: "bg-surface-muted text-foreground/50",
};

const TRAINING_ICON: Record<string, typeof GraduationCap> = {
  trained: GraduationCap,
  in_progress: Clock,
  not_started: Circle,
};

export default async function AmbassadorsPage() {
  const ambassadors = await listAmbassadors();
  const trainedCount = ambassadors.filter((a) => a.trainingStatus === "trained").length;

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold">Youth ambassadors</h1>
      <p className="mt-1 text-sm text-foreground/60">
        One trained ambassador serves hundreds of households — the human trust layer alongside the AI.
      </p>
      <p className="mt-3 text-sm font-medium text-foreground/70">
        {trainedCount} of {ambassadors.length} trained ·{" "}
        {ambassadors.length ? Math.round((trainedCount / ambassadors.length) * 100) : 0}%
      </p>
      <div className="mt-4 space-y-2">
        {ambassadors.map((a) => {
          const Icon = TRAINING_ICON[a.trainingStatus] ?? Circle;
          return (
            <Card key={a.id} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{a.fullName}</p>
                <p className="text-xs text-foreground/40">{a.pilotAreaName}</p>
              </div>
              <span className={cn("flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold uppercase", TRAINING_STYLES[a.trainingStatus])}>
                <Icon className="h-3.5 w-3.5" />
                {a.trainingStatus.replace("_", " ")}
              </span>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
