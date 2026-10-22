import { BookOpen, ChevronRight, Plus, School, Users, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { EmptyLessonsIllustration, PaperQuizIllustration } from "@/components/illustrations";
import { ProgressBar, STEP_META } from "@/components/lesson-steps";
import { ButtonLink, buttonStyles, Card, LoadingBlock } from "@/components/ui";
import { currentStep, lessonSteps, STEP_LABELS, type StepKey } from "@/server/lesson-progress";
import { countOverview, listLessons, progressInput } from "@/server/repositories/lessons";
import { openDemoAction } from "./lessons/actions";

const dateFormat = new Intl.DateTimeFormat("vi-VN", { dateStyle: "short" });

function Hero() {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary-strong p-6 text-white sm:p-8">
      <div className="relative z-[1] flex max-w-md flex-col gap-3">
        <p className="font-semibold text-white/80">Chào thầy cô!</p>
        <h1 className="text-2xl font-bold leading-snug sm:text-3xl">
          Biết học sinh sai ở đâu, dạy lại đúng chỗ
        </h1>
        <p className="text-white/85">
          Học sinh làm bài trên giấy. Thầy cô nhập đáp án, AI chỉ ra lỗi hiểu sai phổ biến và soạn
          phiếu chữa lỗi theo nhóm.
        </p>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/lessons/new" variant="secondary" className="gap-2 border-0">
            <Plus className="size-5" aria-hidden />
            Tạo tiết học mới
          </ButtonLink>
          <form action={openDemoAction}>
            <button
              type="submit"
              className={`${buttonStyles.primary} w-full border border-white/40 bg-white/10 hover:bg-white/20`}
            >
              Xem bản mẫu
            </button>
          </form>
        </div>
      </div>
      <PaperQuizIllustration className="pointer-events-none absolute -right-6 -bottom-4 hidden w-64 opacity-95 sm:block" />
    </section>
  );
}

function HowItWorks() {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-bold">Cách dùng trong 5 bước</h2>
      <ol className="grid grid-cols-1 gap-2 sm:grid-cols-5">
        {(Object.keys(STEP_META) as StepKey[]).map((key, index) => {
          const { icon: Icon, description } = STEP_META[key];
          return (
            <li
              key={key}
              className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3 sm:flex-col sm:items-start"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <Icon className="size-5" aria-hidden />
              </span>
              <span className="flex flex-col">
                <span className="font-semibold">
                  {index + 1}. {STEP_LABELS[key]}
                </span>
                <span className="text-sm text-muted">{description}</span>
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function StatTile({ icon: Icon, value, label }: { icon: LucideIcon; value: number; label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
        <Icon className="size-5" aria-hidden />
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-xl font-bold">{value}</span>
        <span className="text-sm text-muted">{label}</span>
      </span>
    </div>
  );
}

async function Overview() {
  const [stats, lessons] = await Promise.all([countOverview(), listLessons()]);

  return (
    <>
      <div className="grid grid-cols-3 gap-2 max-sm:[&>div]:flex-col max-sm:[&>div]:items-start">
        <StatTile icon={School} value={stats.classrooms} label="Lớp học" />
        <StatTile icon={BookOpen} value={stats.lessons} label="Tiết học" />
        <StatTile icon={Users} value={stats.pupils} label="Học sinh" />
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">Tiết học của tôi</h2>
        {lessons.length === 0 ? (
          <Card className="flex flex-col items-center gap-3 py-8 text-center">
            <EmptyLessonsIllustration className="w-40" />
            <p className="font-semibold">Chưa có tiết học nào</p>
            <p className="max-w-sm text-muted">
              Tạo tiết học đầu tiên, hoặc bấm &quot;Xem bản mẫu&quot; để xem một tiết học hoàn chỉnh.
            </p>
            <ButtonLink href="/lessons/new" className="mt-2 gap-2">
              <Plus className="size-5" aria-hidden />
              Tạo tiết học mới
            </ButtonLink>
          </Card>
        ) : (
          <ul className="flex flex-col gap-2">
            {lessons.map((lesson) => {
              const steps = lessonSteps(progressInput(lesson));
              const next = currentStep(steps);
              return (
                <li key={lesson.id}>
                  <Link
                    href={`/lessons/${lesson.id}`}
                    className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 transition-colors hover:border-primary"
                  >
                    <span className="flex min-w-0 flex-1 flex-col gap-2">
                      <span className="flex flex-wrap items-baseline justify-between gap-x-3">
                        <span className="font-semibold">{lesson.title}</span>
                        <span className="text-sm text-muted">
                          Lớp {lesson.classroom.name} · {dateFormat.format(lesson.createdAt)}
                        </span>
                      </span>
                      <ProgressBar steps={steps} />
                      <span className="text-sm font-medium text-primary">
                        {next ? `Tiếp theo: ${next.label}` : "Đã hoàn thành chu trình"}
                      </span>
                    </span>
                    <ChevronRight className="size-5 shrink-0 text-muted" aria-hidden />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}

export default function HomePage() {
  return (
    <>
      <Hero />
      <Suspense fallback={<LoadingBlock />}>
        <Overview />
      </Suspense>
      <HowItWorks />
    </>
  );
}
