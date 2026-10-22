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
  if (new Set(filled).size !== filled.length) {
    issues.push("Có hai phương án giống nhau.");
  } else if (hasEquivalentNumbers(filled)) {
    issues.push("Có hai phương án bằng nhau về giá trị (ví dụ 1/2 và 2/4).");
  }

  const missing = OPTION_KEYS.filter(
    (key) => key !== question.correctOption && !question.misconceptions[key].trim(),
  );
  if (missing.length > 0) {
    issues.push(`Phương án ${missing.join(", ")} chưa có lỗi hiểu sai tương ứng.`);
  }
  return issues;
}

// Options that are plain numbers or fractions ("3", "2/4", "1,5") compared by value.
function numericValue(text: string): number | null {
  const fraction = text.match(/^(-?\d+)\s*\/\s*(\d+)$/);
  if (fraction) return Number(fraction[2]) === 0 ? null : Number(fraction[1]) / Number(fraction[2]);
  const decimal = text.replace(",", ".");
  return /^-?\d+(\.\d+)?$/.test(decimal) ? Number(decimal) : null;
}

function hasEquivalentNumbers(options: string[]): boolean {
  const values = options.map(numericValue).filter((v): v is number => v !== null);
  return values.some((v, i) => values.slice(i + 1).some((w) => Math.abs(v - w) < 1e-9));
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
