import { createElement, useState } from "react";
import {
  AlertTriangle,
  BookOpen,
  ChevronDown,
  Lightbulb,
  MessageSquareText,
  MicVocal,
  ThumbsUp,
} from "lucide-react";
import { getScoreTone, toScore } from "./scoreTone";

const SECTIONS = [
  { key: "strengths", label: "Strengths", icon: ThumbsUp, color: "text-emerald-700 dark:text-emerald-400" },
  { key: "weaknesses", label: "Weaknesses", icon: AlertTriangle, color: "text-amber-700 dark:text-amber-400" },
  { key: "improvement", label: "How to improve", icon: Lightbulb, color: "text-blue-600 dark:text-blue-400" },
];

const STRONG_ANSWER_GUIDES = {
  behavioral: [
    ["Situation", "Set the scene in one or two sentences: where you were and what was happening."],
    ["Task", "Explain your responsibility or the goal you had to achieve."],
    ["Action", "Describe the specific steps you took. Use \"I\", not only \"we\"."],
    ["Result", "Share the outcome, ideally with a number, and what you learned."],
  ],
  situational: [
    ["Understand", "Clarify the problem, the goal and the constraints first."],
    ["Communicate", "Say who you would involve: your manager, team or the client."],
    ["Decide", "Compare options, weigh the risks and explain your choice."],
    ["Follow through", "Describe how you would deliver, check results and prevent it next time."],
  ],
};

// Renders reference answers that may contain fenced code blocks.
function ReferenceAnswer({ text }) {
  const parts = String(text).split(/```[a-zA-Z]*\n?/);
  return (
    <div className="space-y-3 text-sm leading-6 text-slate-700 dark:text-slate-300">
      {parts.map((part, index) =>
        index % 2 === 1 ? (
          <pre
            key={index}
            className="overflow-x-auto rounded-xl bg-slate-900 p-4 text-xs leading-5 text-slate-100 dark:bg-black/60"
          >
            <code>{part.trim()}</code>
          </pre>
        ) : (
          part
            .split(/\n{2,}/)
            .map((paragraph) => paragraph.replace(/[`*_]/g, "").trim())
            .filter(Boolean)
            .map((paragraph, i) => <p key={`${index}-${i}`}>{paragraph}</p>)
        )
      )}
    </div>
  );
}

function CriteriaBars({ criteria }) {
  return (
    <div className="mt-5 grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-5">
      {criteria.map((criterion) => {
        const tone = getScoreTone(criterion.score);
        return (
          <div key={criterion.key}>
            <div className="flex justify-between text-xs">
              <span className="font-medium text-slate-600 dark:text-slate-300">{criterion.label}</span>
              <span className="font-semibold text-slate-900 dark:text-white">{criterion.score}</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
              <div
                className={`h-full rounded-full ${tone.bar}`}
                style={{ width: `${Math.min(criterion.score, 10) * 10}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Shows one evaluation: score, rating, criteria breakdown, strengths, weaknesses,
// improvement, overall feedback, missing concepts, filler words and a model answer.
export default function FeedbackPanel({ evaluation, title = "AI feedback", action = null, category = "" }) {
  const [showModel, setShowModel] = useState(false);
  if (!evaluation) return null;

  const score = toScore(evaluation.score);
  const hasScore = score !== null;
  const tone = getScoreTone(evaluation.score);
  const overall = evaluation.overall_feedback || evaluation.feedback;
  const criteria = Array.isArray(evaluation.criteria) ? evaluation.criteria : [];
  const missingConcepts = Array.isArray(evaluation.missingConcepts) ? evaluation.missingConcepts : [];
  const fillerWords = evaluation.fillerWords?.count ? evaluation.fillerWords : null;
  const guide = STRONG_ANSWER_GUIDES[String(category).toLowerCase()];
  const hasModel = Boolean(evaluation.referenceAnswer) || Boolean(guide);

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3 sm:p-5 dark:border-slate-700 dark:bg-slate-800/50">
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
            {hasScore ? <span className="text-slate-500 dark:text-slate-400">/10</span> : null}
          </p>
          {action}
        </div>
      </div>

      {hasScore ? (
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${Math.min(score, 10) * 10}%` }} />
        </div>
      ) : null}

      {criteria.length ? <CriteriaBars criteria={criteria} /> : null}

      <div className="mt-5 grid gap-3 sm:gap-4 md:grid-cols-3">
        {SECTIONS.map(({ key, label, icon, color }) => (
          <div key={key} className="rounded-xl bg-white p-3 sm:p-4 dark:bg-slate-900">
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

      {missingConcepts.length || fillerWords ? (
        <div className="mt-4 flex flex-col gap-3 rounded-xl bg-white p-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-6 dark:bg-slate-900">
          {missingConcepts.length ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Try to mention
              </span>
              {missingConcepts.map((concept) => (
                <span
                  key={concept}
                  className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30"
                >
                  {concept}
                </span>
              ))}
            </div>
          ) : null}
          {fillerWords ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <MicVocal className="h-3.5 w-3.5" />
                Filler words
              </span>
              {fillerWords.words.map((item) => (
                <span
                  key={item.word}
                  className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  “{item.word}” ×{item.count}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {overall ? (
        <div className="mt-4 flex gap-3 rounded-xl bg-white p-3 sm:p-4 dark:bg-slate-900">
          <MessageSquareText className="mt-0.5 h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" />
          <p className="text-sm leading-6 text-slate-700 dark:text-slate-300">
            <span className="font-semibold text-slate-900 dark:text-white">Overall feedback: </span>
            {overall}
          </p>
        </div>
      ) : null}

      {hasModel ? (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
          <button
            type="button"
            onClick={() => setShowModel((open) => !open)}
            aria-expanded={showModel}
            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white"
          >
            <span className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-indigo-500" />
              {evaluation.referenceAnswer ? "See a model answer" : "What a strong answer includes"}
            </span>
            <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${showModel ? "rotate-180" : ""} dark:text-slate-400`} />
          </button>
          {showModel ? (
            <div className="border-t border-slate-200 px-4 py-4 dark:border-slate-700">
              {evaluation.referenceAnswer ? (
                <>
                  <ReferenceAnswer text={evaluation.referenceAnswer} />
                  <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">From the SmartHire question bank.</p>
                </>
              ) : (
                <ol className="space-y-3">
                  {guide.map(([label, text], index) => (
                    <li key={label} className="flex gap-3 text-sm">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
                        {index + 1}
                      </span>
                      <p className="leading-6 text-slate-700 dark:text-slate-300">
                        <span className="font-semibold text-slate-900 dark:text-white">{label}: </span>
                        {text}
                      </p>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
