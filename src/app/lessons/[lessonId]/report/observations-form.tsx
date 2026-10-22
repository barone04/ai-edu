"use client";

import { useState, useTransition } from "react";
import { buttonStyles, inputStyles } from "@/components/ui";
import { saveObservationsAction } from "./actions";

export function ObservationsForm({ lessonId, initial }: { lessonId: string; initial: string }) {
  const [value, setValue] = useState(initial);
  const [status, setStatus] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save() {
    setStatus(null);
    startTransition(async () => {
      const result = await saveObservationsAction(lessonId, value);
      setStatus(result.error ?? "Đã lưu nhận xét.");
    });
  }

  return (
    <div className="flex flex-col gap-2 print:hidden">
      <textarea
        aria-label="Nhận xét của giáo viên"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={3}
        placeholder="Ví dụ: học sinh hứng thú với hoạt động chia bánh; nhóm A cần thêm thời gian"
        className={`${inputStyles} py-3`}
      />
      <div className="flex items-center gap-3">
        <button type="button" onClick={save} disabled={pending} className={buttonStyles.secondary}>
          {pending ? "Đang lưu…" : "Lưu nhận xét"}
        </button>
        {status && <span role="status" className="text-sm text-muted">{status}</span>}
      </div>
    </div>
  );
}
