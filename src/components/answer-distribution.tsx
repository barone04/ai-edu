import { OPTION_KEYS, type OptionKey, type QuestionStats } from "@/server/stats";

type Props = {
  index: number;
  content: string;
  options: Record<OptionKey, string>;
  correctOption: OptionKey;
  stats: QuestionStats;
};

const percent = (value: number) => `${Math.round(value * 100)}%`;

// Horizontal bars per option; every bar is direct-labelled so colour is never the only cue.
export function AnswerDistribution({ index, content, options, correctOption, stats }: Props) {
  const max = Math.max(1, ...OPTION_KEYS.map((key) => stats.distribution[key]));
  const topError = stats.errors[0];

  return (
    <figure className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4 break-inside-avoid">
      <figcaption className="flex items-start justify-between gap-3">
        <span className="font-semibold">
          Câu {index + 1}. {content}
        </span>
        <span className="shrink-0 rounded-full bg-canvas px-3 py-1 text-sm font-semibold">
          {percent(stats.correctRate)} đúng
        </span>
      </figcaption>

      <ul className="flex flex-col gap-1.5">
        {OPTION_KEYS.map((key) => {
          const count = stats.distribution[key];
          const correct = key === correctOption;
          return (
            <li
              key={key}
              className="grid grid-cols-[4.5rem_1fr_3rem] items-center gap-2 text-sm"
              title={`${key}. ${options[key]}: ${count} học sinh (${percent(stats.total ? count / stats.total : 0)})`}
            >
              <span className={`truncate ${correct ? "font-bold" : ""}`}>
                {key}. {options[key]}
              </span>
              <span className="h-5 rounded-r-[4px] bg-canvas">
                <span
                  className={`block h-full rounded-r-[4px] ${
                    correct ? "bg-chart-correct" : "bg-chart-wrong"
                  }`}
                  style={{ width: `${(count / max) * 100}%` }}
                />
              </span>
              <span className="text-right font-semibold tabular-nums">
                {count}
                {correct && " ✓"}
              </span>
            </li>
          );
        })}
      </ul>

      {topError && topError.misconception && (
        <p className="rounded-xl bg-accent-soft p-3 text-sm">
          <span className="font-semibold">
            {topError.count} em chọn {topError.option}:
          </span>{" "}
          có thể do {topError.misconception.charAt(0).toLowerCase() + topError.misconception.slice(1)}.
        </p>
      )}
    </figure>
  );
}
