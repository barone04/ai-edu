import { Suspense } from "react";
import { LoadingBlock } from "@/components/ui";
import { AnswerSection } from "./answer-section";

async function PreAnswers({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  return (
    <AnswerSection
      lessonId={lessonId}
      phase="PRE"
      quizHref={`/lessons/${lessonId}/quiz`}
      next={{ href: `/lessons/${lessonId}/diagnosis`, label: "Tiếp tục: Xem lỗi sai" }}
    />
  );
}

export default function AnswersPage({ params }: PageProps<"/lessons/[lessonId]/answers">) {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <PreAnswers params={params} />
    </Suspense>
  );
}
