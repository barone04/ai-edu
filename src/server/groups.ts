import type { StudentGroup } from "@/server/stats";

export const GROUP_ORDER: StudentGroup[] = ["SUPPORT", "CONSOLIDATE", "EXTEND"];

export const GROUP_LABELS: Record<StudentGroup, { short: string; long: string }> = {
  SUPPORT: { short: "Nhóm A", long: "Nhóm A · Cần hỗ trợ" },
  CONSOLIDATE: { short: "Nhóm B", long: "Nhóm B · Củng cố" },
  EXTEND: { short: "Nhóm C", long: "Nhóm C · Mở rộng" },
};
