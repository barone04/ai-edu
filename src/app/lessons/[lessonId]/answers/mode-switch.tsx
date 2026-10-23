"use client";

import { useTransition } from "react";
import { Chip } from "@/components/ui";
import { setEntryModeAction } from "./actions";

type Mode = "INDIVIDUAL" | "AGGREGATE";

const MODE_LABELS: Record<Mode, string> = {
  INDIVIDUAL: "Từng học sinh",
  AGGREGATE: "Nhanh cả lớp",
};

export function ModeSwitch({
  lessonId,
  phase,
  mode,
  hasData,
}: {
  lessonId: string;
  phase: "PRE" | "POST";
  mode: Mode;
  hasData: boolean;
}) {
  const [pending, startTransition] = useTransition();

  function change(next: Mode) {
    if (next === mode) return;
    if (hasData && !window.confirm("Đổi cách nhập sẽ xóa kết quả đã nhập. Tiếp tục?")) return;
    startTransition(() => setEntryModeAction(lessonId, phase, next));
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="font-semibold">Cách nhập</p>
      <div className="flex flex-wrap gap-2" aria-busy={pending}>
        {(Object.keys(MODE_LABELS) as Mode[]).map((option) => (
          <Chip key={option} selected={option === mode} onClick={() => change(option)}>
            {MODE_LABELS[option]}
          </Chip>
        ))}
      </div>
      <p className="text-sm text-muted">
        {mode === "INDIVIDUAL"
          ? "Nhập đáp án theo mã H01, H02… để chia nhóm học sinh."
          : "Chỉ nhập số em chọn mỗi đáp án. Nhanh hơn nhưng không chia nhóm được."}
      </p>
    </div>
  );
}
