import { ClipboardList, Lightbulb, PenLine, RefreshCw, Stethoscope, type LucideIcon } from "lucide-react";
import type { LessonStep, StepKey } from "@/server/lesson-progress";

export const STEP_META: Record<StepKey, { icon: LucideIcon; description: string }> = {
  quiz: { icon: ClipboardList, description: "AI soạn câu hỏi, thầy cô duyệt và in phiếu" },
  answers: { icon: PenLine, description: "Nhập đáp án A/B/C/D từ phiếu giấy" },
  diagnosis: { icon: Stethoscope, description: "Xem học sinh sai ở đâu và vì sao" },
  remedial: { icon: Lightbulb, description: "Hoạt động 5 phút và phiếu luyện tập theo nhóm" },
  "follow-up": { icon: RefreshCw, description: "Kiểm tra lại để thấy tiến bộ" },
};

export function ProgressBar({ steps }: { steps: LessonStep[] }) {
  const done = steps.filter((step) => step.done).length;
  return (
    <div className="flex items-center gap-3">
      <div
        className="h-2 flex-1 overflow-hidden rounded-full bg-primary-soft"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={steps.length}
        aria-valuenow={done}
        aria-label="Tiến độ tiết học"
      >
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${(done / steps.length) * 100}%` }}
        />
      </div>
      <span className="text-sm font-semibold text-muted">
        {done}/{steps.length}
      </span>
    </div>
  );
}
