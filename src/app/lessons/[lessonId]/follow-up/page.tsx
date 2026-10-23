import { Suspense } from "react";
import { LoadingBlock } from "@/components/ui";
import { QuizSection } from "../quiz/quiz-section";

async function PostQuiz({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  return (
    <QuizSection
      lessonId={lessonId}
      phase="POST"
      title="Bài kiểm tra lại"
      next={{ href: `/lessons/${lessonId}/follow-up/answers`, label: "Tiếp tục: Nhập kết quả lần 2" }}
    />
  );
}

export default function FollowUpPage({ params }: PageProps<"/lessons/[lessonId]/follow-up">) {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <PostQuiz params={params} />
    </Suspense>
  );
}
