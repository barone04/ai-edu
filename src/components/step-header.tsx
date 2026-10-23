import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { STEP_LABELS, type StepKey } from "@/server/lesson-progress";
import { STEP_META } from "./lesson-steps";
import { DemoBadge } from "./ui";

const STEP_ORDER = Object.keys(STEP_LABELS) as StepKey[];

type Props = {
  lesson: { id: string; title: string; classroom: { name: string; isDemo: boolean } };
  step: StepKey;
  title: string;
};

export function StepHeader({ lesson, step, title }: Props) {
  const { icon: Icon, description } = STEP_META[step];
  return (
    <div className="flex flex-col gap-3">
      <Link
        href={`/lessons/${lesson.id}`}
        className="inline-flex items-center gap-1.5 self-start text-muted hover:text-primary"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {lesson.title} · Lớp {lesson.classroom.name}
      </Link>
      {lesson.classroom.isDemo && <DemoBadge />}
      <div className="flex items-center gap-3">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-white">
          <Icon className="size-6" aria-hidden />
        </span>
        <div>
          <p className="text-sm font-semibold text-accent">
            Bước {STEP_ORDER.indexOf(step) + 1}/{STEP_ORDER.length}
          </p>
          <h1 className="text-2xl font-bold leading-tight">{title}</h1>
        </div>
      </div>
      <p className="text-muted">{description}</p>
    </div>
  );
}
