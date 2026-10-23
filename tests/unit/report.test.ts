import { describe, expect, it } from "vitest";
import { followUpRecommendation } from "@/server/report";

const base = {
  preCorrectRate: 0.4,
  postCorrectRate: 0.6,
  differencePoints: 20,
  remainingMisconceptions: [{ misconception: "Cộng tử với tử, mẫu với mẫu", count: 5 }],
  studentsNeedingFollowUp: 7,
};

describe("followUpRecommendation", () => {
  it("suggests reteaching the top remaining misconception when the class is not on track", () => {
    expect(followUpRecommendation(base)).toBe(
      'Nên dạy lại lỗi "Cộng tử với tử, mẫu với mẫu" cho 7 học sinh chưa làm đúng hết, dùng thêm đồ dùng trực quan, rồi kiểm tra lại.',
    );
  });

  it("suggests moving on when most of the class is correct and nothing remains", () => {
    expect(
      followUpRecommendation({ ...base, postCorrectRate: 0.9, remainingMisconceptions: [] }),
    ).toBe("Phần lớn lớp đã làm đúng. Có thể chuyển sang nội dung tiếp theo.");
  });

  it("omits pupil counts in aggregate mode", () => {
    expect(followUpRecommendation({ ...base, studentsNeedingFollowUp: null })).not.toContain(
      "học sinh chưa làm đúng hết",
    );
  });
});
