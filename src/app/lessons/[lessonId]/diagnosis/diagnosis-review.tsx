"use client";

import { Check } from "lucide-react";
import { useState, useTransition } from "react";
import { buttonStyles, Card, inputStyles } from "@/components/ui";
import { GROUP_LABELS, GROUP_ORDER } from "@/server/groups";
import type { RankedMisconception, StudentGroup } from "@/server/stats";
import { confirmDiagnosisAction } from "./actions";

type Pupil = { studentId: string; code: string; correct: number; group: StudentGroup };

type Props = {
  lessonId: string;
  questionCount: number;
  misconceptions: RankedMisconception[];
  pupils: Pupil[] | null;
  initialSelected: string[];
  initialNote: string;
  initialOverrides: Record<string, StudentGroup>;
};

const percent = (value: number) => `${Math.round(value * 100)}%`;

export function DiagnosisReview(props: Props) {
  const [selected, setSelected] = useState<string[]>(props.initialSelected);
  const [note, setNote] = useState(props.initialNote);
  const [overrides, setOverrides] = useState(props.initialOverrides);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const groupOf = (pupil: Pupil) => overrides[pupil.studentId] ?? pupil.group;

  function toggle(misconception: string) {
    setSelected((current) =>
      current.includes(misconception)
        ? current.filter((m) => m !== misconception)
        : [...current, misconception],
    );
  }

  function cycleGroup(pupil: Pupil) {
    const next = GROUP_ORDER[(GROUP_ORDER.indexOf(groupOf(pupil)) + 1) % GROUP_ORDER.length];
    setOverrides((current) => {
      const updated = { ...current };
      if (next === pupil.group) delete updated[pupil.studentId];
      else updated[pupil.studentId] = next;
      return updated;
    });
  }

  function confirm() {
    setError(null);
    startTransition(async () => {
      const result = await confirmDiagnosisAction({
        lessonId: props.lessonId,
        misconceptions: selected,
        note,
        groupOverrides: overrides,
      });
      if (result?.error) setError(result.error);
    });
  }

  return (
    <>
      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-lg font-bold">Lỗi hiểu sai có thể gặp</h2>
          <p className="text-sm text-muted">
            Đây là giả thuyết từ đáp án sai, chưa phải kết luận. Thầy cô hỏi lại vài em để kiểm chứng,
            rồi đánh dấu những lỗi cần dạy lại.
          </p>
        </div>
        {props.misconceptions.length === 0 ? (
          <Card>
            <p className="text-muted">Không có đáp án sai nào gắn với lỗi hiểu sai.</p>
          </Card>
        ) : (
          <ul className="flex flex-col gap-2">
            {props.misconceptions.map((entry) => {
              const checked = selected.includes(entry.misconception);
              return (
                <li key={entry.misconception}>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={checked}
                    onClick={() => toggle(entry.misconception)}
                    className={`flex w-full items-start gap-3 rounded-2xl border bg-surface p-3 text-left transition-colors ${
                      checked ? "border-primary" : "border-line"
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md border ${
                        checked ? "border-primary bg-primary text-white" : "border-line"
                      }`}
                    >
                      {checked && <Check className="size-4" aria-hidden />}
                    </span>
                    <span className="flex flex-1 flex-col gap-1">
                      <span className="font-semibold">{entry.misconception}</span>
                      <span className="text-sm text-muted">
                        {entry.count} lượt chọn · {percent(entry.share)} số câu trả lời · câu{" "}
                        {entry.questionNumbers.join(", ")}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        <label className="flex flex-col gap-1.5">
          <span className="font-semibold">Nhận xét của thầy cô (không bắt buộc)</span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="Ví dụ: hỏi lại 3 em, cả 3 đều cộng mẫu số với mẫu số"
            className={`${inputStyles} py-3`}
          />
        </label>
      </section>

      {props.pupils && (
        <section className="flex flex-col gap-3">
          <div>
            <h2 className="text-lg font-bold">Chia nhóm luyện tập</h2>
            <p className="text-sm text-muted">
              Tạm chia theo số câu đúng. Chạm vào mã học sinh để chuyển sang nhóm khác.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            {GROUP_ORDER.map((group) => {
              const members = props.pupils!.filter((p) => groupOf(p) === group);
              return (
                <Card key={group} className="flex flex-col gap-2">
                  <p className="font-semibold">
                    {GROUP_LABELS[group].long}{" "}
                    <span className="font-normal text-muted">({members.length})</span>
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {members.map((pupil) => (
                      <button
                        key={pupil.studentId}
                        type="button"
                        onClick={() => cycleGroup(pupil)}
                        aria-label={`${pupil.code}, ${pupil.correct}/${props.questionCount} câu đúng, chuyển nhóm`}
                        className={`rounded-full border px-2.5 py-1 text-sm font-semibold ${
                          overrides[pupil.studentId]
                            ? "border-accent bg-accent-soft"
                            : "border-line bg-canvas"
                        }`}
                      >
                        {pupil.code}
                        <span className="ml-1 font-normal text-muted">
                          {pupil.correct}/{props.questionCount}
                        </span>
                      </button>
                    ))}
                    {members.length === 0 && <span className="text-sm text-muted">Chưa có</span>}
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {error && (
        <p role="alert" className="rounded-xl bg-danger-soft p-3 font-medium text-danger">
          {error}
        </p>
      )}
      <button type="button" onClick={confirm} disabled={pending} className={buttonStyles.primary}>
        {pending ? "Đang lưu…" : "Xác nhận và soạn bài chữa lỗi"}
      </button>
    </>
  );
}
