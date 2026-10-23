import { ArrowLeft, BookOpen } from "lucide-react";
import Link from "next/link";
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
      <Link href="/" className="inline-flex items-center gap-1.5 self-start text-muted hover:text-primary">
        <ArrowLeft className="size-4" aria-hidden />
        Trang chủ
      </Link>
      <div className="flex items-center gap-3">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-white">
          <BookOpen className="size-6" aria-hidden />
        </span>
        <div>
          <h1 className="text-2xl font-bold leading-tight">Tạo tiết học mới</h1>
          <p className="text-muted">Chỉ mất khoảng 1 phút.</p>
        </div>
      </div>
      <Card>
        <Suspense fallback={<LoadingBlock />}>
          <LessonFormLoader />
        </Suspense>
      </Card>
    </>
  );
}
