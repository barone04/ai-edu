import type { AssessmentPhase, EntryMode } from "@/generated/prisma/client";
import { prisma } from "@/server/db";
import type { AggregateCount, OptionKey } from "@/server/stats";

export async function getAnswerSheet(lessonId: string, phase: AssessmentPhase) {
  return prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      classroom: {
        include: { students: { orderBy: { code: "asc" }, select: { id: true, code: true } } },
      },
      assessments: {
        where: { phase },
        include: {
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
}

async function findAssessment(lessonId: string, phase: AssessmentPhase) {
  return prisma.assessment.findUnique({
    where: { lessonId_phase: { lessonId, phase } },
    include: {
      questions: { select: { id: true } },
      lesson: { select: { classroom: { select: { id: true, studentCount: true } } } },
    },
  });
}

// Sets or clears one pupil's answer. Returns false when the ids do not belong to this lesson.
export async function setResponse(input: {
  lessonId: string;
  phase: AssessmentPhase;
  questionId: string;
  studentId: string;
  option: OptionKey | null;
}): Promise<boolean> {
  const assessment = await findAssessment(input.lessonId, input.phase);
  if (!assessment?.questions.some((q) => q.id === input.questionId)) return false;
  const student = await prisma.student.findFirst({
    where: { id: input.studentId, classroomId: assessment.lesson.classroom.id },
    select: { id: true },
  });
  if (!student) return false;

  const key = { questionId_studentId: { questionId: input.questionId, studentId: input.studentId } };
  if (input.option === null) {
    await prisma.response.deleteMany({
      where: { questionId: input.questionId, studentId: input.studentId },
    });
  } else {
    await prisma.response.upsert({
      where: key,
      create: { questionId: input.questionId, studentId: input.studentId, selectedOption: input.option },
      update: { selectedOption: input.option },
    });
  }
  return true;
}

export async function saveAggregateCounts(
  lessonId: string,
  phase: AssessmentPhase,
  counts: AggregateCount[],
): Promise<boolean> {
  const assessment = await findAssessment(lessonId, phase);
  const questionIds = new Set(assessment?.questions.map((q) => q.id));
  if (!assessment || counts.some((c) => !questionIds.has(c.questionId))) return false;

  await prisma.$transaction([
    prisma.aggregateAnswer.deleteMany({ where: { questionId: { in: [...questionIds] } } }),
    prisma.aggregateAnswer.createMany({ data: counts.filter((c) => c.count > 0) }),
  ]);
  return true;
}

// Switching mode discards the other mode's data so statistics never mix the two.
export async function setEntryMode(lessonId: string, phase: AssessmentPhase, mode: EntryMode) {
  const assessment = await findAssessment(lessonId, phase);
  if (!assessment) return;
  const questionIds = assessment.questions.map((q) => q.id);
  await prisma.$transaction([
    prisma.response.deleteMany({ where: { questionId: { in: questionIds } } }),
    prisma.aggregateAnswer.deleteMany({ where: { questionId: { in: questionIds } } }),
    prisma.assessment.update({ where: { id: assessment.id }, data: { entryMode: mode } }),
  ]);
}

export async function classSize(lessonId: string): Promise<number | null> {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { classroom: { select: { studentCount: true } } },
  });
  return lesson?.classroom.studentCount ?? null;
}
