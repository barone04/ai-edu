"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import {
  classSize,
  saveAggregateCounts,
  setEntryMode,
  setResponse,
} from "@/server/repositories/answers";
import { findOverfilledQuestions, OPTION_KEYS } from "@/server/stats";

const phaseSchema = z.enum(["PRE", "POST"]);

export type AnswerActionResult = { error?: string };

const responseSchema = z.object({
  lessonId: z.string().min(1),
  phase: phaseSchema,
  questionId: z.string().min(1),
  studentId: z.string().min(1),
  option: z.enum(OPTION_KEYS).nullable(),
});

// Called on every tap; the client keeps its own state, so no page refresh here.
export async function saveResponseAction(input: unknown): Promise<AnswerActionResult> {
  const parsed = responseSchema.safeParse(input);
  if (!parsed.success) return { error: "Dữ liệu không hợp lệ." };
  const saved = await setResponse(parsed.data);
  return saved ? {} : { error: "Không tìm thấy câu hỏi hoặc học sinh." };
}

const aggregateSchema = z.object({
  lessonId: z.string().min(1),
  phase: phaseSchema,
  counts: z
    .array(
      z.object({
        questionId: z.string().min(1),
        option: z.enum(OPTION_KEYS),
        count: z.number().int().min(0).max(100),
      }),
    )
    .max(40),
});

export async function saveAggregateAction(input: unknown): Promise<AnswerActionResult> {
  const parsed = aggregateSchema.safeParse(input);
  if (!parsed.success) return { error: "Số lượng phải là số nguyên từ 0 trở lên." };
  const { lessonId, phase, counts } = parsed.data;

  const size = await classSize(lessonId);
  if (size === null) return { error: "Không tìm thấy tiết học." };
  if (findOverfilledQuestions(counts, size).length > 0) {
    return { error: `Tổng số học sinh của một câu không được vượt sĩ số ${size}.` };
  }

  const saved = await saveAggregateCounts(lessonId, phase, counts);
  if (!saved) return { error: "Không tìm thấy câu hỏi." };
  refresh();
  return {};
}

export async function setEntryModeAction(
  lessonId: string,
  phaseInput: string,
  modeInput: string,
): Promise<void> {
  const phase = phaseSchema.parse(phaseInput);
  const mode = z.enum(["INDIVIDUAL", "AGGREGATE"]).parse(modeInput);
  await setEntryMode(lessonId, phase, mode);
  refresh();
}
