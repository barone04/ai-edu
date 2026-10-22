import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { LoadingBlock } from "@/components/ui";
import { PrintButton } from "@/components/print-button";
import { getLessonWithAssessment, toDraft } from "@/server/repositories/assessments";
import { OPTION_KEYS } from "@/server/stats";

// Pupil sheet: questions and options only, never the answer key or misconceptions.
async function QuizSheet({
  params,
  searchParams,
}: {
  params: Promise<{ lessonId: string }>;
  searchParams: Promise<{ phase?: string }>;
}) {
  const { lessonId } = await params;
  const phase = (await searchParams).phase === "POST" ? "POST" : "PRE";
  const lesson = await getLessonWithAssessment(lessonId, phase);
  const questions = lesson?.assessments[0]?.questions.map(toDraft) ?? [];
  if (!lesson || questions.length === 0) notFound();

  return (
    <>
      <div className="flex items-center justify-between gap-3 print:hidden">
        <Link href={`/lessons/${lesson.id}`} className="text-muted hover:text-primary">
          ← Quay lại
        </Link>
        <PrintButton />
      </div>
      <article className="rounded-2xl border border-line bg-surface p-6 print:rounded-none print:border-0 print:p-0">
        <header className="mb-6 flex flex-col gap-1">
          <p className="text-sm">
            Lớp {lesson.classroom.name} · {phase === "PRE" ? "Kiểm tra nhanh" : "Kiểm tra lại"}
          </p>
          <h1 className="text-xl font-bold">{lesson.title}</h1>
          <p className="mt-2">Mã học sinh: ...................</p>
        </header>
        <ol className="flex flex-col gap-6">
          {questions.map((question, index) => (
            <li key={question.id} className="break-inside-avoid">
              <p className="mb-2 font-semibold">
                Câu {index + 1}. {question.content}
              </p>
              <ul className="grid grid-cols-2 gap-x-6 gap-y-1 pl-4">
                {OPTION_KEYS.map((key) => (
                  <li key={key}>
                    {key}. {question.options[key]}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
        <p className="mt-8 text-sm">Em khoanh tròn vào chữ cái trước câu trả lời đúng.</p>
      </article>
    </>
  );
}

export default function QuizPrintPage({
  params,
  searchParams,
}: PageProps<"/lessons/[lessonId]/quiz/print">) {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <QuizSheet params={params} searchParams={searchParams as Promise<{ phase?: string }>} />
    </Suspense>
  );
}
