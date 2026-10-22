"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { aiErrorMessage, aiModel } from "@/server/ai/groq";
import { DIAGNOSTIC_QUIZ_PROMPT_VERSION, generateDiagnosticQuiz } from "@/server/ai/diagnostic-quiz";
import { findQuestionIssues, questionDraftSchema } from "@/server/questions";
import { quizOptionsSchema } from "@/server/quiz-options";
import {
  getLessonWithAssessment,
  replaceWithDraft,
  saveQuestions,
} from "@/server/repositories/assessments";

const phaseSchema = z.enum(["PRE", "POST"]);

export type QuizActionResult = { error?: string };

export async function generateQuizAction(
  lessonId: string,
  phaseInput: string,
  optionsInput: unknown,
): Promise<QuizActionResult> {
  const phase = phaseSchema.parse(phaseInput);
  const options = quizOptionsSchema.safeParse(optionsInput);
  if (!options.success) return { error: options.error.issues[0].message };
  const lesson = await getLessonWithAssessment(lessonId, phase);
  if (!lesson) return { error: "Không tìm thấy tiết học." };

  let previousQuestions: string[] | undefined;
  if (phase === "POST") {
    const pre = await getLessonWithAssessment(lessonId, "PRE");
    previousQuestions = pre?.assessments[0]?.questions.map((q) => q.content);
  }

  try {
    const drafts = await generateDiagnosticQuiz({
      grade: lesson.classroom.grade,
      subject: lesson.subject,
      title: lesson.title,
      learningObjective: lesson.learningObjective,
      referenceText: lesson.referenceText,
      options: options.data,
      previousQuestions,
    });
    const outcome = await replaceWithDraft(lessonId, phase, drafts, {
      aiModel: aiModel(),
      promptVersion: DIAGNOSTIC_QUIZ_PROMPT_VERSION,
    });
    if (outcome === "has_answers") {
      return { error: "Đã có kết quả của học sinh nên không thể thay bộ câu hỏi." };
    }
  } catch (error) {
    return { error: aiErrorMessage(error) };
  }

  refresh();
  return {};
}

export async function saveQuizAction(
  lessonId: string,
  phaseInput: string,
  draftsInput: unknown,
  approve: boolean,
): Promise<QuizActionResult> {
  const phase = phaseSchema.parse(phaseInput);
  const parsed = z.array(questionDraftSchema).min(1).max(10).safeParse(draftsInput);
  if (!parsed.success) return { error: "Dữ liệu câu hỏi không hợp lệ hoặc quá dài." };

  if (approve && parsed.data.some((draft) => findQuestionIssues(draft).length > 0)) {
    return { error: "Hãy sửa các mục được đánh dấu trước khi duyệt." };
  }

  await saveQuestions(lessonId, phase, parsed.data, approve);
  refresh();
  return {};
}
