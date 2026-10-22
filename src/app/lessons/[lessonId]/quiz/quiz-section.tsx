import Link from "next/link";
import { notFound } from "next/navigation";
import { DemoBadge } from "@/components/ui";
import { getLessonWithAssessment, toDraft } from "@/server/repositories/assessments";
import { QuizWorkspace } from "./quiz-workspace";

type Props = {
  lessonId: string;
  phase: "PRE" | "POST";
  title: string;
  next: { href: string; label: string };
};

// Loads one assessment's questions and hands them to the client editor.
export async function QuizSection({ lessonId, phase, title, next }: Props) {
  const lesson = await getLessonWithAssessment(lessonId, phase);
  if (!lesson) notFound();

  const assessment = lesson.assessments[0];
  const questions = assessment?.questions ?? [];
  const hasAnswers = questions.some((q) => q._count.responses + q._count.aggregateAnswers > 0);
  // remount the editor whenever the stored questions or approval change
  const editorKey = `${questions.map((q) => q.id).join(",")}|${assessment?.questionsApprovedAt?.toISOString()}`;

  return (
    <>
      <div className="flex flex-col gap-2">
        {lesson.classroom.isDemo && <DemoBadge />}
        <Link href={`/lessons/${lesson.id}`} className="text-muted hover:text-primary">
          ← {lesson.title} · Lớp {lesson.classroom.name}
        </Link>
        <h1 className="text-2xl font-bold">{title}</h1>
      </div>
      <QuizWorkspace
        key={editorKey}
        lessonId={lesson.id}
        phase={phase}
        initialDrafts={questions.map(toDraft)}
        approved={Boolean(assessment?.questionsApprovedAt)}
        hasAnswers={hasAnswers}
        fromAi={questions.some((q) => q.aiModel)}
        printHref={`/lessons/${lesson.id}/quiz/print?phase=${phase}`}
        next={next}
      />
    </>
  );
}
