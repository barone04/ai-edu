import { notFound } from "next/navigation";
import { StepHeader } from "@/components/step-header";
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
      <StepHeader lesson={lesson} step={phase === "PRE" ? "quiz" : "follow-up"} title={title} />
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
