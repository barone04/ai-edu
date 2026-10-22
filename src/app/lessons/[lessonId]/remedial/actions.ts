"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { aiErrorMessage, aiModel } from "@/server/ai/groq";
import { generateRemedialLesson, REMEDIAL_PROMPT_VERSION } from "@/server/ai/remedial-lesson";
import { MAX_REMEDIAL_JSON_CHARS, remedialSchema } from "@/server/remedial";
import { createMaterial, updateMaterial } from "@/server/repositories/materials";
import {
  loadAssessmentResults,
  pupilGroups,
  type ConfirmedDiagnosis,
} from "@/server/repositories/results";

export type RemedialActionResult = { error?: string };

export async function generateRemedialAction(
  lessonId: string,
  extraInstructions: string,
): Promise<RemedialActionResult> {
  const extra = z.string().trim().max(500).safeParse(extraInstructions);
  if (!extra.success) return { error: "Yêu cầu thêm tối đa 500 ký tự." };

  const results = await loadAssessmentResults(lessonId, "PRE");
  const confirmed = results?.diagnosis?.confirmedMisconceptions as ConfirmedDiagnosis | undefined;
  if (!results || !confirmed) return { error: "Hãy xác nhận lỗi sai ở bước trước." };

  const groups = pupilGroups(results);
  try {
    const content = await generateRemedialLesson({
      grade: results.lesson.classroom.grade,
      subject: results.lesson.subject,
      title: results.lesson.title,
      learningObjective: results.lesson.learningObjective,
      referenceText: results.lesson.referenceText,
      misconceptions: confirmed.items,
      teacherNote: confirmed.note,
      questions: results.questions.map((q) => ({
        content: q.content,
        correctAnswer: q.options[q.correctOption],
      })),
      groupSizes: groups && {
        SUPPORT: groups.SUPPORT.length,
        CONSOLIDATE: groups.CONSOLIDATE.length,
        EXTEND: groups.EXTEND.length,
      },
      extraInstructions: extra.data,
    });
    await createMaterial(lessonId, content, {
      aiModel: aiModel(),
      promptVersion: REMEDIAL_PROMPT_VERSION,
    });
  } catch (error) {
    return { error: aiErrorMessage(error) };
  }

  refresh();
  return {};
}

export async function saveRemedialAction(
  lessonId: string,
  materialId: string | null,
  contentInput: unknown,
): Promise<RemedialActionResult> {
  const parsed = remedialSchema.safeParse(contentInput);
  if (!parsed.success || JSON.stringify(parsed.data).length > MAX_REMEDIAL_JSON_CHARS) {
    return { error: "Nội dung không hợp lệ hoặc quá dài." };
  }

  if (materialId) {
    const updated = await updateMaterial(lessonId, materialId, parsed.data);
    if (!updated) return { error: "Không tìm thấy phiếu bài tập." };
  } else {
    await createMaterial(lessonId, parsed.data, null);
  }
  refresh();
  return {};
}
