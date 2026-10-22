import { describe, expect, it } from "vitest";
import { findQuestionIssues, misconceptionsForStorage, type QuestionDraft } from "@/server/questions";

const valid: QuestionDraft = {
  content: "Tính: 1/2 + 1/4 = ?",
  options: { A: "2/6", B: "3/4", C: "2/4", D: "1/6" },
  correctOption: "B",
  misconceptions: { A: "Cộng tử với tử, mẫu với mẫu", B: "", C: "Quên đổi tử số", D: "Cộng mẫu số" },
  explanation: "1/2 = 2/4 nên kết quả là 3/4.",
  difficulty: "easy",
};

describe("findQuestionIssues", () => {
  it("accepts a complete question", () => {
    expect(findQuestionIssues(valid)).toEqual([]);
  });

  it("flags duplicate options", () => {
    const issues = findQuestionIssues({ ...valid, options: { ...valid.options, D: "2/6" } });

    expect(issues).toContain("Có hai phương án giống nhau.");
  });

  it("flags wrong options without a misconception", () => {
    const issues = findQuestionIssues({
      ...valid,
      misconceptions: { ...valid.misconceptions, C: " " },
    });

    expect(issues).toEqual(["Phương án C chưa có lỗi hiểu sai tương ứng."]);
  });

  it("flags missing content and options", () => {
    const issues = findQuestionIssues({ ...valid, content: "", options: { ...valid.options, A: "" } });

    expect(issues).toEqual(["Chưa có nội dung câu hỏi.", "Cần đủ 4 phương án A, B, C, D."]);
  });
});

describe("misconceptionsForStorage", () => {
  it("keeps only the wrong options", () => {
    expect(misconceptionsForStorage({ ...valid, misconceptions: { ...valid.misconceptions, B: "x" } })).toEqual({
      A: "Cộng tử với tử, mẫu với mẫu",
      C: "Quên đổi tử số",
      D: "Cộng mẫu số",
    });
  });
});
