"use client";

import { CheckCircle2, PenLine, Plus, Printer, RefreshCw, Sparkles, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { ButtonLink, buttonStyles, Card, inputStyles } from "@/components/ui";
import {
  blankQuestion,
  DIFFICULTIES,
  DIFFICULTY_LABELS,
  findQuestionIssues,
  type QuestionDraft,
} from "@/server/questions";
import type { QuizOptions } from "@/server/quiz-options";
import { OPTION_KEYS, type OptionKey } from "@/server/stats";
import { generateQuizAction, saveQuizAction } from "./actions";
import { QuizOptionsPanel } from "./quiz-options-panel";

const MAX_QUESTIONS = 10;

type Props = {
  lessonId: string;
  phase: "PRE" | "POST";
  initialDrafts: QuestionDraft[];
  approved: boolean;
  hasAnswers: boolean;
  fromAi: boolean;
  printHref: string;
  next: { href: string; label: string };
  // the follow-up quiz defaults to the same length as the first one
  defaultQuestionCount?: number;
};

export function QuizWorkspace(props: Props) {
  const [drafts, setDrafts] = useState(props.initialDrafts);
  const [editing, setEditing] = useState(!props.approved && props.initialDrafts.length > 0);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function generate(options: QuizOptions) {
    if (drafts.length > 0 && !window.confirm("Thay toàn bộ câu hỏi hiện tại bằng câu hỏi AI mới?")) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await generateQuizAction(props.lessonId, props.phase, options);
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
      <>
        <Card className="flex flex-col gap-5">
          <div className="flex items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <Sparkles className="size-6" aria-hidden />
            </span>
            <div>
              <h2 className="text-lg font-bold">Để AI soạn câu hỏi</h2>
              <p className="text-muted">
                Mỗi phương án sai ứng với một lỗi hiểu sai thường gặp, giúp biết học sinh đang vướng ở
                đâu.
              </p>
            </div>
          </div>
          {errorBox}
          <QuizOptionsPanel
            defaultQuestionCount={props.defaultQuestionCount}
            pending={pending}
            submitLabel="Tạo câu hỏi bằng AI"
            onGenerate={generate}
          />
        </Card>
        <button
          type="button"
          onClick={() => {
            setDrafts([blankQuestion(), blankQuestion(), blankQuestion()]);
            setEditing(true);
          }}
          disabled={pending}
          className={`${buttonStyles.secondary} gap-2`}
        >
          <PenLine className="size-5" aria-hidden />
          Tự soạn câu hỏi
        </button>
      </>
    );
  }

  if (!editing) {
    return (
      <>
        <p className="flex items-start gap-2 rounded-xl bg-primary-soft p-3 font-medium text-primary">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0" aria-hidden />
          Bộ câu hỏi đã được duyệt. In phiếu hoặc chép lên bảng cho học sinh làm trên giấy.
        </p>
        {drafts.map((draft, index) => (
          <QuestionSummary key={draft.id ?? index} index={index} draft={draft} />
        ))}
        <div className="grid gap-3 sm:grid-cols-2">
          <ButtonLink href={props.printHref} variant="secondary" className="gap-2">
            <Printer className="size-5" aria-hidden />
            In phiếu cho học sinh
          </ButtonLink>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className={`${buttonStyles.secondary} gap-2`}
          >
            <PenLine className="size-5" aria-hidden />
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
          key={draft.id ?? `new-${index}`}
          index={index}
          draft={draft}
          onChange={(updated) =>
            setDrafts((current) => current.map((d, i) => (i === index ? updated : d)))
          }
          onRemove={
            drafts.length > 1
              ? () => setDrafts((current) => current.filter((_, i) => i !== index))
              : undefined
          }
        />
      ))}
      {drafts.length < MAX_QUESTIONS && (
        <button
          type="button"
          onClick={() => setDrafts((current) => [...current, blankQuestion()])}
          className={`${buttonStyles.secondary} gap-2 border-dashed`}
        >
          <Plus className="size-5" aria-hidden />
          Thêm câu hỏi
        </button>
      )}
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
      {!props.hasAnswers &&
        (regenerating ? (
          <Card>
            <QuizOptionsPanel
              defaultQuestionCount={props.defaultQuestionCount}
              pending={pending}
              submitLabel="Tạo lại bằng AI"
              onGenerate={generate}
            />
          </Card>
        ) : (
          <button
            type="button"
            onClick={() => setRegenerating(true)}
            className={`${buttonStyles.secondary} gap-2`}
          >
            <RefreshCw className="size-5" aria-hidden />
            Tạo lại bằng AI
          </button>
        ))}
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
  onRemove,
}: {
  index: number;
  draft: QuestionDraft;
  onChange: (draft: QuestionDraft) => void;
  onRemove?: () => void;
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
        <div className="flex items-center gap-2">
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
          {onRemove && (
            <button
              type="button"
              onClick={onRemove}
              aria-label={`Xóa câu ${index + 1}`}
              className="flex size-12 items-center justify-center rounded-xl border border-line text-danger hover:bg-danger-soft"
            >
              <Trash2 className="size-5" aria-hidden />
            </button>
          )}
        </div>
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
