import { describe, expect, it } from "vitest";
import {
  applyGroupOverrides,
  compareAssessments,
  computeAssessmentStats,
  computeQuestionStats,
  findOverfilledQuestions,
  groupForScore,
  rankMisconceptions,
  type IndividualResponse,
  type QuestionKey,
} from "@/server/stats";

const ADDS_DIRECTLY = "cộng trực tiếp tử số và mẫu số";

const questions: QuestionKey[] = [
  { id: "q1", correctOption: "B", misconceptions: { A: ADDS_DIRECTLY, C: "quên đổi tử số" } },
  { id: "q2", correctOption: "C", misconceptions: { A: ADDS_DIRECTLY } },
  { id: "q3", correctOption: "A", misconceptions: {} },
];

function answers(studentId: string, options: [string, string, string]): IndividualResponse[] {
  return options.map((selectedOption, index) => ({
    studentId,
    questionId: questions[index].id,
    selectedOption: selectedOption as IndividualResponse["selectedOption"],
  }));
}

describe("computeQuestionStats", () => {
  it("counts correct and incorrect answers and ranks error patterns", () => {
    const stats = computeQuestionStats(questions[0], { A: 12, B: 14, C: 3, D: 1 });

    expect(stats.total).toBe(30);
    expect(stats.correct).toBe(14);
    expect(stats.incorrect).toBe(16);
    expect(stats.correctRate).toBeCloseTo(14 / 30);
    expect(stats.errors.map((e) => e.option)).toEqual(["A", "C", "D"]);
    expect(stats.errors[0]).toMatchObject({ count: 12, share: 0.4, misconception: ADDS_DIRECTLY });
    expect(stats.errors[2].misconception).toBeNull();
  });

  it("returns zero rates instead of NaN when nobody answered", () => {
    const stats = computeQuestionStats(questions[0], { A: 0, B: 0, C: 0, D: 0 });

    expect(stats.correctRate).toBe(0);
    expect(stats.errors).toEqual([]);
  });
});

describe("groupForScore", () => {
  it.each([
    [0, "SUPPORT"],
    [1, "SUPPORT"],
    [2, "CONSOLIDATE"],
    [3, "EXTEND"],
  ] as const)("maps %i of 3 correct to %s", (correct, group) => {
    expect(groupForScore(correct, 3)).toBe(group);
  });
});

describe("computeAssessmentStats in individual mode", () => {
  const responses = [
    ...answers("H01", ["B", "C", "A"]),
    ...answers("H02", ["A", "A", "A"]),
    ...answers("H03", ["B", "A", "A"]),
  ];

  it("computes per-question and overall statistics", () => {
    const stats = computeAssessmentStats(questions, { mode: "INDIVIDUAL", responses });

    expect(stats.totalAnswers).toBe(9);
    expect(stats.overallCorrectRate).toBeCloseTo(6 / 9);
    expect(stats.questions[1].distribution).toEqual({ A: 2, B: 0, C: 1, D: 0 });
  });

  it("assigns provisional groups per pupil", () => {
    const stats = computeAssessmentStats(questions, { mode: "INDIVIDUAL", responses });

    expect(stats.students).toEqual([
      { studentId: "H01", answered: 3, correct: 3, group: "EXTEND" },
      { studentId: "H02", answered: 3, correct: 1, group: "SUPPORT" },
      { studentId: "H03", answered: 3, correct: 2, group: "CONSOLIDATE" },
    ]);
  });

  it("treats a missing answer as not correct", () => {
    const partial = answers("H04", ["B", "C", "A"]).slice(0, 2);
    const stats = computeAssessmentStats(questions, { mode: "INDIVIDUAL", responses: partial });

    expect(stats.students).toEqual([
      { studentId: "H04", answered: 2, correct: 2, group: "CONSOLIDATE" },
    ]);
  });
});

describe("computeAssessmentStats in aggregate mode", () => {
  it("analyses the class without inventing individual pupils", () => {
    const stats = computeAssessmentStats(questions, {
      mode: "AGGREGATE",
      counts: [
        { questionId: "q1", option: "A", count: 12 },
        { questionId: "q1", option: "B", count: 18 },
      ],
    });

    expect(stats.students).toBeNull();
    expect(stats.questions[0].correctRate).toBeCloseTo(0.6);
    expect(stats.questions[1].total).toBe(0);
  });
});

describe("findOverfilledQuestions", () => {
  it("flags questions whose totals exceed the class size", () => {
    const overfilled = findOverfilledQuestions(
      [
        { questionId: "q1", option: "A", count: 20 },
        { questionId: "q1", option: "B", count: 11 },
        { questionId: "q2", option: "A", count: 30 },
      ],
      30,
    );

    expect(overfilled).toEqual(["q1"]);
  });
});

describe("compareAssessments", () => {
  it("reports the descriptive difference and remaining misconceptions", () => {
    const pre = computeAssessmentStats(questions, {
      mode: "INDIVIDUAL",
      responses: [...answers("H01", ["A", "A", "A"]), ...answers("H02", ["A", "C", "B"])],
    });
    const post = computeAssessmentStats(questions, {
      mode: "INDIVIDUAL",
      responses: [...answers("H01", ["B", "C", "A"]), ...answers("H02", ["A", "C", "A"])],
    });

    const comparison = compareAssessments(pre, post);

    expect(comparison.preCorrectRate).toBeCloseTo(2 / 6);
    expect(comparison.postCorrectRate).toBeCloseTo(5 / 6);
    expect(comparison.differencePoints).toBeCloseTo(50);
    expect(comparison.remainingMisconceptions).toEqual([
      { misconception: ADDS_DIRECTLY, count: 1 },
    ]);
    expect(comparison.studentsNeedingFollowUp).toBe(1);
  });

  it("does not count pupils needing follow-up without individual data", () => {
    const aggregate = computeAssessmentStats(questions, { mode: "AGGREGATE", counts: [] });

    expect(compareAssessments(aggregate, aggregate).studentsNeedingFollowUp).toBeNull();
  });
});

describe("rankMisconceptions", () => {
  it("merges the same misconception across questions and ranks by count", () => {
    const stats = computeAssessmentStats(questions, {
      mode: "AGGREGATE",
      counts: [
        { questionId: "q1", option: "A", count: 12 },
        { questionId: "q1", option: "C", count: 3 },
        { questionId: "q1", option: "B", count: 15 },
        { questionId: "q2", option: "A", count: 8 },
        { questionId: "q2", option: "C", count: 22 },
        { questionId: "q3", option: "D", count: 5 },
      ],
    });

    expect(rankMisconceptions(stats)).toEqual([
      { misconception: ADDS_DIRECTLY, count: 20, share: 20 / 65, questionNumbers: [1, 2] },
      { misconception: "quên đổi tử số", count: 3, share: 3 / 65, questionNumbers: [1] },
    ]);
  });
});

describe("applyGroupOverrides", () => {
  it("lets the teacher move a pupil to another group", () => {
    const students = [
      { studentId: "H01", answered: 3, correct: 1, group: "SUPPORT" as const },
      { studentId: "H02", answered: 3, correct: 3, group: "EXTEND" as const },
    ];

    expect(applyGroupOverrides(students, { H01: "CONSOLIDATE" }).map((s) => s.group)).toEqual([
      "CONSOLIDATE",
      "EXTEND",
    ]);
  });
});
