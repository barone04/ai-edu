import { notFound } from "next/navigation";
import { Suspense } from "react";
import { StepHeader } from "@/components/step-header";
import { ButtonLink, Card, LoadingBlock } from "@/components/ui";
import { getLatestMaterial } from "@/server/repositories/materials";
import {
  loadAssessmentResults,
  pupilGroups,
  type ConfirmedDiagnosis,
} from "@/server/repositories/results";
import { RemedialWorkspace } from "./remedial-workspace";

async function Remedial({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  const [results, material] = await Promise.all([
    loadAssessmentResults(lessonId, "PRE"),
    getLatestMaterial(lessonId),
  ]);
  if (!results) notFound();
  const { lesson } = results;
  const confirmed = results.diagnosis?.confirmedMisconceptions as ConfirmedDiagnosis | undefined;

  if (!results.diagnosis?.teacherConfirmedAt || !confirmed) {
    return (
      <>
        <StepHeader lesson={lesson} step="remedial" title="Chữa lỗi" />
        <Card className="flex flex-col gap-3">
          <p>Hãy xem và xác nhận lỗi sai của học sinh trước.</p>
          <ButtonLink href={`/lessons/${lesson.id}/diagnosis`}>Đến bước xem lỗi sai</ButtonLink>
        </Card>
      </>
    );
  }

  return (
    <>
      <StepHeader lesson={lesson} step="remedial" title="Chữa lỗi" />
      <Card className="flex flex-col gap-2">
        <p className="font-semibold">Lỗi cần chữa</p>
        <ul className="flex list-disc flex-col gap-1 pl-5">
          {confirmed.items.map((item) => (
            <li key={item.misconception}>
              {item.misconception} <span className="text-sm text-muted">({item.count} lượt)</span>
            </li>
          ))}
        </ul>
        {confirmed.note && <p className="text-sm text-muted">Nhận xét: {confirmed.note}</p>}
      </Card>
      <RemedialWorkspace
        key={material?.id ?? "none"}
        lessonId={lesson.id}
        material={
          material && { id: material.id, content: material.content, fromAi: Boolean(material.aiModel) }
        }
        groups={pupilGroups(results)}
        next={{ href: `/lessons/${lesson.id}/follow-up`, label: "Tiếp tục: Kiểm tra lại" }}
      />
    </>
  );
}

export default function RemedialPage({ params }: PageProps<"/lessons/[lessonId]/remedial">) {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <Remedial params={params} />
    </Suspense>
  );
}
