// Deterministic classroom statistics. The LLM never computes or overrides these numbers.

export const OPTION_KEYS = ["A", "B", "C", "D"] as const;
export type OptionKey = (typeof OPTION_KEYS)[number];

export type StudentGroup = "SUPPORT" | "CONSOLIDATE" | "EXTEND";

export type QuestionKey = {
  id: string;
  correctOption: OptionKey;
  misconceptions: Partial<Record<OptionKey, string>>;
};

export type IndividualResponse = {
  studentId: string;
  questionId: string;
  selectedOption: OptionKey;
};

export type AggregateCount = {
  questionId: string;
  option: OptionKey;
  count: number;
};

export type AssessmentInput =
  | { mode: "INDIVIDUAL"; responses: IndividualResponse[] }
  | { mode: "AGGREGATE"; counts: AggregateCount[] };

export type ErrorPattern = {
  option: OptionKey;
  count: number;
  // share of all answers to this question
  share: number;
  misconception: string | null;
};

export type QuestionStats = {
  questionId: string;
  total: number;
  correct: number;
  incorrect: number;
  correctRate: number;
  distribution: Record<OptionKey, number>;
  // incorrect options with at least one answer, most frequent first
  errors: ErrorPattern[];
};

export type StudentResult = {
  studentId: string;
  answered: number;
  correct: number;
  group: StudentGroup;
};

export type AssessmentStats = {
  mode: AssessmentInput["mode"];
  questions: QuestionStats[];
  totalAnswers: number;
  overallCorrectRate: number;
  // null in aggregate mode: individual data cannot be derived from class totals
  students: StudentResult[] | null;
};

function emptyDistribution(): Record<OptionKey, number> {
  return { A: 0, B: 0, C: 0, D: 0 };
}

function rate(part: number, total: number): number {
  return total === 0 ? 0 : part / total;
}

export function computeQuestionStats(
  question: QuestionKey,
  distribution: Record<OptionKey, number>,
): QuestionStats {
  const total = OPTION_KEYS.reduce((sum, key) => sum + distribution[key], 0);
  const correct = distribution[question.correctOption];

  const errors = OPTION_KEYS.filter(
    (key) => key !== question.correctOption && distribution[key] > 0,
  )
    .map((key) => ({
      option: key,
      count: distribution[key],
      share: rate(distribution[key], total),
      misconception: question.misconceptions[key] ?? null,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    questionId: question.id,
    total,
    correct,
    incorrect: total - correct,
    correctRate: rate(correct, total),
    distribution: { ...distribution },
    errors,
  };
}

// Operational grouping for 3 questions: 0-1 correct -> support, 2 -> consolidate, 3 -> extend.
// Generalised by ratio so a different question count still behaves sensibly.
export function groupForScore(correct: number, questionCount: number): StudentGroup {
  const ratio = rate(correct, questionCount);
  if (ratio >= 1) return "EXTEND";
  if (ratio >= 2 / 3) return "CONSOLIDATE";
  return "SUPPORT";
}

function distributionsFromResponses(responses: IndividualResponse[]) {
  const byQuestion = new Map<string, Record<OptionKey, number>>();
  for (const response of responses) {
    const distribution = byQuestion.get(response.questionId) ?? emptyDistribution();
    distribution[response.selectedOption] += 1;
    byQuestion.set(response.questionId, distribution);
  }
  return byQuestion;
}

function distributionsFromCounts(counts: AggregateCount[]) {
  const byQuestion = new Map<string, Record<OptionKey, number>>();
  for (const { questionId, option, count } of counts) {
    const distribution = byQuestion.get(questionId) ?? emptyDistribution();
    distribution[option] += count;
    byQuestion.set(questionId, distribution);
  }
  return byQuestion;
}

function computeStudentResults(
  questions: QuestionKey[],
  responses: IndividualResponse[],
): StudentResult[] {
  const correctOptionById = new Map(questions.map((q) => [q.id, q.correctOption]));
  const results = new Map<string, { answered: number; correct: number }>();

  for (const response of responses) {
    const correctOption = correctOptionById.get(response.questionId);
    if (correctOption === undefined) continue;
    const result = results.get(response.studentId) ?? { answered: 0, correct: 0 };
    result.answered += 1;
    if (response.selectedOption === correctOption) result.correct += 1;
    results.set(response.studentId, result);
  }

  // an unanswered question counts as not correct; absent pupils have no responses and are omitted
  return [...results.entries()]
    .map(([studentId, { answered, correct }]) => ({
      studentId,
      answered,
      correct,
      group: groupForScore(correct, questions.length),
    }))
    .sort((a, b) => a.studentId.localeCompare(b.studentId));
}

export function computeAssessmentStats(
  questions: QuestionKey[],
  input: AssessmentInput,
): AssessmentStats {
  const distributions =
    input.mode === "INDIVIDUAL"
      ? distributionsFromResponses(input.responses)
      : distributionsFromCounts(input.counts);

  const questionStats = questions.map((question) =>
    computeQuestionStats(question, distributions.get(question.id) ?? emptyDistribution()),
  );
  const totalAnswers = questionStats.reduce((sum, q) => sum + q.total, 0);
  const totalCorrect = questionStats.reduce((sum, q) => sum + q.correct, 0);

  return {
    mode: input.mode,
    questions: questionStats,
    totalAnswers,
    overallCorrectRate: rate(totalCorrect, totalAnswers),
    students:
      input.mode === "INDIVIDUAL" ? computeStudentResults(questions, input.responses) : null,
  };
}

// Returns the ids of questions whose aggregate totals exceed the class size.
export function findOverfilledQuestions(counts: AggregateCount[], classSize: number): string[] {
  const totals = new Map<string, number>();
  for (const { questionId, count } of counts) {
    totals.set(questionId, (totals.get(questionId) ?? 0) + count);
  }
  return [...totals.entries()].filter(([, total]) => total > classSize).map(([id]) => id);
}

export type AssessmentComparison = {
  preCorrectRate: number;
  postCorrectRate: number;
  // descriptive difference in percentage points, not a causal learning gain
  differencePoints: number;
  // misconceptions still chosen in the follow-up, most frequent first
  remainingMisconceptions: { misconception: string; count: number }[];
  // pupils outside the extend group after the follow-up; null without individual data
  studentsNeedingFollowUp: number | null;
};

export function compareAssessments(
  pre: AssessmentStats,
  post: AssessmentStats,
): AssessmentComparison {
  const remaining = new Map<string, number>();
  for (const question of post.questions) {
    for (const error of question.errors) {
      if (error.misconception === null) continue;
      remaining.set(error.misconception, (remaining.get(error.misconception) ?? 0) + error.count);
    }
  }

  return {
    preCorrectRate: pre.overallCorrectRate,
    postCorrectRate: post.overallCorrectRate,
    differencePoints: (post.overallCorrectRate - pre.overallCorrectRate) * 100,
    remainingMisconceptions: [...remaining.entries()]
      .map(([misconception, count]) => ({ misconception, count }))
      .sort((a, b) => b.count - a.count),
    studentsNeedingFollowUp:
      post.students === null ? null : post.students.filter((s) => s.group !== "EXTEND").length,
  };
}
