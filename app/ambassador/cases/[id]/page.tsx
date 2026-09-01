import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ClassificationBadge } from "@/components/classification-badge";
import { ConfirmFloodingForm } from "@/components/ambassador/confirm-flooding-form";
import { getCaseDetail } from "@/lib/data/queries/ambassador";

export default async function CaseDetailPage(props: PageProps<"/ambassador/cases/[id]">) {
  const { id } = await props.params;
  const report = await getCaseDetail(id);
  if (!report) notFound();

  return (
    <div className="space-y-4">
      <Link href="/ambassador" className="inline-flex items-center gap-1.5 text-xs text-foreground/50 hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to queue
      </Link>
      <div>
        <p className="text-xs text-foreground/50">{new Date(report.createdAt).toLocaleString()}</p>
        <p className="mt-1 text-lg leading-snug font-medium text-foreground">{report.rawText}</p>
        {report.claimedLocationText && <p className="mt-1 text-sm text-foreground/60">{report.claimedLocationText}</p>}
      </div>

      {report.classification && (
        <Card>
          <ClassificationBadge classification={report.classification.classification} />
          <p className="mt-2 text-sm">{report.classification.rationaleEn}</p>
        </Card>
      )}

      <Card>
        <ConfirmFloodingForm reportId={report.id} />
      </Card>
    </div>
  );
}
