"use client";

import { useActionState, useState } from "react";
import { buttonStyles, Field, inputStyles } from "@/components/ui";
import { createLessonAction, type LessonFormState } from "../actions";

type ClassroomOption = { id: string; name: string; grade: number; studentCount: number };

export function LessonForm({ classrooms }: { classrooms: ClassroomOption[] }) {
  const [state, formAction, pending] = useActionState<LessonFormState, FormData>(
    createLessonAction,
    {},
  );
  const [classMode, setClassMode] = useState<"existing" | "new">(
    classrooms.length > 0 ? "existing" : "new",
  );
  const errors = state.errors ?? {};
  const values = state.values ?? {};

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="classMode" value={classMode} />

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 font-semibold">Lớp học</legend>
        {classrooms.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {(["existing", "new"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setClassMode(mode)}
                aria-pressed={classMode === mode}
                className={classMode === mode ? buttonStyles.primary : buttonStyles.secondary}
              >
                {mode === "existing" ? "Lớp đã có" : "Lớp mới"}
              </button>
            ))}
          </div>
        )}

        {classMode === "existing" ? (
          <Field label="Chọn lớp" error={errors.classroomId}>
            <select
              name="classroomId"
              className={inputStyles}
              defaultValue={values.classroomId ?? classrooms[0]?.id}
            >
              {classrooms.map((c) => (
                <option key={c.id} value={c.id}>
                  Lớp {c.name} · khối {c.grade} · {c.studentCount} học sinh
                </option>
              ))}
            </select>
          </Field>
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Tên lớp" error={errors.className}>
              <input
                name="className"
                placeholder="4A"
                defaultValue={values.className}
                className={inputStyles}
              />
            </Field>
            <Field label="Khối" error={errors.grade}>
              <select name="grade" defaultValue={values.grade ?? "4"} className={inputStyles}>
                <option value="4">Lớp 4</option>
                <option value="5">Lớp 5</option>
              </select>
            </Field>
            <Field label="Sĩ số" error={errors.studentCount}>
              <input
                name="studentCount"
                type="number"
                inputMode="numeric"
                min={1}
                max={50}
                placeholder="30"
                defaultValue={values.studentCount}
                className={inputStyles}
              />
            </Field>
          </div>
        )}
        {classMode === "new" && (
          <p className="text-sm text-muted">
            Học sinh được đánh mã H01, H02… Không cần nhập tên thật.
          </p>
        )}
      </fieldset>

      <Field label="Tên bài học" error={errors.title}>
        <input
          name="title"
          placeholder="Phép cộng phân số khác mẫu số"
          defaultValue={values.title}
          className={inputStyles}
        />
      </Field>

      <Field
        label="Mục tiêu bài học"
        hint="Học sinh cần hiểu hoặc làm được gì sau bài này?"
        error={errors.learningObjective}
      >
        <textarea
          name="learningObjective"
          rows={3}
          defaultValue={values.learningObjective}
          className={`${inputStyles} py-3`}
        />
      </Field>

      <Field
        label="Nội dung kiến thức (không bắt buộc)"
        hint="Chép quy tắc hoặc ví dụ trong sách giáo khoa để AI bám sát bài dạy."
        error={errors.referenceText}
      >
        <textarea
          name="referenceText"
          rows={4}
          defaultValue={values.referenceText}
          className={`${inputStyles} py-3`}
        />
      </Field>

      <button type="submit" disabled={pending} className={buttonStyles.primary}>
        {pending ? "Đang lưu…" : "Lưu tiết học"}
      </button>
    </form>
  );
}
