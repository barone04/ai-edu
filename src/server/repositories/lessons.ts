import { prisma } from "@/server/db";
import type { ProgressInput } from "@/server/lesson-progress";
import { studentCodes } from "@/server/student-codes";

export const MAX_CLASS_SIZE = 50;

export async function listClassrooms() {
  return prisma.classroom.findMany({
    where: { isDemo: false },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, grade: true, studentCount: true },
  });
}

// Everything lessonSteps() needs, shared by the lesson list and the lesson page.
const progressInclude = {
  assessments: {
    select: {
      phase: true,
      questionsApprovedAt: true,
      diagnosis: { select: { teacherConfirmedAt: true } },
      questions: {
        select: { _count: { select: { responses: true, aggregateAnswers: true } } },
      },
    },
  },
  _count: { select: { materials: true } },
} as const;

type ProgressSource = {
  assessments: {
    phase: "PRE" | "POST";
    questionsApprovedAt: Date | null;
    diagnosis: { teacherConfirmedAt: Date | null } | null;
    questions: { _count: { responses: number; aggregateAnswers: number } }[];
  }[];
  _count: { materials: number };
};

export function progressInput(lesson: ProgressSource): ProgressInput {
  const pre = lesson.assessments.find((a) => a.phase === "PRE");
  const post = lesson.assessments.find((a) => a.phase === "POST");
  const hasAnswers = (assessment: typeof pre) =>
    assessment?.questions.some((q) => q._count.responses + q._count.aggregateAnswers > 0) ?? false;

  return {
    preApproved: Boolean(pre?.questionsApprovedAt),
    preHasAnswers: hasAnswers(pre),
    diagnosisConfirmed: Boolean(pre?.diagnosis?.teacherConfirmedAt),
    hasMaterials: lesson._count.materials > 0,
    postHasAnswers: hasAnswers(post),
  };
}

export async function listLessons() {
  return prisma.lesson.findMany({
    where: { classroom: { isDemo: false } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      createdAt: true,
      classroom: { select: { name: true } },
      ...progressInclude,
    },
  });
}

export async function countOverview() {
  const [classrooms, lessons, pupils] = await Promise.all([
    prisma.classroom.count({ where: { isDemo: false } }),
    prisma.lesson.count({ where: { classroom: { isDemo: false } } }),
    prisma.classroom.aggregate({ where: { isDemo: false }, _sum: { studentCount: true } }),
  ]);
  return { classrooms, lessons, pupils: pupils._sum.studentCount ?? 0 };
}

export async function getLesson(id: string) {
  return prisma.lesson.findUnique({
    where: { id },
    include: { classroom: true, ...progressInclude },
  });
}

export type NewClassroom = { name: string; grade: number; studentCount: number };

export type NewLesson = {
  classroom: { id: string } | NewClassroom;
  title: string;
  learningObjective: string;
  referenceText: string | null;
};

export async function createLesson(input: NewLesson): Promise<string> {
  return prisma.$transaction(async (tx) => {
    const classroomId =
      "id" in input.classroom
        ? input.classroom.id
        : (
            await tx.classroom.create({
              data: {
                ...input.classroom,
                students: {
                  create: studentCodes(input.classroom.studentCount).map((code) => ({ code })),
                },
              },
            })
          ).id;

    const lesson = await tx.lesson.create({
      data: {
        classroomId,
        subject: "Toán",
        title: input.title,
        learningObjective: input.learningObjective,
        referenceText: input.referenceText,
      },
    });
    return lesson.id;
  });
}

export async function deleteLesson(id: string) {
  await prisma.lesson.delete({ where: { id } });
}
