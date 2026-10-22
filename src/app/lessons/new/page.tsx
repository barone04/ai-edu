import { Suspense } from "react";
import { Card, LoadingBlock } from "@/components/ui";
import { listClassrooms } from "@/server/repositories/lessons";
import { LessonForm } from "./lesson-form";

async function LessonFormLoader() {
  const classrooms = await listClassrooms();
  return <LessonForm classrooms={classrooms} />;
}

export default function NewLessonPage() {
  return (
    <>
      <h1 className="text-2xl font-bold">Tạo tiết học mới</h1>
      <Card>
        <Suspense fallback={<LoadingBlock />}>
          <LessonFormLoader />
        </Suspense>
      </Card>
    </>
  );
}
