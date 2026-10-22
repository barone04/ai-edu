import { prisma } from "@/server/db";
import type { RemedialContent } from "@/server/remedial";
import type { Provenance } from "./assessments";

// The newest material is the one in use; older ones stay as history.
export async function getLatestMaterial(lessonId: string) {
  const material = await prisma.material.findFirst({
    where: { lessonId },
    orderBy: { createdAt: "desc" },
  });
  return material && { ...material, content: material.content as RemedialContent };
}

export async function createMaterial(
  lessonId: string,
  content: RemedialContent,
  provenance: Provenance,
): Promise<string> {
  const material = await prisma.material.create({
    data: {
      lessonId,
      content,
      teacherEdited: provenance === null,
      aiModel: provenance?.aiModel ?? null,
      promptVersion: provenance?.promptVersion ?? null,
    },
  });
  return material.id;
}

export async function updateMaterial(
  lessonId: string,
  materialId: string,
  content: RemedialContent,
): Promise<boolean> {
  const updated = await prisma.material.updateMany({
    where: { id: materialId, lessonId },
    data: { content, teacherEdited: true },
  });
  return updated.count === 1;
}
