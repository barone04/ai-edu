import type { AssessmentPhase } from "@/generated/prisma/client";
import { prisma } from "@/server/db";
import {
  applyGroupOverrides,
  computeAssessmentStats,
  type AssessmentInput,
  type OptionKey,
  type QuestionKey,
  type StudentGroup,
} from "@/server/stats";

export type ConfirmedDiagnosis = {
  items: { misconception: string; count: number }[];
  note: string;
};

// Loads one assessment and computes its statistics from the stored answers.
export async function loadAssessmentResults(lessonId: string, phase: AssessmentPhase) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      classroom: { include: { students: { select: { id: true, code: true } } } },
      assessments: {
        where: { phase },
        include: {
          diagnosis: true,
          questions: {
            orderBy: { order: "asc" },
            include: {
              responses: { select: { studentId: true, selectedOption: true } },
              aggregateAnswers: { select: { option: true, count: true } },
            },
          },
        },
      },
    },
  });
  if (!lesson) return null;

  const assessment = lesson.assessments[0] ?? null;
  const questions = (assessment?.questions ?? []).map((q) => ({
    id: q.id,
    content: q.content,
    options: q.options as Record<OptionKey, string>,
    correctOption: q.correctOption,
    misconceptions: q.misconceptions as Partial<Record<OptionKey, string>>,
  }));
  const keys: QuestionKey[] = questions;

  const input: AssessmentInput =
    assessment?.entryMode === "AGGREGATE"
      ? {
          mode: "AGGREGATE",
          counts: assessment.questions.flatMap((q) =>
            q.aggregateAnswers.map((a) => ({ questionId: q.id, option: a.option, count: a.count })),
          ),
        }
      : {
          mode: "INDIVIDUAL",
          responses: (assessment?.questions ?? []).flatMap((q) =>
            q.responses.map((r) => ({
              questionId: q.id,
              studentId: r.studentId,
              selectedOption: r.selectedOption,
            })),
          ),
        };

  return {
    lesson,
    assessment,
    questions,
    stats: computeAssessmentStats(keys, input),
    studentCodes: new Map(lesson.classroom.students.map((s) => [s.id, s.code])),
    diagnosis: assessment?.diagnosis ?? null,
  };
}

export async function saveDiagnosis(
  assessmentId: string,
  confirmed: ConfirmedDiagnosis,
  groupOverrides: Record<string, StudentGroup>,
) {
  const data = {
    confirmedMisconceptions: confirmed,
    groupOverrides,
    teacherConfirmedAt: new Date(),
  };
  await prisma.diagnosis.upsert({
    where: { assessmentId },
    create: { assessmentId, ...data },
    update: data,
  });
}

type LoadedResults = NonNullable<Awaited<ReturnType<typeof loadAssessmentResults>>>;

// Pupil codes per group after teacher overrides; null when answers were entered as class totals.
export function pupilGroups(results: LoadedResults): Record<StudentGroup, string[]> | null {
  if (!results.stats.students) return null;
  const overrides = (results.diagnosis?.groupOverrides ?? {}) as Record<string, StudentGroup>;
  const groups: Record<StudentGroup, string[]> = { SUPPORT: [], CONSOLIDATE: [], EXTEND: [] };
  for (const pupil of applyGroupOverrides(results.stats.students, overrides)) {
    groups[pupil.group].push(results.studentCodes.get(pupil.studentId) ?? "?");
  }
  for (const codes of Object.values(groups)) codes.sort();
  return groups;
}
