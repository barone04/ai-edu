import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AnswerDistribution } from "@/components/answer-distribution";
import { StepHeader } from "@/components/step-header";
import { ButtonLink, Card, LoadingBlock } from "@/components/ui";
import { loadAssessmentResults, type ConfirmedDiagnosis } from "@/server/repositories/results";
import { rankMisconceptions, type StudentGroup } from "@/server/stats";
import { DiagnosisReview } from "./diagnosis-review";

// misconceptions chosen by at least this share of answers are pre-selected for review
const PRESELECT_SHARE = 0.1;

async function Diagnosis({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  const results = await loadAssessmentResults(lessonId, "PRE");
  if (!results) notFound();
  const { lesson, questions, stats, studentCodes, diagnosis } = results;

  if (stats.totalAnswers === 0) {
    return (
      <>
        <StepHeader lesson={lesson} step="diagnosis" title="Xem lỗi sai" />
        <Card className="flex flex-col gap-3">
          <p>Chưa có kết quả nào. Hãy nhập đáp án của học sinh trước.</p>
          <ButtonLink href={`/lessons/${lesson.id}/answers`}>Đến bước nhập kết quả</ButtonLink>
        </Card>
      </>
    );
  }

  const ranked = rankMisconceptions(stats);
  const confirmed = diagnosis?.confirmedMisconceptions as ConfirmedDiagnosis | undefined;
  const overrides = (diagnosis?.groupOverrides ?? {}) as Record<string, StudentGroup>;
  const pupils = stats.students
    ? stats.students
        .map((s) => ({
          studentId: s.studentId,
          code: studentCodes.get(s.studentId) ?? "?",
          correct: s.correct,
          group: s.group,
        }))
        .sort((a, b) => a.code.localeCompare(b.code))
    : null;
  const pupilCount = stats.students?.length ?? Math.max(...stats.questions.map((q) => q.total));

  return (
    <>
      <StepHeader lesson={lesson} step="diagnosis" title="Xem lỗi sai" />

      <div className="grid grid-cols-3 gap-2">
        <Summary value={`${Math.round(stats.overallCorrectRate * 100)}%`} label="Câu trả lời đúng" />
        <Summary value={String(pupilCount)} label="Học sinh làm bài" />
        <Summary value={String(ranked.length)} label="Lỗi hiểu sai" />
      </div>
      {stats.mode === "AGGREGATE" && (
        <p className="rounded-xl bg-warn-soft p-3 text-sm text-warn">
          Kết quả nhập nhanh cả lớp: chỉ phân tích chung, không chia nhóm từng học sinh.
        </p>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">Học sinh chọn đáp án nào?</h2>
        {questions.map((question, index) => (
          <AnswerDistribution
            key={question.id}
            index={index}
            content={question.content}
            options={question.options}
            correctOption={question.correctOption}
            stats={stats.questions[index]}
          />
        ))}
      </section>

      <DiagnosisReview
        lessonId={lesson.id}
        questionCount={questions.length}
        misconceptions={ranked}
        pupils={pupils}
        initialSelected={
          confirmed
            ? confirmed.items.map((item) => item.misconception)
            : ranked.filter((m) => m.share >= PRESELECT_SHARE).map((m) => m.misconception)
        }
        initialNote={confirmed?.note ?? ""}
        initialOverrides={overrides}
      />
    </>
  );
}

function Summary({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col rounded-2xl border border-line bg-surface p-3">
      <span className="text-2xl font-bold">{value}</span>
      <span className="text-sm text-muted">{label}</span>
    </div>
  );
}

export default function DiagnosisPage({ params }: PageProps<"/lessons/[lessonId]/diagnosis">) {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <Diagnosis params={params} />
    </Suspense>
  );
}
