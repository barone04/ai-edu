"use client";

import { Plus, Trash2 } from "lucide-react";
import { buttonStyles, Card, inputStyles } from "@/components/ui";
import { GROUP_LABELS, GROUP_ORDER } from "@/server/groups";
import type { RemedialContent } from "@/server/remedial";

type Props = { content: RemedialContent; onChange: (content: RemedialContent) => void };

export function RemedialEditor({ content, onChange }: Props) {
  const set = <K extends keyof RemedialContent>(key: K, value: RemedialContent[K]) =>
    onChange({ ...content, [key]: value });

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-3">
        <TextArea
          label="Giải thích cho học sinh"
          value={content.pupilExplanation}
          onChange={(v) => set("pupilExplanation", v)}
          rows={4}
        />
      </Card>

      <Card className="flex flex-col gap-3">
        <h3 className="font-bold">Hoạt động 5 phút</h3>
        <ListEditor
          items={content.teachingSteps}
          blank={{ time: "", activity: "" }}
          onChange={(items) => set("teachingSteps", items)}
          addLabel="Thêm bước"
          render={(step, update, index) => (
            <div className="grid flex-1 gap-2 sm:grid-cols-[7rem_1fr]">
              <input
                aria-label={`Thời gian bước ${index + 1}`}
                value={step.time}
                onChange={(e) => update({ ...step, time: e.target.value })}
                className={inputStyles}
              />
              <textarea
                aria-label={`Hoạt động bước ${index + 1}`}
                value={step.activity}
                onChange={(e) => update({ ...step, activity: e.target.value })}
                rows={2}
                className={`${inputStyles} py-3`}
              />
            </div>
          )}
        />
      </Card>

      <Card className="flex flex-col gap-3">
        <h3 className="font-bold">Câu hỏi gợi mở</h3>
        <StringList
          items={content.guidingQuestions}
          onChange={(items) => set("guidingQuestions", items)}
          label="Câu hỏi"
        />
      </Card>

      <Card className="flex flex-col gap-3">
        <h3 className="font-bold">Ví dụ mẫu</h3>
        <TextArea
          label="Đề bài"
          value={content.workedExample.problem}
          onChange={(v) => set("workedExample", { ...content.workedExample, problem: v })}
        />
        <StringList
          items={content.workedExample.steps}
          onChange={(steps) => set("workedExample", { ...content.workedExample, steps })}
          label="Bước giải"
        />
        <TextArea
          label="Đáp số"
          value={content.workedExample.answer}
          onChange={(v) => set("workedExample", { ...content.workedExample, answer: v })}
          rows={1}
        />
      </Card>

      {GROUP_ORDER.map((group) => {
        const sheet = content.worksheets[group];
        const setSheet = (next: typeof sheet) =>
          set("worksheets", { ...content.worksheets, [group]: next });
        return (
          <Card key={group} className="flex flex-col gap-3">
            <h3 className="font-bold">Phiếu {GROUP_LABELS[group].long}</h3>
            <TextArea
              label="Hướng dẫn"
              value={sheet.instructions}
              onChange={(v) => setSheet({ ...sheet, instructions: v })}
              rows={2}
            />
            <ListEditor
              items={sheet.exercises}
              blank={{ prompt: "", answer: "" }}
              onChange={(exercises) => setSheet({ ...sheet, exercises })}
              addLabel="Thêm bài"
              render={(exercise, update, index) => (
                <div className="flex flex-1 flex-col gap-2">
                  <textarea
                    aria-label={`${GROUP_LABELS[group].short} bài ${index + 1}`}
                    value={exercise.prompt}
                    onChange={(e) => update({ ...exercise, prompt: e.target.value })}
                    rows={2}
                    placeholder={`Bài ${index + 1}`}
                    className={`${inputStyles} py-3`}
                  />
                  <input
                    aria-label={`Đáp án ${GROUP_LABELS[group].short} bài ${index + 1}`}
                    value={exercise.answer}
                    onChange={(e) => update({ ...exercise, answer: e.target.value })}
                    placeholder="Đáp án (không in trên phiếu học sinh)"
                    className={`${inputStyles} text-sm`}
                  />
                </div>
              )}
            />
          </Card>
        );
      })}

      <Card className="flex flex-col gap-3">
        <TextArea
          label="Đồ dùng cần chuẩn bị"
          value={content.materialsNeeded}
          onChange={(v) => set("materialsNeeded", v)}
          rows={2}
        />
        <h3 className="font-bold">Lưu ý khi dạy</h3>
        <StringList
          items={content.teacherTips}
          onChange={(items) => set("teacherTips", items)}
          label="Lưu ý"
        />
      </Card>
    </div>
  );
}

function TextArea({
  label,
  value,
  onChange,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-semibold">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className={`${inputStyles} py-3`}
      />
    </label>
  );
}

function StringList({
  items,
  onChange,
  label,
}: {
  items: string[];
  onChange: (items: string[]) => void;
  label: string;
}) {
  return (
    <ListEditor
      items={items}
      blank=""
      onChange={onChange}
      addLabel={`Thêm ${label.toLowerCase()}`}
      render={(item, update, index) => (
        <input
          aria-label={`${label} ${index + 1}`}
          value={item}
          onChange={(e) => update(e.target.value)}
          className={`${inputStyles} flex-1`}
        />
      )}
    />
  );
}

function ListEditor<T>({
  items,
  blank,
  onChange,
  addLabel,
  render,
}: {
  items: T[];
  blank: T;
  onChange: (items: T[]) => void;
  addLabel: string;
  render: (item: T, update: (item: T) => void, index: number) => React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      {items.map((item, index) => (
        <div key={index} className="flex items-start gap-2">
          {render(item, (next) => onChange(items.map((it, i) => (i === index ? next : it))), index)}
          <button
            type="button"
            onClick={() => onChange(items.filter((_, i) => i !== index))}
            aria-label={`Xóa mục ${index + 1}`}
            className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-line text-danger hover:bg-danger-soft"
          >
            <Trash2 className="size-5" aria-hidden />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, blank])}
        className={`${buttonStyles.secondary} gap-2 self-start border-dashed`}
      >
        <Plus className="size-5" aria-hidden />
        {addLabel}
      </button>
    </div>
  );
}
