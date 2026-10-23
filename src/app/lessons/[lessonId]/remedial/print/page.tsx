import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PrintButton } from "@/components/print-button";
import { BoardView, PupilSheets, TeacherGuide } from "@/components/remedial-view";
import { LoadingBlock } from "@/components/ui";
import { getLatestMaterial } from "@/server/repositories/materials";
import { loadAssessmentResults, pupilGroups } from "@/server/repositories/results";

type View = "pupil" | "teacher" | "board";

async function RemedialPrint({
  params,
  searchParams,
}: {
  params: Promise<{ lessonId: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const { lessonId } = await params;
  const requested = (await searchParams).view;
  const view: View = requested === "teacher" || requested === "board" ? requested : "pupil";
  const [results, material] = await Promise.all([
    loadAssessmentResults(lessonId, "PRE"),
    getLatestMaterial(lessonId),
  ]);
  if (!results || !material) notFound();
  const groups = pupilGroups(results);

  return (
    <>
      <div className="flex items-center justify-between gap-3 print:hidden">
        <Link
          href={`/lessons/${lessonId}/remedial`}
          className="inline-flex items-center gap-1.5 text-muted hover:text-primary"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Quay lại
        </Link>
        {view !== "board" && <PrintButton label={view === "pupil" ? "In 3 phiếu" : "In bản GV"} />}
      </div>

      {view === "pupil" && (
        <PupilSheets
          content={material.content}
          groups={groups}
          lessonTitle={results.lesson.title}
          className={results.lesson.classroom.name}
        />
      )}
      {view === "teacher" && (
        <article className="rounded-2xl border border-line bg-surface p-6 print:rounded-none print:border-0 print:p-0">
          <h1 className="mb-4 text-xl font-bold">Hướng dẫn dạy bổ sung · {results.lesson.title}</h1>
          <TeacherGuide content={material.content} groups={groups} />
        </article>
      )}
      {view === "board" && (
        <article className="rounded-2xl bg-surface p-6 sm:p-10">
          <BoardView content={material.content} />
        </article>
      )}
    </>
  );
}

export default function RemedialPrintPage({
  params,
  searchParams,
}: PageProps<"/lessons/[lessonId]/remedial/print">) {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <RemedialPrint params={params} searchParams={searchParams as Promise<{ view?: string }>} />
    </Suspense>
  );
}
