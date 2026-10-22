import type { AssessmentPhase } from "@/generated/prisma/client";
import { prisma } from "@/server/db";
import { misconceptionsForStorage, type QuestionDraft } from "@/server/questions";
import type { OptionKey } from "@/server/stats";

export type Provenance = { aiModel: string; promptVersion: string } | null;

export async function getLessonWithAssessment(lessonId: string, phase: AssessmentPhase) {
  return prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      classroom: true,
      assessments: {
        where: { phase },
        include: {
          questions: {
            orderBy: { order: "asc" },
            include: { _count: { select: { responses: true, aggregateAnswers: true } } },
          },
        },
      },
    },
  });
}

type StoredQuestion = {
  id: string;
  content: string;
  options: unknown;
  correctOption: OptionKey;
  misconceptions: unknown;
  explanation: string;
  difficulty: string;
};

export function toDraft(question: StoredQuestion): QuestionDraft {
  const misconceptions = question.misconceptions as Partial<Record<OptionKey, string>>;
  return {
    id: question.id,
    content: question.content,
    options: question.options as Record<OptionKey, string>,
    correctOption: question.correctOption,
    misconceptions: {
      A: misconceptions.A ?? "",
      B: misconceptions.B ?? "",
      C: misconceptions.C ?? "",
      D: misconceptions.D ?? "",
    },
    explanation: question.explanation,
    difficulty: question.difficulty as QuestionDraft["difficulty"],
  };
}

function questionData(draft: QuestionDraft, order: number) {
  return {
    order,
    content: draft.content.trim(),
    options: draft.options,
    correctOption: draft.correctOption,
    misconceptions: misconceptionsForStorage(draft),
    explanation: draft.explanation.trim(),
    difficulty: draft.difficulty,
  };
}

async function assessmentHasAnswers(assessmentId: string) {
  const answered = await prisma.question.count({
    where: {
      assessmentId,
      OR: [{ responses: { some: {} } }, { aggregateAnswers: { some: {} } }],
    },
  });
  return answered > 0;
}

// Replaces all questions with a fresh AI draft. Refused once answers exist, to protect results.
export async function replaceWithDraft(
  lessonId: string,
  phase: AssessmentPhase,
  drafts: QuestionDraft[],
  provenance: Provenance,
): Promise<"saved" | "has_answers"> {
  const existing = await prisma.assessment.findUnique({
    where: { lessonId_phase: { lessonId, phase } },
  });
  if (existing && (await assessmentHasAnswers(existing.id))) return "has_answers";

  await prisma.$transaction(async (tx) => {
    const assessment = await tx.assessment.upsert({
      where: { lessonId_phase: { lessonId, phase } },
      create: { lessonId, phase },
      update: { questionsApprovedAt: null },
    });
    await tx.question.deleteMany({ where: { assessmentId: assessment.id } });
    await tx.question.createMany({
      data: drafts.map((draft, order) => ({
        ...questionData(draft, order),
        assessmentId: assessment.id,
        aiModel: provenance?.aiModel ?? null,
        promptVersion: provenance?.promptVersion ?? null,
      })),
    });
  });
  return "saved";
}

// Saves teacher edits in place so existing answers stay linked to their questions.
export async function saveQuestions(
  lessonId: string,
  phase: AssessmentPhase,
  drafts: QuestionDraft[],
  approve: boolean,
) {
  await prisma.$transaction(async (tx) => {
    const assessment = await tx.assessment.upsert({
      where: { lessonId_phase: { lessonId, phase } },
      create: { lessonId, phase },
      update: {},
    });

    const keptIds = drafts.flatMap((draft) => (draft.id ? [draft.id] : []));
    await tx.question.deleteMany({
      where: { assessmentId: assessment.id, id: { notIn: keptIds } },
    });
    // move existing rows out of the way first so reordering never hits the unique (assessmentId, order)
    await tx.question.updateMany({
      where: { assessmentId: assessment.id },
      data: { order: { increment: 1000 } },
    });

    for (const [order, draft] of drafts.entries()) {
      const data = questionData(draft, order);
      if (draft.id) {
        await tx.question.update({ where: { id: draft.id, assessmentId: assessment.id }, data });
      } else {
        await tx.question.create({ data: { ...data, assessmentId: assessment.id } });
      }
    }

    await tx.assessment.update({
      where: { id: assessment.id },
      data: { questionsApprovedAt: approve ? new Date() : null },
    });
  });
}
