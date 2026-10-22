// Synthetic demo scenario ("Dữ liệu minh họa"). Never present these numbers as a real classroom pilot.

import type { OptionKey } from "@/server/stats";

export type QuestionFixture = {
  content: string;
  options: Record<OptionKey, string>;
  correctOption: OptionKey;
  misconceptions: Partial<Record<OptionKey, string>>;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
};

export const ADDS_ACROSS = "Cộng tử số với tử số, mẫu số với mẫu số, chưa quy đồng mẫu số";
export const KEEPS_NUMERATOR = "Quy đồng mẫu số nhưng quên nhân tử số tương ứng";

export const DEMO_CLASSROOM = { name: "4A", grade: 4, studentCount: 30 };

export const DEMO_LESSON = {
  subject: "Toán",
  title: "Phép cộng phân số khác mẫu số",
  learningObjective:
    "Học sinh biết quy đồng mẫu số để cộng hai phân số khác mẫu số và giải thích được vì sao phải quy đồng.",
  referenceText:
    "Muốn cộng hai phân số khác mẫu số, ta quy đồng mẫu số hai phân số rồi cộng hai phân số đó.",
};

export const DEMO_PRE_QUESTIONS: QuestionFixture[] = [
  {
    content: "Tính: 1/2 + 1/4 = ?",
    options: { A: "2/6", B: "3/4", C: "2/4", D: "1/6" },
    correctOption: "B",
    misconceptions: {
      A: ADDS_ACROSS,
      C: KEEPS_NUMERATOR,
      D: "Cộng hai mẫu số và giữ nguyên tử số",
    },
    explanation: "1/2 = 2/4, nên 1/2 + 1/4 = 2/4 + 1/4 = 3/4.",
    difficulty: "easy",
  },
  {
    content: "Tính: 2/3 + 1/6 = ?",
    options: { A: "3/9", B: "3/6", C: "5/6", D: "3/18" },
    correctOption: "C",
    misconceptions: {
      A: ADDS_ACROSS,
      B: KEEPS_NUMERATOR,
      D: "Nhân hai mẫu số nhưng không đổi tử số",
    },
    explanation: "2/3 = 4/6, nên 2/3 + 1/6 = 4/6 + 1/6 = 5/6.",
    difficulty: "medium",
  },
  {
    content:
      "Bạn An ăn 1/3 cái bánh, bạn Bình ăn 1/2 cái bánh. Hai bạn đã ăn tất cả bao nhiêu phần cái bánh?",
    options: { A: "5/6", B: "2/5", C: "2/6", D: "1/6" },
    correctOption: "A",
    misconceptions: {
      B: ADDS_ACROSS,
      C: KEEPS_NUMERATOR,
      D: "Nhầm phép cộng thành phép nhân hai phân số",
    },
    explanation: "1/3 = 2/6 và 1/2 = 3/6, nên 2/6 + 3/6 = 5/6 cái bánh.",
    difficulty: "medium",
  },
];

// Answer patterns for H01..H30; each string is the chosen option for questions 1, 2 and 3.
// Question 1 matches the scenario in CONTEXT.md: 12 of 30 pupils choose A.
const DEMO_PRE_PATTERNS: [pattern: string, pupils: number][] = [
  ["BCA", 8], // all correct
  ["BBA", 3], // keeps numerator on question 2
  ["DCA", 3], // adds denominators on question 1
  ["AAB", 8], // adds across every time
  ["ACB", 4], // adds across on questions 1 and 3
  ["CBC", 4], // keeps numerator every time
];

export function demoPreAnswers(): OptionKey[][] {
  return DEMO_PRE_PATTERNS.flatMap(([pattern, pupils]) =>
    Array.from({ length: pupils }, () => [...pattern] as OptionKey[]),
  );
}
