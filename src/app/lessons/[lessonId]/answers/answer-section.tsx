import { notFound } from "next/navigation";
import { StepHeader } from "@/components/step-header";
import { ButtonLink, Card } from "@/components/ui";
import { getAnswerSheet } from "@/server/repositories/answers";
import type { OptionKey } from "@/server/stats";
import { AggregateEntry } from "./aggregate-entry";
import { IndividualEntry } from "./individual-entry";
import { ModeSwitch } from "./mode-switch";

type Props = {
  lessonId: string;
  phase: "PRE" | "POST";
  quizHref: string;
  next: { href: string; label: string };
};

// Shared by the first check (PRE) and the follow-up check (POST).
export async function AnswerSection({ lessonId, phase, quizHref, next }: Props) {
  const lesson = await getAnswerSheet(lessonId, phase);
  if (!lesson) notFound();
  const assessment = lesson.assessments[0];
  const step = phase === "PRE" ? "answers" : "follow-up";
  const title = phase === "PRE" ? "Nhập kết quả" : "Nhập kết quả kiểm tra lại";

  if (!assessment?.questionsApprovedAt || assessment.questions.length === 0) {
    return (
      <>
        <StepHeader lesson={lesson} step={step} title={title} />
        <Card className="flex flex-col gap-3">
          <p>Cần duyệt bộ câu hỏi trước khi nhập kết quả.</p>
          <ButtonLink href={quizHref}>Đến bước tạo bài</ButtonLink>
        </Card>
      </>
    );
  }

  const questions = assessment.questions.map((q) => ({ id: q.id, content: q.content }));
  const initialAnswers: Record<string, Record<string, OptionKey>> = {};
  const initialCounts: Record<string, Partial<Record<OptionKey, number>>> = {};
  for (const question of assessment.questions) {
    for (const response of question.responses) {
      (initialAnswers[response.studentId] ??= {})[question.id] = response.selectedOption;
    }
    for (const answer of question.aggregateAnswers) {
      (initialCounts[question.id] ??= {})[answer.option] = answer.count;
    }
  }
  const hasData = assessment.questions.some(
    (q) => q.responses.length > 0 || q.aggregateAnswers.length > 0,
  );

  return (
    <>
      <StepHeader lesson={lesson} step={step} title={title} />
      <ModeSwitch lessonId={lesson.id} phase={phase} mode={assessment.entryMode} hasData={hasData} />
      {assessment.entryMode === "INDIVIDUAL" ? (
        <IndividualEntry
          key={assessment.entryMode}
          lessonId={lesson.id}
          phase={phase}
          students={lesson.classroom.students}
          questions={questions}
          initialAnswers={initialAnswers}
        />
      ) : (
        <AggregateEntry
          key={assessment.entryMode}
          lessonId={lesson.id}
          phase={phase}
          classSize={lesson.classroom.studentCount}
          questions={questions}
          initialCounts={initialCounts}
        />
      )}
      <ButtonLink href={next.href}>{next.label}</ButtonLink>
    </>
  );
}
