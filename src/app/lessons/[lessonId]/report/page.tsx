import { ArrowLeft, TrendingDown, TrendingUp } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PrintButton } from "@/components/print-button";
import { ButtonLink, Card, DemoBadge, LoadingBlock } from "@/components/ui";
import { followUpRecommendation } from "@/server/report";
import { getLatestMaterial } from "@/server/repositories/materials";
import { loadAssessmentResults, type ConfirmedDiagnosis } from "@/server/repositories/results";
import { compareAssessments } from "@/server/stats";
import { ObservationsForm } from "./observations-form";

const percent = (value: number) => `${Math.round(value * 100)}%`;
const dateFormat = new Intl.DateTimeFormat("vi-VN", { dateStyle: "long" });

async function Report({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  const [pre, post, material] = await Promise.all([
    loadAssessmentResults(lessonId, "PRE"),
    loadAssessmentResults(lessonId, "POST"),
    getLatestMaterial(lessonId),
  ]);
  if (!pre || !post) notFound();
  const { lesson } = pre;

  if (pre.stats.totalAnswers === 0 || post.stats.totalAnswers === 0) {
    return (
      <Card className="flex flex-col gap-3">
        <h1 className="text-xl font-bold">Báo cáo trước/sau</h1>
        <p>Cần có kết quả của cả bài kiểm tra đầu và bài kiểm tra lại.</p>
        <ButtonLink href={`/lessons/${lesson.id}`}>Về tiết học</ButtonLink>
      </Card>
    );
  }

  const comparison = compareAssessments(pre.stats, post.stats);
  const confirmed = pre.diagnosis?.confirmedMisconceptions as ConfirmedDiagnosis | undefined;
  const followUpCodes = post.stats.students
    ?.filter((s) => s.group !== "EXTEND")
    .map((s) => post.studentCodes.get(s.studentId) ?? "?")
    .sort();
  const improved = comparison.differencePoints >= 0;
  const DeltaIcon = improved ? TrendingUp : TrendingDown;

  return (
    <>
      <div className="flex items-center justify-between gap-3 print:hidden">
        <Link
          href={`/lessons/${lesson.id}`}
          className="inline-flex items-center gap-1.5 text-muted hover:text-primary"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Về tiết học
        </Link>
        <PrintButton label="In báo cáo" />
      </div>

      <article className="flex flex-col gap-6 rounded-2xl border border-line bg-surface p-5 sm:p-8 print:rounded-none print:border-0 print:p-0">
        <header className="flex flex-col gap-2">
          {lesson.classroom.isDemo && (
            <div className="flex flex-col gap-1">
              <DemoBadge />
              <p className="text-sm font-semibold text-warn">
                Số liệu giả lập để minh họa giao diện, không phải kết quả thử nghiệm thật.
              </p>
            </div>
          )}
          <p className="text-sm text-muted">Báo cáo tiết học · {dateFormat.format(new Date())}</p>
          <h1 className="text-2xl font-bold">{lesson.title}</h1>
          <p>
            Lớp {lesson.classroom.name} · Khối {lesson.classroom.grade} · {lesson.subject}
          </p>
          <p>
            <span className="font-semibold">Mục tiêu: </span>
            {lesson.learningObjective}
          </p>
        </header>

        <Section title="1. Vấn đề phát hiện">
          <p>
            Bài kiểm tra nhanh đầu tiết: <strong>{percent(comparison.preCorrectRate)}</strong> câu trả
            lời đúng.
          </p>
          {confirmed && confirmed.items.length > 0 && (
            <ul className="flex list-disc flex-col gap-1 pl-5">
              {confirmed.items.map((item) => (
                <li key={item.misconception}>
                  {item.misconception} <span className="text-muted">({item.count} lượt chọn)</span>
                </li>
              ))}
            </ul>
          )}
          {confirmed?.note && <p className="text-muted">Giáo viên nhận xét: {confirmed.note}</p>}
        </Section>

        {material && (
          <Section title="2. Hoạt động dạy bổ sung">
            <ol className="flex flex-col gap-1">
              {material.content.teachingSteps.map((step, i) => (
                <li key={i}>
                  <span className="font-semibold">{step.time}:</span> {step.activity}
                </li>
              ))}
            </ol>
            <p className="text-sm text-muted">
              Phiếu luyện tập phân hóa 3 nhóm A/B/C.{" "}
              {material.aiModel
                ? `Soạn với AI (${material.aiModel}, ${material.promptVersion})${
                    material.teacherEdited ? ", giáo viên đã chỉnh sửa." : ", giáo viên đã duyệt."
                  }`
                : "Giáo viên tự soạn."}
            </p>
          </Section>
        )}

        <Section title="3. Kết quả trước và sau">
          <div className="grid grid-cols-3 gap-2">
            <BigNumber label="Trước" value={percent(comparison.preCorrectRate)} />
            <BigNumber label="Sau" value={percent(comparison.postCorrectRate)} />
            <div className="flex flex-col items-start rounded-2xl bg-canvas p-3">
              <span className="inline-flex items-center gap-1 text-2xl font-bold">
                <DeltaIcon className="size-6" aria-hidden />
                {improved ? "+" : ""}
                {Math.round(comparison.differencePoints)}
              </span>
              <span className="text-sm text-muted">điểm phần trăm</span>
            </div>
          </div>
          <RateBars pre={comparison.preCorrectRate} post={comparison.postCorrectRate} />
          {pre.questions.length === post.questions.length && (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line text-muted">
                  <th className="py-2 font-semibold">Câu (tương đương)</th>
                  <th className="py-2 text-right font-semibold">Trước</th>
                  <th className="py-2 text-right font-semibold">Sau</th>
                </tr>
              </thead>
              <tbody>
                {pre.stats.questions.map((question, i) => (
                  <tr key={question.questionId} className="border-b border-line last:border-0">
                    <td className="py-2">Câu {i + 1}</td>
                    <td className="py-2 text-right tabular-nums">{percent(question.correctRate)}</td>
                    <td className="py-2 text-right tabular-nums">
                      {percent(post.stats.questions[i].correctRate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p className="text-sm text-muted">
            Đây là kết quả mô tả trong một lớp, với hai bộ câu hỏi tương đương. Chênh lệch không chứng
            minh chắc chắn hiệu quả của riêng hoạt động dạy bổ sung.
          </p>
        </Section>

        <Section title="4. Điều cần theo dõi tiếp">
          {comparison.remainingMisconceptions.length > 0 ? (
            <ul className="flex list-disc flex-col gap-1 pl-5">
              {comparison.remainingMisconceptions.map((m) => (
                <li key={m.misconception}>
                  {m.misconception} <span className="text-muted">({m.count} lượt chọn)</span>
                </li>
              ))}
            </ul>
          ) : (
            <p>Bài kiểm tra lại không còn lỗi hiểu sai đã biết.</p>
          )}
          {followUpCodes && (
            <p>
              <strong>{followUpCodes.length}</strong> học sinh chưa làm đúng hết
              {followUpCodes.length > 0 && `: ${followUpCodes.join(", ")}`}.
            </p>
          )}
          <p className="rounded-xl bg-primary-soft p-3">
            <strong>Đề xuất: </strong>
            {followUpRecommendation(comparison)}
          </p>
        </Section>

        <Section title="5. Nhận xét của giáo viên">
          {lesson.teacherObservations && (
            <p className="hidden whitespace-pre-line print:block">{lesson.teacherObservations}</p>
          )}
          <ObservationsForm lessonId={lesson.id} initial={lesson.teacherObservations ?? ""} />
        </Section>
      </article>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 break-inside-avoid">
      <h2 className="text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}

function BigNumber({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col rounded-2xl bg-canvas p-3">
      <span className="text-2xl font-bold">{value}</span>
      <span className="text-sm text-muted">{label} · tỷ lệ đúng</span>
    </div>
  );
}

// One measure at two points in time: same hue for both bars, each direct-labelled.
function RateBars({ pre, post }: { pre: number; post: number }) {
  return (
    <ul className="flex flex-col gap-2" aria-label="Tỷ lệ trả lời đúng trước và sau">
      {[
        { label: "Trước", value: pre },
        { label: "Sau", value: post },
      ].map((bar) => (
        <li key={bar.label} className="grid grid-cols-[3.5rem_1fr_3rem] items-center gap-2 text-sm">
          <span className="font-semibold">{bar.label}</span>
          <span className="h-6 rounded-r-[4px] bg-canvas">
            <span
              className="block h-full rounded-r-[4px] bg-chart-correct print:bg-black"
              style={{ width: `${Math.max(bar.value * 100, 1)}%` }}
            />
          </span>
          <span className="text-right font-semibold tabular-nums">{percent(bar.value)}</span>
        </li>
      ))}
    </ul>
  );
}

export default function ReportPage({ params }: PageProps<"/lessons/[lessonId]/report">) {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <Report params={params} />
    </Suspense>
  );
}
