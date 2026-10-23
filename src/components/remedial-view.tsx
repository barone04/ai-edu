import { GROUP_LABELS, GROUP_ORDER } from "@/server/groups";
import type { RemedialContent } from "@/server/remedial";
import type { StudentGroup } from "@/server/stats";

type Groups = Record<StudentGroup, string[]> | null;

// Teacher guide: the whole plan including answer keys.
export function TeacherGuide({ content, groups }: { content: RemedialContent; groups: Groups }) {
  return (
    <div className="flex flex-col gap-5">
      <Section title="Giải thích cho học sinh">
        <p className="whitespace-pre-line">{content.pupilExplanation}</p>
      </Section>

      <Section title="Hoạt động 5 phút">
        <ol className="flex flex-col gap-2">
          {content.teachingSteps.map((step, i) => (
            <li key={i} className="grid grid-cols-[5.5rem_1fr] gap-2">
              <span className="font-semibold text-accent">{step.time}</span>
              <span>{step.activity}</span>
            </li>
          ))}
        </ol>
      </Section>

      <Section title="Câu hỏi gợi mở">
        <ul className="flex list-disc flex-col gap-1 pl-5">
          {content.guidingQuestions.map((q, i) => (
            <li key={i}>{q}</li>
          ))}
        </ul>
      </Section>

      <Section title="Ví dụ mẫu">
        <WorkedExample example={content.workedExample} />
      </Section>

      {GROUP_ORDER.map((group) => (
        <Section key={group} title={`Phiếu ${GROUP_LABELS[group].long}`}>
          {groups && (
            <p className="text-sm text-muted">
              {groups[group].length > 0 ? groups[group].join(", ") : "Chưa có học sinh"}
            </p>
          )}
          <WorksheetBody sheet={content.worksheets[group]} withAnswers />
        </Section>
      ))}

      {content.materialsNeeded && (
        <Section title="Đồ dùng cần chuẩn bị">
          <p>{content.materialsNeeded}</p>
        </Section>
      )}
      {content.teacherTips.length > 0 && (
        <Section title="Lưu ý khi dạy">
          <ul className="flex list-disc flex-col gap-1 pl-5">
            {content.teacherTips.map((tip, i) => (
              <li key={i}>{tip}</li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}

// Pupil sheets: one A4 page per group, never with answers.
export function PupilSheets({
  content,
  groups,
  lessonTitle,
  className,
}: {
  content: RemedialContent;
  groups: Groups;
  lessonTitle: string;
  className: string;
}) {
  return (
    <div className="flex flex-col gap-6">
      {GROUP_ORDER.map((group) => (
        <article
          key={group}
          className="rounded-2xl border border-line bg-surface p-6 print:break-after-page print:rounded-none print:border-0 print:p-0"
        >
          <header className="mb-4 flex flex-col gap-1 border-b border-line pb-3">
            <p className="text-sm">
              Lớp {className} · {lessonTitle}
            </p>
            <h2 className="text-xl font-bold">Phiếu luyện tập {GROUP_LABELS[group].short}</h2>
            <p>Mã học sinh: ...................</p>
            {groups && groups[group].length > 0 && (
              <p className="text-xs text-muted">Phát cho: {groups[group].join(", ")}</p>
            )}
          </header>
          <WorksheetBody sheet={content.worksheets[group]} withAnswers={false} />
        </article>
      ))}
    </div>
  );
}

// Large type for projecting or copying onto the blackboard.
export function BoardView({ content }: { content: RemedialContent }) {
  return (
    <div className="flex flex-col gap-10 text-2xl leading-relaxed sm:text-3xl">
      <p className="whitespace-pre-line">{content.pupilExplanation}</p>
      <div className="flex flex-col gap-3">
        <p className="font-bold">{content.workedExample.problem}</p>
        {content.workedExample.steps.map((step, i) => (
          <p key={i}>{step}</p>
        ))}
        <p className="font-bold text-primary">{content.workedExample.answer}</p>
      </div>
      <ul className="flex flex-col gap-3">
        {content.guidingQuestions.map((q, i) => (
          <li key={i}>❓ {q}</li>
        ))}
      </ul>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2 break-inside-avoid">
      <h3 className="text-lg font-bold">{title}</h3>
      {children}
    </section>
  );
}

function WorkedExample({ example }: { example: RemedialContent["workedExample"] }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl bg-canvas p-3">
      <p className="font-semibold">{example.problem}</p>
      <ol className="flex list-decimal flex-col gap-0.5 pl-5">
        {example.steps.map((step, i) => (
          <li key={i}>{step}</li>
        ))}
      </ol>
      <p className="font-semibold text-primary">Đáp số: {example.answer}</p>
    </div>
  );
}

function WorksheetBody({
  sheet,
  withAnswers,
}: {
  sheet: RemedialContent["worksheets"][StudentGroup];
  withAnswers: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      {sheet.instructions && <p className="italic">{sheet.instructions}</p>}
      <ol className="flex flex-col gap-4">
        {sheet.exercises.map((exercise, i) => (
          <li key={i} className="flex flex-col gap-1">
            <p>
              <span className="font-semibold">Bài {i + 1}.</span> {exercise.prompt}
            </p>
            {withAnswers ? (
              <p className="text-sm text-primary">Đáp án: {exercise.answer}</p>
            ) : (
              <div className="h-16 border-b border-dashed border-line" aria-hidden />
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
