import { ArrowLeft, Check, ChevronRight, FileText, Target, Users } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProgressBar, STEP_META } from "@/components/lesson-steps";
import { ButtonLink, Card, DemoBadge, LoadingBlock } from "@/components/ui";
import { currentStep, lessonSteps } from "@/server/lesson-progress";
import { getLesson, progressInput } from "@/server/repositories/lessons";
import { DeleteLessonButton } from "./delete-lesson-button";

async function LessonOverview({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  const lesson = await getLesson(lessonId);
  if (!lesson) notFound();

  const steps = lessonSteps(progressInput(lesson));
  const next = currentStep(steps);

  return (
    <>
      <Link href="/" className="inline-flex items-center gap-1.5 self-start text-muted hover:text-primary">
        <ArrowLeft className="size-4" aria-hidden />
        Tiết học của tôi
      </Link>

      <Card className="flex flex-col gap-4">
        {lesson.classroom.isDemo && <DemoBadge />}
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold">{lesson.title}</h1>
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-canvas px-3 py-1">
              <Users className="size-4 text-muted" aria-hidden />
              Lớp {lesson.classroom.name} · {lesson.classroom.studentCount} học sinh
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-canvas px-3 py-1">
              <FileText className="size-4 text-muted" aria-hidden />
              {lesson.subject} · Khối {lesson.classroom.grade}
            </span>
          </div>
        </div>
        <p className="flex items-start gap-2 rounded-xl bg-primary-soft p-3">
          <Target className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
          <span>
            <span className="font-semibold">Mục tiêu: </span>
            {lesson.learningObjective}
          </span>
        </p>
        <ProgressBar steps={steps} />
      </Card>

      <ol className="flex flex-col gap-2">
        {steps.map((step, index) => {
          const { icon: Icon, description } = STEP_META[step.key];
          const isNext = step.key === next?.key;
          const content = (
            <>
              <span
                className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${
                  step.done
                    ? "bg-primary text-white"
                    : isNext
                      ? "bg-accent-soft text-accent"
                      : "bg-canvas text-muted"
                }`}
              >
                {step.done ? <Check className="size-5" aria-hidden /> : <Icon className="size-5" aria-hidden />}
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="font-semibold">
                  {index + 1}. {step.label}
                  {step.done && <span className="sr-only"> (đã xong)</span>}
                </span>
                <span className="text-sm text-muted">{description}</span>
              </span>
              {step.available && <ChevronRight className="size-5 shrink-0 text-muted" aria-hidden />}
            </>
          );
          const frame = `flex items-center gap-3 rounded-2xl border bg-surface p-3 ${
            isNext ? "border-accent" : "border-line"
          }`;
          return (
            <li key={step.key}>
              {step.available ? (
                <Link href={`/lessons/${lesson.id}/${step.key}`} className={`${frame} hover:border-primary`}>
                  {content}
                </Link>
              ) : (
                <div className={`${frame} opacity-60`}>{content}</div>
              )}
            </li>
          );
        })}
      </ol>

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
