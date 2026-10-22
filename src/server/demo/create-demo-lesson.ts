import type { PrismaClient } from "@/generated/prisma/client";
import {
  DEMO_CLASSROOM,
  DEMO_LESSON,
  DEMO_PRE_QUESTIONS,
  demoPreAnswers,
} from "./fixtures";
import { studentCodes } from "@/server/student-codes";

// Returns the demo lesson id, creating the demo classroom on first use.
export async function ensureDemoLesson(prisma: PrismaClient): Promise<string> {
  const existing = await prisma.lesson.findFirst({
    where: { classroom: { isDemo: true } },
    select: { id: true },
  });
  if (existing) return existing.id;

  return prisma.$transaction(async (tx) => {
    const classroom = await tx.classroom.create({
      data: {
        ...DEMO_CLASSROOM,
        isDemo: true,
        students: {
          create: studentCodes(DEMO_CLASSROOM.studentCount).map((code) => ({ code })),
        },
      },
      include: { students: { orderBy: { code: "asc" } } },
    });

    const lesson = await tx.lesson.create({
      data: { ...DEMO_LESSON, classroomId: classroom.id },
    });

    const assessment = await tx.assessment.create({
      data: {
        lessonId: lesson.id,
        phase: "PRE",
        entryMode: "INDIVIDUAL",
        questionsApprovedAt: new Date(),
        questions: {
          create: DEMO_PRE_QUESTIONS.map((question, order) => ({ ...question, order })),
        },
      },
      include: { questions: { orderBy: { order: "asc" } } },
    });

    const answers = demoPreAnswers();
    await tx.response.createMany({
      data: classroom.students.flatMap((student, studentIndex) =>
        assessment.questions.map((question, questionIndex) => ({
          questionId: question.id,
          studentId: student.id,
          selectedOption: answers[studentIndex][questionIndex],
        })),
      ),
    });

    return lesson.id;
  });
}
