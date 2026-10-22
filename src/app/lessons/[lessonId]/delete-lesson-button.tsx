"use client";

import { useTransition } from "react";
import { buttonStyles } from "@/components/ui";
import { deleteLessonAction } from "../actions";

export function DeleteLessonButton({ lessonId }: { lessonId: string }) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!window.confirm("Xóa tiết học này cùng toàn bộ câu hỏi, kết quả và phiếu bài tập?")) {
      return;
    }
    startTransition(() => deleteLessonAction(lessonId));
  }

  return (
    <button type="button" onClick={handleClick} disabled={pending} className={buttonStyles.danger}>
      {pending ? "Đang xóa…" : "Xóa tiết học"}
    </button>
  );
}
