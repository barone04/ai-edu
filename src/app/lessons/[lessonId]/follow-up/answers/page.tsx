import { Suspense } from "react";
import { LoadingBlock } from "@/components/ui";
import { AnswerSection } from "../../answers/answer-section";

async function PostAnswers({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  return (
    <AnswerSection
      lessonId={lessonId}
      phase="POST"
      quizHref={`/lessons/${lessonId}/follow-up`}
      next={{ href: `/lessons/${lessonId}/report`, label: "Xem báo cáo trước/sau" }}
    />
  );
}

export default function FollowUpAnswersPage({
  params,
}: PageProps<"/lessons/[lessonId]/follow-up/answers">) {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <PostAnswers params={params} />
    </Suspense>
  );
}
