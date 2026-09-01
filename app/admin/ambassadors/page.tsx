import { Card } from "@/components/ui/card";
import { listAmbassadors } from "@/lib/data/queries/admin";
import { cn } from "@/lib/utils";

const TRAINING_STYLES: Record<string, string> = {
  trained: "bg-safe/15 text-safe",
  in_progress: "bg-elevated-bg text-elevated",
  not_started: "bg-surface-muted text-foreground/50",
};

export default async function AmbassadorsPage() {
  const ambassadors = await listAmbassadors();

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold">Youth ambassadors</h1>
      <p className="mt-1 text-sm text-foreground/60">
        One trained ambassador serves hundreds of households — the human trust layer alongside the AI.
      </p>
      <div className="mt-6 space-y-2">
        {ambassadors.map((a) => (
          <Card key={a.id} className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{a.fullName}</p>
              <p className="text-xs text-foreground/40">{a.pilotAreaName}</p>
            </div>
            <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold uppercase", TRAINING_STYLES[a.trainingStatus])}>
              {a.trainingStatus.replace("_", " ")}
            </span>
          </Card>
        ))}
      </div>
    </div>
  );
}
