import { Suspense } from "react";
import { LoadingBlock } from "@/components/ui";
import { QuizSection } from "./quiz-section";

async function PreQuiz({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  return (
    <QuizSection
      lessonId={lessonId}
      phase="PRE"
      title="Tạo bài kiểm tra nhanh"
      next={{ href: `/lessons/${lessonId}/answers`, label: "Tiếp tục: Nhập kết quả" }}
    />
  );
}

export default function QuizPage({ params }: PageProps<"/lessons/[lessonId]/quiz">) {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <PreQuiz params={params} />
    </Suspense>
  );
}
