import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ButtonLink, Card, DemoBadge, LoadingBlock } from "@/components/ui";
import { currentStep, lessonSteps } from "@/server/lesson-progress";
import { getLesson } from "@/server/repositories/lessons";
import { DeleteLessonButton } from "./delete-lesson-button";

async function LessonOverview({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  const lesson = await getLesson(lessonId);
  if (!lesson) notFound();

  const pre = lesson.assessments.find((a) => a.phase === "PRE");
  const post = lesson.assessments.find((a) => a.phase === "POST");
  const hasAnswers = (assessment: typeof pre) =>
    assessment?.questions.some((q) => q._count.responses + q._count.aggregateAnswers > 0) ?? false;

  const steps = lessonSteps({
    preApproved: Boolean(pre?.questionsApprovedAt),
    preHasAnswers: hasAnswers(pre),
    diagnosisConfirmed: Boolean(pre?.diagnosis?.teacherConfirmedAt),
    hasMaterials: lesson._count.materials > 0,
    postHasAnswers: hasAnswers(post),
  });
  const next = currentStep(steps);

  return (
    <>
      <div className="flex flex-col gap-2">
        {lesson.classroom.isDemo && <DemoBadge />}
        <p className="text-muted">
          Lớp {lesson.classroom.name} · {lesson.classroom.studentCount} học sinh · {lesson.subject}
        </p>
        <h1 className="text-2xl font-bold">{lesson.title}</h1>
        <p>
          <span className="font-semibold">Mục tiêu: </span>
          {lesson.learningObjective}
        </p>
      </div>

      <Card>
        <ol className="flex flex-col gap-2">
          {steps.map((step, index) => {
            const badge = step.done ? "✓" : String(index + 1);
            const content = (
              <>
                <span
                  className={`flex size-9 shrink-0 items-center justify-center rounded-full font-bold ${
                    step.done ? "bg-primary text-white" : "bg-primary-soft text-primary"
                  }`}
                >
                  {badge}
                </span>
                <span className="font-semibold">{step.label}</span>
              </>
            );
            return (
              <li key={step.key}>
                {step.available ? (
                  <Link
                    href={`/lessons/${lesson.id}/${step.key}`}
                    className="flex min-h-12 items-center gap-3 rounded-xl px-2 hover:bg-canvas"
                  >
                    {content}
                  </Link>
                ) : (
                  <div className="flex min-h-12 items-center gap-3 px-2 opacity-50">{content}</div>
                )}
              </li>
            );
          })}
        </ol>
      </Card>

      {next ? (
        <ButtonLink href={`/lessons/${lesson.id}/${next.key}`}>Tiếp tục: {next.label}</ButtonLink>
      ) : (
        <ButtonLink href={`/lessons/${lesson.id}/report`}>Xem báo cáo trước/sau</ButtonLink>
      )}

      <div className="mt-4 border-t border-line pt-4">
        <DeleteLessonButton lessonId={lesson.id} />
      </div>
    </>
  );
}

export default function LessonPage({ params }: PageProps<"/lessons/[lessonId]">) {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <LessonOverview params={params} />
    </Suspense>
  );
}
