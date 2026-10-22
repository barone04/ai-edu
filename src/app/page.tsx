import Link from "next/link";
import { Suspense } from "react";
import { ButtonLink, buttonStyles, Card, LoadingBlock } from "@/components/ui";
import { listLessons } from "@/server/repositories/lessons";
import { openDemoAction } from "./lessons/actions";

const dateFormat = new Intl.DateTimeFormat("vi-VN", { dateStyle: "short" });

async function LessonList() {
  const lessons = await listLessons();

  if (lessons.length === 0) {
    return (
      <p className="text-muted">
        Chưa có tiết học nào. Bấm &quot;Tạo tiết học mới&quot; để bắt đầu.
      </p>
    );
  }

  return (
    <ul className="flex flex-col divide-y divide-line">
      {lessons.map((lesson) => (
        <li key={lesson.id}>
          <Link
            href={`/lessons/${lesson.id}`}
            className="flex flex-col gap-0.5 py-3 hover:text-primary"
          >
            <span className="font-semibold">{lesson.title}</span>
            <span className="text-sm text-muted">
              Lớp {lesson.classroom.name} · {dateFormat.format(lesson.createdAt)}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function HomePage() {
  return (
    <>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Phát hiện lỗi sai, dạy bổ sung đúng chỗ</h1>
        <p className="text-muted">
          Kiểm tra nhanh trên giấy → nhập đáp án → xem học sinh sai ở đâu → in phiếu chữa lỗi →
          kiểm tra lại.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <ButtonLink href="/lessons/new">Tạo tiết học mới</ButtonLink>
        <form action={openDemoAction}>
          <button type="submit" className={`${buttonStyles.secondary} w-full`}>
            Xem bản mẫu
          </button>
        </form>
      </div>

      <Card>
        <h2 className="mb-2 text-lg font-bold">Tiết học của tôi</h2>
        <Suspense fallback={<LoadingBlock />}>
          <LessonList />
        </Suspense>
      </Card>
    </>
  );
}
