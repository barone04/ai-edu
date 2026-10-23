"use client";

import { useState, useTransition } from "react";
import { buttonStyles, Card } from "@/components/ui";
import { OPTION_KEYS, type OptionKey } from "@/server/stats";
import { saveAggregateAction } from "./actions";

type Counts = Record<string, Record<OptionKey, string>>;

type Props = {
  lessonId: string;
  phase: "PRE" | "POST";
  classSize: number;
  questions: { id: string; content: string }[];
  initialCounts: Record<string, Partial<Record<OptionKey, number>>>;
};

export function AggregateEntry({ lessonId, phase, classSize, questions, initialCounts }: Props) {
  const [counts, setCounts] = useState<Counts>(() =>
    Object.fromEntries(
      questions.map((q) => [
        q.id,
        Object.fromEntries(
          OPTION_KEYS.map((key) => [key, String(initialCounts[q.id]?.[key] ?? "")]),
        ) as Record<OptionKey, string>,
      ]),
    ),
  );
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const total = (questionId: string) =>
    OPTION_KEYS.reduce((sum, key) => sum + (Number(counts[questionId][key]) || 0), 0);
  const overfilled = questions.some((q) => total(q.id) > classSize);

  function save() {
    setMessage(null);
    const payload = questions.flatMap((q) =>
      OPTION_KEYS.map((option) => ({
        questionId: q.id,
        option,
        count: Number(counts[q.id][option]) || 0,
      })),
    );
    startTransition(async () => {
      const result = await saveAggregateAction({ lessonId, phase, counts: payload });
      setMessage(
        result.error ? { tone: "error", text: result.error } : { tone: "ok", text: "Đã lưu kết quả." },
      );
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="rounded-xl bg-warn-soft p-3 text-sm text-warn">
        Chế độ nhanh chỉ cho biết tình hình cả lớp, không chia nhóm được từng học sinh.
      </p>
      {questions.map((question, index) => {
        const sum = total(question.id);
        return (
          <Card key={question.id} className="flex flex-col gap-3">
            <p className="truncate">
              <span className="font-semibold">Câu {index + 1}.</span>{" "}
              <span className="text-muted">{question.content}</span>
            </p>
            <div className="grid grid-cols-4 gap-2">
              {OPTION_KEYS.map((option) => (
                <label key={option} className="flex flex-col items-center gap-1">
                  <span className="text-lg font-bold">{option}</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={classSize}
                    aria-label={`Số học sinh chọn ${option} ở câu ${index + 1}`}
                    value={counts[question.id][option]}
                    onChange={(e) =>
                      setCounts((all) => ({
                        ...all,
                        [question.id]: { ...all[question.id], [option]: e.target.value },
                      }))
                    }
                    className="min-h-12 w-full rounded-xl border border-line bg-surface text-center text-lg focus:border-primary focus:outline-none"
                  />
                </label>
              ))}
            </div>
            <p className={`text-sm ${sum > classSize ? "font-semibold text-danger" : "text-muted"}`}>
              Tổng: {sum}/{classSize} học sinh
              {sum > classSize && " · vượt sĩ số"}
            </p>
          </Card>
        );
      })}
      {message && (
        <p
          role={message.tone === "error" ? "alert" : "status"}
          className={`rounded-xl p-3 font-medium ${
            message.tone === "error" ? "bg-danger-soft text-danger" : "bg-primary-soft text-primary"
          }`}
        >
          {message.text}
        </p>
      )}
      <button type="button" onClick={save} disabled={pending || overfilled} className={buttonStyles.primary}>
        {pending ? "Đang lưu…" : "Lưu kết quả"}
      </button>
    </div>
  );
}
