import { describe, expect, it } from "vitest";
import { currentStep, lessonSteps } from "@/server/lesson-progress";

const nothingDone = {
  preApproved: false,
  preHasAnswers: false,
  diagnosisConfirmed: false,
  hasMaterials: false,
  postHasAnswers: false,
};

describe("lessonSteps", () => {
  it("only opens the first step for a new lesson", () => {
    const steps = lessonSteps(nothingDone);

    expect(steps.map((s) => s.available)).toEqual([true, false, false, false, false]);
    expect(currentStep(steps)?.key).toBe("quiz");
  });

  it("opens the next step once earlier steps are done", () => {
    const steps = lessonSteps({ ...nothingDone, preApproved: true, preHasAnswers: true });

    expect(steps.map((s) => s.available)).toEqual([true, true, true, false, false]);
    expect(currentStep(steps)?.key).toBe("diagnosis");
  });

  it("has no current step when the loop is complete", () => {
    const steps = lessonSteps({
      preApproved: true,
      preHasAnswers: true,
      diagnosisConfirmed: true,
      hasMaterials: true,
      postHasAnswers: true,
    });

    expect(currentStep(steps)).toBeNull();
  });
});
