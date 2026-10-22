"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/server/db";
import { ensureDemoLesson } from "@/server/demo/create-demo-lesson";
import { createLesson, deleteLesson, MAX_CLASS_SIZE } from "@/server/repositories/lessons";

export type LessonFormState = {
  errors?: Partial<Record<string, string>>;
  // echoed back so the form keeps what the teacher typed after a failed submit
  values?: Partial<Record<string, string>>;
};

const text = (max: number, message: string) => z.string().trim().min(1, message).max(max);

const lessonFields = {
  title: text(200, "Hãy nhập tên bài học."),
  learningObjective: text(1000, "Hãy nhập mục tiêu bài học."),
  referenceText: z.string().trim().max(4000, "Nội dung tham khảo tối đa 4000 ký tự."),
};

const lessonSchema = z.discriminatedUnion("classMode", [
  z.object({
    classMode: z.literal("existing"),
    classroomId: z.string().min(1, "Hãy chọn lớp."),
    ...lessonFields,
  }),
  z.object({
    classMode: z.literal("new"),
    className: text(50, "Hãy nhập tên lớp."),
    grade: z.coerce.number().int().min(4, "Chọn khối 4 hoặc 5.").max(5, "Chọn khối 4 hoặc 5."),
    // an empty input must read as missing, not as zero
    studentCount: z.preprocess(
      (value) => (value === "" ? undefined : value),
      z.coerce
        .number({ error: "Hãy nhập sĩ số." })
        .int("Sĩ số phải là số nguyên.")
        .min(1, "Sĩ số tối thiểu là 1.")
        .max(MAX_CLASS_SIZE, `Sĩ số tối đa là ${MAX_CLASS_SIZE}.`),
    ),
    ...lessonFields,
  }),
]);

export async function createLessonAction(
  _previous: LessonFormState,
  formData: FormData,
): Promise<LessonFormState> {
  const raw = Object.fromEntries(formData);
  const parsed = lessonSchema.safeParse(raw);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = String(issue.path[0] ?? "form");
      errors[field] ??= issue.message;
    }
    const values = Object.fromEntries(
      Object.entries(raw).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
    );
    return { errors, values };
  }

  const input = parsed.data;
  const lessonId = await createLesson({
    classroom:
      input.classMode === "existing"
        ? { id: input.classroomId }
        : { name: input.className, grade: input.grade, studentCount: input.studentCount },
    title: input.title,
    learningObjective: input.learningObjective,
    referenceText: input.referenceText || null,
  });

  redirect(`/lessons/${lessonId}`);
}

export async function deleteLessonAction(lessonId: string) {
  await deleteLesson(lessonId);
  redirect("/");
}

export async function openDemoAction() {
  const lessonId = await ensureDemoLesson(prisma);
  redirect(`/lessons/${lessonId}`);
}
