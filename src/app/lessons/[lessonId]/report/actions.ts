"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { prisma } from "@/server/db";

export async function saveObservationsAction(
  lessonId: string,
  observations: string,
): Promise<{ error?: string }> {
  const parsed = z.string().trim().max(2000).safeParse(observations);
  if (!parsed.success) return { error: "Nhận xét tối đa 2000 ký tự." };
  await prisma.lesson.update({
    where: { id: lessonId },
    data: { teacherObservations: parsed.data || null },
  });
  refresh();
  return {};
}
