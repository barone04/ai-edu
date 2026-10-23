"use client";

import { PenLine, Presentation, Printer, RefreshCw, Sparkles } from "lucide-react";
import { useState, useTransition } from "react";
import { TeacherGuide } from "@/components/remedial-view";
import { ButtonLink, buttonStyles, Card, inputStyles } from "@/components/ui";
import { blankRemedial, type RemedialContent } from "@/server/remedial";
import type { StudentGroup } from "@/server/stats";
import { generateRemedialAction, saveRemedialAction } from "./actions";
import { RemedialEditor } from "./remedial-editor";

type Props = {
  lessonId: string;
  material: { id: string; content: RemedialContent; fromAi: boolean } | null;
  groups: Record<StudentGroup, string[]> | null;
  next: { href: string; label: string };
};

export function RemedialWorkspace({ lessonId, material, groups, next }: Props) {
  const [draft, setDraft] = useState<RemedialContent | null>(null);
  const [extra, setExtra] = useState("");
  const [showRegenerate, setShowRegenerate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const base = `/lessons/${lessonId}/remedial/print`;

  function generate() {
    if (material && !window.confirm("Soạn lại bằng AI? Bản hiện tại vẫn được lưu trong lịch sử.")) return;
    setError(null);
    startTransition(async () => {
      const result = await generateRemedialAction(lessonId, extra);
      if (result.error) setError(result.error);
    });
  }

  function save() {
    if (!draft) return;
    setError(null);
    startTransition(async () => {
      const result = await saveRemedialAction(lessonId, material?.id ?? null, draft);
      if (result.error) setError(result.error);
      else setDraft(null);
    });
  }

  const errorBox = error && (
    <p role="alert" className="rounded-xl bg-danger-soft p-3 font-medium text-danger">
      {error}
    </p>
  );

  const generatePanel = (label: string) => (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1.5">
        <span className="font-semibold">Yêu cầu thêm cho AI (không bắt buộc)</span>
        <input
          value={extra}
          onChange={(e) => setExtra(e.target.value)}
          placeholder="Ví dụ: dùng que tính, có trò chơi nhóm đôi"
          className={inputStyles}
        />
      </label>
      {errorBox}
      <button type="button" onClick={generate} disabled={pending} className={`${buttonStyles.primary} gap-2`}>
        <Sparkles className="size-5" aria-hidden />
        {pending ? "AI đang soạn bài… (khoảng 15 giây)" : label}
      </button>
    </div>
  );

  if (draft) {
    return (
      <>
        <RemedialEditor content={draft} onChange={setDraft} />
        {errorBox}
        <div className="grid gap-3 sm:grid-cols-2">
          <button type="button" onClick={() => setDraft(null)} className={buttonStyles.secondary}>
            Hủy
          </button>
          <button type="button" onClick={save} disabled={pending} className={buttonStyles.primary}>
            {pending ? "Đang lưu…" : "Lưu bài chữa lỗi"}
          </button>
        </div>
      </>
    );
  }

  if (!material) {
    return (
      <>
        <Card className="flex flex-col gap-4">
          <p>
            AI soạn lời giải thích, hoạt động 5 phút, câu hỏi gợi mở và 3 phiếu luyện tập A/B/C dựa trên
            các lỗi thầy cô đã xác nhận.
          </p>
          {generatePanel("Soạn bài chữa lỗi bằng AI")}
        </Card>
        <button
          type="button"
          onClick={() => setDraft(blankRemedial())}
          className={`${buttonStyles.secondary} gap-2`}
        >
          <PenLine className="size-5" aria-hidden />
          Tự soạn
        </button>
      </>
    );
  }

  return (
    <>
      {material.fromAi && (
        <p className="rounded-xl bg-warn-soft p-3 text-warn">
          Nội dung do AI gợi ý. Thầy cô đọc lại, sửa nếu cần trước khi dùng với học sinh.
        </p>
      )}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <ButtonLink href={`${base}?view=pupil`} variant="secondary" className="gap-2 px-3">
          <Printer className="size-5" aria-hidden />
          Phiếu HS
        </ButtonLink>
        <ButtonLink href={`${base}?view=teacher`} variant="secondary" className="gap-2 px-3">
          <Printer className="size-5" aria-hidden />
          Bản GV
        </ButtonLink>
        <ButtonLink href={`${base}?view=board`} variant="secondary" className="gap-2 px-3">
          <Presentation className="size-5" aria-hidden />
          Chiếu bảng
        </ButtonLink>
        <button
          type="button"
          onClick={() => setDraft(material.content)}
          className={`${buttonStyles.secondary} gap-2 px-3`}
        >
          <PenLine className="size-5" aria-hidden />
          Sửa
        </button>
      </div>
      <Card>
        <TeacherGuide content={material.content} groups={groups} />
      </Card>
      {showRegenerate ? (
        <Card>{generatePanel("Soạn lại bằng AI")}</Card>
      ) : (
        <button
          type="button"
          onClick={() => setShowRegenerate(true)}
          className={`${buttonStyles.secondary} gap-2`}
        >
          <RefreshCw className="size-5" aria-hidden />
          Soạn lại bằng AI
        </button>
      )}
      <ButtonLink href={next.href}>{next.label}</ButtonLink>
    </>
  );
}
