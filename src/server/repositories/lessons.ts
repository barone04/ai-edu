import { prisma } from "@/server/db";
import { studentCodes } from "@/server/student-codes";

export const MAX_CLASS_SIZE = 50;

export async function listClassrooms() {
  return prisma.classroom.findMany({
    where: { isDemo: false },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, grade: true, studentCount: true },
  });
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
    },
  });
}

export async function getLesson(id: string) {
  return prisma.lesson.findUnique({
    where: { id },
    include: {
      classroom: true,
      assessments: {
        include: {
          diagnosis: { select: { teacherConfirmedAt: true } },
          questions: {
            select: {
              id: true,
              _count: { select: { responses: true, aggregateAnswers: true } },
            },
          },
        },
      },
      _count: { select: { materials: true } },
    },
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
