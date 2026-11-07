import { createElement } from "react";
import { AlertTriangle, Lightbulb, MessageSquareText, ThumbsUp } from "lucide-react";
import { getScoreTone, toScore } from "./scoreTone";

const SECTIONS = [
  { key: "strengths", label: "Strengths", icon: ThumbsUp, color: "text-emerald-600 dark:text-emerald-400" },
  { key: "weaknesses", label: "Weaknesses", icon: AlertTriangle, color: "text-amber-600 dark:text-amber-400" },
  { key: "improvement", label: "How to improve", icon: Lightbulb, color: "text-blue-600 dark:text-blue-400" },
];

// Shows one AI evaluation: score, rating, strengths, weaknesses, improvement and overall feedback.
export default function FeedbackPanel({ evaluation, title = "AI feedback", action = null }) {
  if (!evaluation) return null;

  const score = toScore(evaluation.score);
  const hasScore = score !== null;
  const tone = getScoreTone(evaluation.score);
  const overall = evaluation.overall_feedback || evaluation.feedback;

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 dark:border-slate-700 dark:bg-slate-800/50">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-slate-900 dark:text-white">{title}</h3>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${tone.badge}`}>
            {tone.label}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Score:{" "}
            <span className="text-xl font-bold text-slate-900 dark:text-white">
              {hasScore ? score : "N/A"}
            </span>
            {hasScore ? <span className="text-slate-400">/10</span> : null}
          </p>
          {action}
        </div>
      </div>

      {hasScore ? (
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${Math.min(score, 10) * 10}%` }} />
        </div>
      ) : null}

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {SECTIONS.map(({ key, label, icon, color }) => (
          <div key={key} className="rounded-xl bg-white p-4 dark:bg-slate-900">
            <p className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wider ${color}`}>
              {createElement(icon, { className: "h-4 w-4" })}
              {label}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
              {evaluation[key] || "—"}
            </p>
          </div>
        ))}
      </div>

      {overall ? (
        <div className="mt-4 flex gap-3 rounded-xl bg-white p-4 dark:bg-slate-900">
          <MessageSquareText className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
          <p className="text-sm leading-6 text-slate-700 dark:text-slate-300">
            <span className="font-semibold text-slate-900 dark:text-white">Overall feedback: </span>
            {overall}
          </p>
        </div>
      ) : null}
    </div>
  );
}
