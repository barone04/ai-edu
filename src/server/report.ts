import type { AssessmentComparison } from "@/server/stats";

// above this follow-up correct rate most of the class is considered on track
const ON_TRACK_RATE = 0.8;

// Rule-based next step for the report; wording stays descriptive, never causal.
export function followUpRecommendation(comparison: AssessmentComparison): string {
  const top = comparison.remainingMisconceptions[0];
  const pupils =
    comparison.studentsNeedingFollowUp !== null && comparison.studentsNeedingFollowUp > 0
      ? ` cho ${comparison.studentsNeedingFollowUp} học sinh chưa làm đúng hết`
      : "";

  if (comparison.postCorrectRate >= ON_TRACK_RATE) {
    return top
      ? `Phần lớn lớp đã làm đúng. Có thể ôn nhanh lỗi "${top.misconception}"${pupils} trong tiết sau.`
      : "Phần lớn lớp đã làm đúng. Có thể chuyển sang nội dung tiếp theo.";
  }
  return top
    ? `Nên dạy lại lỗi "${top.misconception}"${pupils}, dùng thêm đồ dùng trực quan, rồi kiểm tra lại.`
    : `Tỷ lệ đúng còn thấp. Nên hỏi lại học sinh để tìm nguyên nhân${pupils}.`;
}
