"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { loadAssessmentResults, saveDiagnosis } from "@/server/repositories/results";
import { rankMisconceptions } from "@/server/stats";

const confirmSchema = z.object({
  lessonId: z.string().min(1),
  misconceptions: z.array(z.string()).max(40),
  note: z.string().trim().max(1000),
  groupOverrides: z.record(z.string(), z.enum(["SUPPORT", "CONSOLIDATE", "EXTEND"])),
});

export async function confirmDiagnosisAction(input: unknown): Promise<{ error?: string }> {
  const parsed = confirmSchema.safeParse(input);
  if (!parsed.success) return { error: "Dữ liệu không hợp lệ." };
  const { lessonId, misconceptions, note, groupOverrides } = parsed.data;

  const results = await loadAssessmentResults(lessonId, "PRE");
  if (!results?.assessment) return { error: "Không tìm thấy bài kiểm tra." };

  // counts always come from the stored answers, never from the client
  const ranked = rankMisconceptions(results.stats);
  const items = ranked
    .filter((entry) => misconceptions.includes(entry.misconception))
    .map(({ misconception, count }) => ({ misconception, count }));
  if (items.length === 0 && !note) {
    return { error: "Hãy chọn ít nhất một lỗi hiểu sai hoặc ghi nhận xét của thầy cô." };
  }

  const pupilIds = new Set(results.stats.students?.map((s) => s.studentId) ?? []);
  const overrides = Object.fromEntries(
    Object.entries(groupOverrides).filter(([studentId]) => pupilIds.has(studentId)),
  );

  await saveDiagnosis(results.assessment.id, { items, note }, overrides);
  redirect(`/lessons/${lessonId}/remedial`);
}
