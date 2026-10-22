import { z } from "zod";
import { OPTION_KEYS, type OptionKey } from "@/server/stats";

export const DIFFICULTIES = ["easy", "medium", "hard"] as const;

export const DIFFICULTY_LABELS: Record<(typeof DIFFICULTIES)[number], string> = {
  easy: "Dễ",
  medium: "Trung bình",
  hard: "Khó",
};

const optionText = z.string().trim().max(200);

export const questionDraftSchema = z.object({
  id: z.string().optional(),
  content: z.string().trim().max(1000),
  options: z.object({ A: optionText, B: optionText, C: optionText, D: optionText }),
  correctOption: z.enum(OPTION_KEYS),
  misconceptions: z.object({ A: optionText, B: optionText, C: optionText, D: optionText }),
  explanation: z.string().trim().max(1000),
  difficulty: z.enum(DIFFICULTIES),
});

export type QuestionDraft = z.infer<typeof questionDraftSchema>;

export function blankQuestion(): QuestionDraft {
  return {
    content: "",
    options: { A: "", B: "", C: "", D: "" },
    correctOption: "A",
    misconceptions: { A: "", B: "", C: "", D: "" },
    explanation: "",
    difficulty: "medium",
  };
}

// Problems a teacher must fix before the question can be used in class.
export function findQuestionIssues(question: QuestionDraft): string[] {
  const issues: string[] = [];
  if (!question.content.trim()) issues.push("Chưa có nội dung câu hỏi.");

  const optionValues = OPTION_KEYS.map((key) => question.options[key].trim());
  if (optionValues.some((value) => !value)) issues.push("Cần đủ 4 phương án A, B, C, D.");
  const filled = optionValues.filter(Boolean);
  if (new Set(filled).size !== filled.length) issues.push("Có hai phương án giống nhau.");

  const missing = OPTION_KEYS.filter(
    (key) => key !== question.correctOption && !question.misconceptions[key].trim(),
  );
  if (missing.length > 0) {
    issues.push(`Phương án ${missing.join(", ")} chưa có lỗi hiểu sai tương ứng.`);
  }
  return issues;
}

// Only wrong options carry a misconception; the correct option's text is dropped.
export function misconceptionsForStorage(question: QuestionDraft): Partial<Record<OptionKey, string>> {
  return Object.fromEntries(
    OPTION_KEYS.filter((key) => key !== question.correctOption).map((key) => [
      key,
      question.misconceptions[key].trim(),
    ]),
  );
}
