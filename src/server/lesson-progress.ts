export type StepKey = "quiz" | "answers" | "diagnosis" | "remedial" | "follow-up";

export type LessonStep = {
  key: StepKey;
  label: string;
  done: boolean;
  // a step is reachable once every earlier step is done
  available: boolean;
};

export type ProgressInput = {
  preApproved: boolean;
  preHasAnswers: boolean;
  diagnosisConfirmed: boolean;
  hasMaterials: boolean;
  postHasAnswers: boolean;
};

const STEP_LABELS: Record<StepKey, string> = {
  quiz: "Tạo bài",
  answers: "Nhập kết quả",
  diagnosis: "Xem lỗi sai",
  remedial: "Chữa lỗi",
  "follow-up": "Kiểm tra lại",
};

export function lessonSteps(input: ProgressInput): LessonStep[] {
  const doneFlags: [StepKey, boolean][] = [
    ["quiz", input.preApproved],
    ["answers", input.preHasAnswers],
    ["diagnosis", input.diagnosisConfirmed],
    ["remedial", input.hasMaterials],
    ["follow-up", input.postHasAnswers],
  ];

  return doneFlags.map(([key, done], index) => ({
    key,
    label: STEP_LABELS[key],
    done,
    available: doneFlags.slice(0, index).every(([, earlierDone]) => earlierDone),
  }));
}

export function currentStep(steps: LessonStep[]): LessonStep | null {
  return steps.find((step) => !step.done) ?? null;
}
