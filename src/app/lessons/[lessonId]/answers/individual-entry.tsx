"use client";

import { ChevronLeft, ChevronRight, CloudCheck, CloudAlert, LoaderCircle, UserX } from "lucide-react";
import { useEffect, useState } from "react";
import { buttonStyles, Card } from "@/components/ui";
import { OPTION_KEYS, type OptionKey } from "@/server/stats";
import { saveResponseAction } from "./actions";

type Answers = Record<string, Record<string, OptionKey>>;

type Props = {
  lessonId: string;
  phase: "PRE" | "POST";
  students: { id: string; code: string }[];
  questions: { id: string; content: string }[];
  initialAnswers: Answers;
};

export function IndividualEntry({ lessonId, phase, students, questions, initialAnswers }: Props) {
  const [answers, setAnswers] = useState<Answers>(initialAnswers);
  const answeredCount = (studentId: string) => Object.keys(answers[studentId] ?? {}).length;
  const [current, setCurrent] = useState(() => {
    const firstOpen = students.findIndex((s) => answeredCount(s.id) < questions.length);
    return firstOpen === -1 ? 0 : firstOpen;
  });
  const [pendingSaves, setPendingSaves] = useState(0);
  const [saveError, setSaveError] = useState(false);

  const student = students[current];
  const studentAnswers = answers[student.id] ?? {};
  const complete = students.filter((s) => answeredCount(s.id) === questions.length).length;
  const partial = students.filter((s) => {
    const n = answeredCount(s.id);
    return n > 0 && n < questions.length;
  }).length;

  function goTo(index: number) {
    setCurrent(Math.max(0, Math.min(students.length - 1, index)));
  }

  async function choose(questionId: string, option: OptionKey) {
    const previous = studentAnswers[questionId];
    const next = previous === option ? null : option;
    const updated = { ...studentAnswers };
    if (next) updated[questionId] = next;
    else delete updated[questionId];
    setAnswers((all) => ({ ...all, [student.id]: updated }));

    // move on once every question for this pupil has an answer
    if (next && Object.keys(updated).length === questions.length && current < students.length - 1) {
      setTimeout(() => setCurrent((index) => (index === current ? index + 1 : index)), 250);
    }

    setPendingSaves((n) => n + 1);
    const result = await saveResponseAction({
      lessonId,
      phase,
      questionId,
      studentId: student.id,
      option: next,
    });
    setPendingSaves((n) => n - 1);
    if (result.error) {
      setSaveError(true);
      setAnswers((all) => {
        const restored = { ...(all[student.id] ?? {}) };
        if (previous) restored[questionId] = previous;
        else delete restored[questionId];
        return { ...all, [student.id]: restored };
      });
    } else {
      setSaveError(false);
    }
  }

  // keyboard: a-d answers the first open question, arrows move between pupils
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      const key = event.key.toUpperCase();
      if (OPTION_KEYS.includes(key as OptionKey)) {
        const open = questions.find((q) => !studentAnswers[q.id]);
        if (open) void choose(open.id, key as OptionKey);
      } else if (event.key === "ArrowRight") {
        goTo(current + 1);
      } else if (event.key === "ArrowLeft") {
        goTo(current - 1);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span>
          <span className="font-bold">
            {complete}/{students.length}
          </span>{" "}
          học sinh đã nhập đủ
          {partial > 0 && <span className="text-warn"> · {partial} em còn thiếu câu</span>}
        </span>
        <SaveStatus pending={pendingSaves > 0} failed={saveError} />
      </div>

      <Card className="flex flex-col gap-4 border-primary">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => goTo(current - 1)}
            disabled={current === 0}
            aria-label="Học sinh trước"
            className={`${buttonStyles.secondary} px-3`}
          >
            <ChevronLeft className="size-5" aria-hidden />
          </button>
          <div className="text-center">
            <p className="text-3xl font-bold text-primary">{student.code}</p>
            <p className="text-sm text-muted">
              Học sinh {current + 1}/{students.length}
            </p>
          </div>
          <button
            type="button"
            onClick={() => goTo(current + 1)}
            disabled={current === students.length - 1}
            aria-label="Học sinh sau"
            className={`${buttonStyles.secondary} px-3`}
          >
            <ChevronRight className="size-5" aria-hidden />
          </button>
        </div>

        {questions.map((question, index) => (
          <div key={question.id} className="flex flex-col gap-2">
            <p className="truncate text-sm">
              <span className="font-semibold">Câu {index + 1}.</span>{" "}
              <span className="text-muted">{question.content}</span>
            </p>
            <div className="grid grid-cols-4 gap-2" role="group" aria-label={`Câu ${index + 1} của ${student.code}`}>
              {OPTION_KEYS.map((option) => {
                const selected = studentAnswers[question.id] === option;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => void choose(question.id, option)}
                    aria-pressed={selected}
                    className={`min-h-14 rounded-xl text-xl font-bold transition-colors ${
                      selected
                        ? "bg-primary text-white"
                        : "border border-line bg-surface hover:border-primary"
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={() => goTo(current + 1)}
          disabled={current === students.length - 1}
          className={`${buttonStyles.secondary} gap-2`}
        >
          <UserX className="size-5" aria-hidden />
          Vắng / bỏ qua
        </button>
        <p className="text-center text-xs text-muted">
          Chạm lại chữ đã chọn để xóa. Trên máy tính có thể gõ phím A, B, C, D.
        </p>
      </Card>

      <Card className="overflow-x-auto p-0 sm:p-0">
        <table className="w-full text-center text-sm">
          <thead>
            <tr className="border-b border-line text-muted">
              <th className="px-3 py-2 text-left font-semibold">Mã</th>
              {questions.map((q, i) => (
                <th key={q.id} className="px-2 py-2 font-semibold">
                  Câu {i + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {students.map((s, index) => {
              const n = answeredCount(s.id);
              const rowTone =
                index === current
                  ? "bg-primary-soft"
                  : n > 0 && n < questions.length
                    ? "bg-warn-soft"
                    : "";
              return (
                <tr
                  key={s.id}
                  onClick={() => goTo(index)}
                  className={`cursor-pointer border-b border-line last:border-0 ${rowTone}`}
                >
                  <td className="px-3 py-2 text-left font-semibold">{s.code}</td>
                  {questions.map((q) => (
                    <td key={q.id} className="px-2 py-2 font-semibold">
                      {answers[s.id]?.[q.id] ?? <span className="text-line">·</span>}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function SaveStatus({ pending, failed }: { pending: boolean; failed: boolean }) {
  if (pending) {
    return (
      <span className="inline-flex items-center gap-1 text-muted">
        <LoaderCircle className="size-4 animate-spin" aria-hidden /> Đang lưu…
      </span>
    );
  }
  if (failed) {
    return (
      <span role="alert" className="inline-flex items-center gap-1 font-semibold text-danger">
        <CloudAlert className="size-4" aria-hidden /> Chưa lưu được, kiểm tra mạng
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-primary">
      <CloudCheck className="size-4" aria-hidden /> Đã lưu
    </span>
  );
}
