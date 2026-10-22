import { z } from "zod";

export const QUESTION_COUNTS = [3, 5, 8, 10] as const;

export const QUESTION_STYLES = {
  calculation: "Tính toán",
  word_problem: "Toán có lời văn",
  comparison: "So sánh, điền dấu",
  missing_number: "Tìm số chưa biết",
} as const;

export const DIFFICULTY_MIXES = {
  mixed: "Trộn dễ – khó",
  easy: "Dễ",
  medium: "Trung bình",
  hard: "Khó",
} as const;

type StyleKey = keyof typeof QUESTION_STYLES;
type MixKey = keyof typeof DIFFICULTY_MIXES;

export const quizOptionsSchema = z.object({
  questionCount: z.coerce.number().int().min(1).max(10),
  styles: z
    .array(z.enum(Object.keys(QUESTION_STYLES) as [StyleKey, ...StyleKey[]]))
    .min(1, "Chọn ít nhất một dạng bài."),
  difficulty: z.enum(Object.keys(DIFFICULTY_MIXES) as [MixKey, ...MixKey[]]),
  sourceExercises: z.string().trim().max(3000, "Bài tập dán vào tối đa 3000 ký tự."),
  extraInstructions: z.string().trim().max(500, "Yêu cầu thêm tối đa 500 ký tự."),
});

export type QuizOptions = z.infer<typeof quizOptionsSchema>;

export const DEFAULT_QUIZ_OPTIONS: QuizOptions = {
  questionCount: 3,
  styles: ["calculation", "word_problem"],
  difficulty: "mixed",
  sourceExercises: "",
  extraInstructions: "",
};
