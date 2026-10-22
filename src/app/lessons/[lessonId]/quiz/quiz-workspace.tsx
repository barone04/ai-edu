"use client";

import { useState, useTransition } from "react";
import { ButtonLink, buttonStyles, Card, inputStyles } from "@/components/ui";
import {
  blankQuestion,
  DIFFICULTIES,
  DIFFICULTY_LABELS,
  findQuestionIssues,
  type QuestionDraft,
} from "@/server/questions";
import { OPTION_KEYS, type OptionKey } from "@/server/stats";
import { generateQuizAction, saveQuizAction } from "./actions";

type Props = {
  lessonId: string;
  phase: "PRE" | "POST";
  initialDrafts: QuestionDraft[];
  approved: boolean;
  hasAnswers: boolean;
  fromAi: boolean;
  printHref: string;
  next: { href: string; label: string };
};

export function QuizWorkspace(props: Props) {
  const [drafts, setDrafts] = useState(props.initialDrafts);
  const [editing, setEditing] = useState(!props.approved && props.initialDrafts.length > 0);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function generate() {
    if (drafts.length > 0 && !window.confirm("Thay toàn bộ câu hỏi hiện tại bằng câu hỏi AI mới?")) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await generateQuizAction(props.lessonId, props.phase);
      if (result.error) setError(result.error);
    });
  }

  function save(approve: boolean) {
    setError(null);
    startTransition(async () => {
      const result = await saveQuizAction(props.lessonId, props.phase, drafts, approve);
      if (result.error) setError(result.error);
    });
  }

  const errorBox = error && (
    <p role="alert" className="rounded-xl bg-danger-soft p-3 font-medium text-danger">
      {error}
    </p>
  );

  if (drafts.length === 0) {
    return (
      <Card className="flex flex-col gap-4">
        <p>
          AI sẽ soạn 3 câu trắc nghiệm ngắn. Mỗi phương án sai ứng với một lỗi hiểu sai thường gặp,
          để biết học sinh đang vướng ở đâu.
        </p>
        {errorBox}
        <button type="button" onClick={generate} disabled={pending} className={buttonStyles.primary}>
          {pending ? "AI đang soạn câu hỏi… (khoảng 10 giây)" : "Tạo câu hỏi bằng AI"}
        </button>
        <button
          type="button"
          onClick={() => {
            setDrafts([blankQuestion(), blankQuestion(), blankQuestion()]);
            setEditing(true);
          }}
          disabled={pending}
          className={buttonStyles.secondary}
        >
          Tự soạn câu hỏi
        </button>
      </Card>
    );
  }

  if (!editing) {
    return (
      <>
        <p className="rounded-xl bg-primary-soft p-3 font-medium text-primary">
          Bộ câu hỏi đã được duyệt. In phiếu hoặc chép lên bảng cho học sinh làm trên giấy.
        </p>
        {drafts.map((draft, index) => (
          <QuestionSummary key={draft.id ?? index} index={index} draft={draft} />
        ))}
        <div className="grid gap-3 sm:grid-cols-2">
          <ButtonLink href={props.printHref} variant="secondary">
            In phiếu cho học sinh
          </ButtonLink>
          <button type="button" onClick={() => setEditing(true)} className={buttonStyles.secondary}>
            Sửa câu hỏi
          </button>
        </div>
        <ButtonLink href={props.next.href}>{props.next.label}</ButtonLink>
      </>
    );
  }

  return (
    <>
      {props.fromAi && (
        <p className="rounded-xl bg-warn-soft p-3 text-warn">
          Câu hỏi do AI gợi ý. Thầy cô kiểm tra lại đáp án đúng và lỗi hiểu sai trước khi dùng.
        </p>
      )}
      {drafts.map((draft, index) => (
        <QuestionEditor
          key={draft.id ?? index}
          index={index}
          draft={draft}
          onChange={(updated) =>
            setDrafts((current) => current.map((d, i) => (i === index ? updated : d)))
          }
        />
      ))}
      {errorBox}
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => save(false)}
          disabled={pending}
          className={buttonStyles.secondary}
        >
          Lưu nháp
        </button>
        <button type="button" onClick={() => save(true)} disabled={pending} className={buttonStyles.primary}>
          {pending ? "Đang lưu…" : "Duyệt bộ câu hỏi"}
        </button>
      </div>
      {!props.hasAnswers && (
        <button type="button" onClick={generate} disabled={pending} className={buttonStyles.secondary}>
          {pending ? "Đang xử lý…" : "Tạo lại bằng AI"}
        </button>
      )}
    </>
  );
}

function QuestionSummary({ index, draft }: { index: number; draft: QuestionDraft }) {
  return (
    <Card className="flex flex-col gap-3">
      <p className="font-semibold">
        Câu {index + 1}. {draft.content}
      </p>
      <ul className="flex flex-col gap-1.5">
        {OPTION_KEYS.map((key) => (
          <li key={key}>
            <span className={key === draft.correctOption ? "font-bold text-primary" : ""}>
              {key}. {draft.options[key]}
              {key === draft.correctOption && " ✓"}
            </span>
            {key !== draft.correctOption && draft.misconceptions[key] && (
              <span className="block text-sm text-muted">→ {draft.misconceptions[key]}</span>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}

function QuestionEditor({
  index,
  draft,
  onChange,
}: {
  index: number;
  draft: QuestionDraft;
  onChange: (draft: QuestionDraft) => void;
}) {
  const issues = findQuestionIssues(draft);
  const setOption = (key: OptionKey, value: string) =>
    onChange({ ...draft, options: { ...draft.options, [key]: value } });
  const setMisconception = (key: OptionKey, value: string) =>
    onChange({ ...draft, misconceptions: { ...draft.misconceptions, [key]: value } });

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold">Câu {index + 1}</h2>
        <select
          aria-label={`Độ khó câu ${index + 1}`}
          value={draft.difficulty}
          onChange={(e) =>
            onChange({ ...draft, difficulty: e.target.value as QuestionDraft["difficulty"] })
          }
          className={`${inputStyles} w-auto`}
        >
          {DIFFICULTIES.map((d) => (
            <option key={d} value={d}>
              {DIFFICULTY_LABELS[d]}
            </option>
          ))}
        </select>
      </div>

      <textarea
        aria-label={`Nội dung câu ${index + 1}`}
        value={draft.content}
        onChange={(e) => onChange({ ...draft, content: e.target.value })}
        rows={2}
        placeholder="Nội dung câu hỏi"
        className={`${inputStyles} py-3`}
      />

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-sm text-muted">Chạm vào chữ cái để chọn đáp án đúng</legend>
        {OPTION_KEYS.map((key) => {
          const correct = key === draft.correctOption;
          return (
            <div key={key} className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onChange({ ...draft, correctOption: key })}
                  aria-pressed={correct}
                  aria-label={`Chọn ${key} là đáp án đúng`}
                  className={`flex size-12 shrink-0 items-center justify-center rounded-xl text-lg font-bold ${
                    correct ? "bg-primary text-white" : "border border-line bg-surface"
                  }`}
                >
                  {key}
                </button>
                <input
                  aria-label={`Phương án ${key} câu ${index + 1}`}
                  value={draft.options[key]}
                  onChange={(e) => setOption(key, e.target.value)}
                  className={inputStyles}
                />
              </div>
              {correct ? (
                <span className="pl-14 text-sm font-semibold text-primary">Đáp án đúng</span>
              ) : (
                <input
                  aria-label={`Lỗi hiểu sai khi chọn ${key} câu ${index + 1}`}
                  value={draft.misconceptions[key]}
                  onChange={(e) => setMisconception(key, e.target.value)}
                  placeholder={`Chọn ${key} vì hiểu sai điều gì?`}
                  className={`${inputStyles} ml-14 w-[calc(100%-3.5rem)] text-sm`}
                />
              )}
            </div>
          );
        })}
      </fieldset>

      <textarea
        aria-label={`Lời giải câu ${index + 1}`}
        value={draft.explanation}
        onChange={(e) => onChange({ ...draft, explanation: e.target.value })}
        rows={2}
        placeholder="Lời giải ngắn (chỉ giáo viên xem)"
        className={`${inputStyles} py-3 text-sm`}
      />

      {issues.length > 0 && (
        <ul className="rounded-xl bg-warn-soft p-3 text-sm text-warn">
          {issues.map((issue) => (
            <li key={issue}>• {issue}</li>
          ))}
        </ul>
      )}
    </Card>
  );
}
