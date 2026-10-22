import "dotenv/config";
import { prisma } from "@/server/db";
import { ensureDemoLesson } from "@/server/demo/create-demo-lesson";

async function main() {
  const lessonId = await ensureDemoLesson(prisma);
  console.log(`demo lesson ready: ${lessonId}`);
}

main().finally(() => prisma.$disconnect());
