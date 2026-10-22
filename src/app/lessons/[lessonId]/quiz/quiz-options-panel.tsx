"use client";

import { ClipboardPaste, Sparkles } from "lucide-react";
import { useState } from "react";
import { buttonStyles, Chip, inputStyles } from "@/components/ui";
import {
  DEFAULT_QUIZ_OPTIONS,
  DIFFICULTY_MIXES,
  QUESTION_COUNTS,
  QUESTION_STYLES,
  type QuizOptions,
} from "@/server/quiz-options";

type Props = {
  defaultQuestionCount?: number;
  pending: boolean;
  submitLabel: string;
  onGenerate: (options: QuizOptions) => void;
};

export function QuizOptionsPanel({ defaultQuestionCount, pending, submitLabel, onGenerate }: Props) {
  const [options, setOptions] = useState<QuizOptions>({
    ...DEFAULT_QUIZ_OPTIONS,
    questionCount: defaultQuestionCount ?? DEFAULT_QUIZ_OPTIONS.questionCount,
  });
  const [showSource, setShowSource] = useState(false);
  const update = (patch: Partial<QuizOptions>) => setOptions((current) => ({ ...current, ...patch }));

  function toggleStyle(style: QuizOptions["styles"][number]) {
    const styles = options.styles.includes(style)
      ? options.styles.filter((s) => s !== style)
      : [...options.styles, style];
    update({ styles });
  }

  return (
    <div className="flex flex-col gap-5">
      <OptionGroup label="Số câu hỏi" hint="3 câu làm trong khoảng 5 phút.">
        {QUESTION_COUNTS.map((count) => (
          <Chip
            key={count}
            selected={options.questionCount === count}
            onClick={() => update({ questionCount: count })}
          >
            {count} câu
          </Chip>
        ))}
      </OptionGroup>

      <OptionGroup label="Dạng bài" hint="Chọn một hoặc nhiều dạng.">
        {(Object.keys(QUESTION_STYLES) as QuizOptions["styles"]).map((style) => (
          <Chip key={style} selected={options.styles.includes(style)} onClick={() => toggleStyle(style)}>
            {QUESTION_STYLES[style]}
          </Chip>
        ))}
      </OptionGroup>

      <OptionGroup label="Mức độ">
        {(Object.keys(DIFFICULTY_MIXES) as QuizOptions["difficulty"][]).map((difficulty) => (
          <Chip
            key={difficulty}
            selected={options.difficulty === difficulty}
            onClick={() => update({ difficulty })}
          >
            {DIFFICULTY_MIXES[difficulty]}
          </Chip>
        ))}
      </OptionGroup>

      {showSource ? (
        <label className="flex flex-col gap-1.5">
          <span className="font-semibold">Bài tập có sẵn</span>
          <textarea
            value={options.sourceExercises}
            onChange={(e) => update({ sourceExercises: e.target.value })}
            rows={5}
            placeholder="Dán bài tập từ sách, đề cũ hoặc trang web. AI sẽ chuyển thành câu trắc nghiệm có phân tích lỗi sai."
            className={`${inputStyles} py-3`}
          />
        </label>
      ) : (
        <button
          type="button"
          onClick={() => setShowSource(true)}
          className="inline-flex items-center gap-2 self-start font-semibold text-primary hover:underline"
        >
          <ClipboardPaste className="size-5" aria-hidden />
          Dán bài tập có sẵn
        </button>
      )}

      <label className="flex flex-col gap-1.5">
        <span className="font-semibold">Yêu cầu thêm cho AI (không bắt buộc)</span>
        <input
          value={options.extraInstructions}
          onChange={(e) => update({ extraInstructions: e.target.value })}
          placeholder="Ví dụ: dùng tình huống chia bánh, chia ruộng ở quê"
          className={inputStyles}
        />
      </label>

      <button
        type="button"
        onClick={() => onGenerate(options)}
        disabled={pending || options.styles.length === 0}
        className={`${buttonStyles.primary} gap-2`}
      >
        <Sparkles className="size-5" aria-hidden />
        {pending ? "AI đang soạn câu hỏi… (khoảng 10 giây)" : submitLabel}
      </button>
    </div>
  );
}

function OptionGroup({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 font-semibold">
        {label}
        {hint && <span className="ml-2 text-sm font-normal text-muted">{hint}</span>}
      </legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}
