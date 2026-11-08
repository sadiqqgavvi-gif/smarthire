import { createElement, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, BookOpenCheck, CheckCircle2, Info, Mic } from "lucide-react";
import AppHeader from "../components/app/AppHeader";
import { getTrack } from "../components/app/tracks";

const DIFFICULTIES = [
  { value: "Easy", hint: "Core concepts" },
  { value: "Medium", hint: "Typical interview level" },
  { value: "Hard", hint: "Senior-level depth" },
];
const QUESTION_COUNTS = [5, 10, 15, 20];
const MOCK_QUESTION_COUNT = 10;

const MODES = [
  {
    value: "practice",
    title: "Practice session",
    icon: BookOpenCheck,
    text: "See a set of questions, answer at your own pace and get feedback on each one.",
  },
  {
    value: "mock",
    title: "Mock interview",
    icon: Mic,
    text: "One question at a time, listen and answer by voice, and finish with an overall score.",
  },
];

export default function ConfigurePractice() {
  const { type } = useParams();
  const navigate = useNavigate();
  const track = getTrack(type);
  const isBehavioral = decodeURIComponent(type).toLowerCase() === "behavioral";

  const [mode, setMode] = useState("practice");
  const [difficulty, setDifficulty] = useState("Medium");
  const [count, setCount] = useState(5);

  const isMock = mode === "mock";
  const showDifficulty = !isMock && !isBehavioral;

  const startSession = () => {
    const params = new URLSearchParams({
      count: String(isMock ? MOCK_QUESTION_COUNT : count),
      role: "",
      mode,
    });

    if (showDifficulty) {
      params.append("difficulty", difficulty);
    }

    navigate(isMock ? `/mock-interview/${type}?${params}` : `/practice/${type}?${params}`);
  };

  const summary = [
    isMock ? "Mock interview" : "Practice session",
    `${isMock ? MOCK_QUESTION_COUNT : count} questions`,
    showDifficulty ? difficulty : null,
  ].filter(Boolean);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <AppHeader />

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <a
          href="/#practice"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          All tracks
        </a>

        <div className="mt-6 flex items-start gap-4">
          <div
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-sm ${track.accent}`}
          >
            {createElement(track.icon, { className: "h-7 w-7" })}
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Set up your session</p>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
              {track.label} interview
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{track.description}</p>
          </div>
        </div>

        <div className="mt-8 space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-800 dark:bg-slate-900">
          {/* Session type */}
          <fieldset>
            <legend className="text-sm font-semibold text-slate-900 dark:text-white">
              1. Choose a session type
            </legend>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {MODES.map((option) => {
                const selected = mode === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setMode(option.value)}
                    className={`relative rounded-2xl border-2 p-4 text-left transition ${
                      selected
                        ? "border-blue-600 bg-blue-50/60 dark:border-blue-500 dark:bg-blue-500/10"
                        : "border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600"
                    }`}
                  >
                    {selected ? (
                      <CheckCircle2 className="absolute right-3 top-3 h-5 w-5 text-blue-600 dark:text-blue-400" />
                    ) : null}
                    {createElement(option.icon, {
                      className: `h-5 w-5 ${selected ? "text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-slate-400"}`,
                    })}
                    <p className="mt-3 font-semibold text-slate-900 dark:text-white">{option.title}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">{option.text}</p>
                  </button>
                );
              })}
            </div>
          </fieldset>

          {/* Difficulty */}
          {showDifficulty ? (
            <fieldset>
              <legend className="text-sm font-semibold text-slate-900 dark:text-white">
                2. Pick a difficulty
              </legend>
              <div className="mt-3 grid grid-cols-3 gap-3">
                {DIFFICULTIES.map((level) => {
                  const selected = difficulty === level.value;
                  return (
                    <button
                      key={level.value}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setDifficulty(level.value)}
                      className={`rounded-xl border-2 px-3 py-3 text-center transition ${
                        selected
                          ? "border-blue-600 bg-blue-50/60 dark:border-blue-500 dark:bg-blue-500/10"
                          : "border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600"
                      }`}
                    >
                      <p className="font-semibold text-slate-900 dark:text-white">{level.value}</p>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{level.hint}</p>
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ) : null}

          {/* Question count */}
          {!isMock ? (
            <fieldset>
              <legend className="text-sm font-semibold text-slate-900 dark:text-white">
                {showDifficulty ? "3." : "2."} Number of questions
              </legend>
              <div className="mt-3 grid grid-cols-4 gap-3">
                {QUESTION_COUNTS.map((value) => {
                  const selected = count === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setCount(value)}
                      className={`rounded-xl border-2 py-3 text-center font-semibold transition ${
                        selected
                          ? "border-blue-600 bg-blue-50/60 text-blue-700 dark:border-blue-500 dark:bg-blue-500/10 dark:text-blue-300"
                          : "border-slate-200 text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600"
                      }`}
                    >
                      {value}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ) : (
            <p className="flex items-start gap-2 rounded-xl bg-slate-50 p-4 text-sm text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
              Mock interviews have {MOCK_QUESTION_COUNT} questions of mixed difficulty. Use a quiet
              place if you plan to answer by voice.
            </p>
          )}

          {isBehavioral && !isMock ? (
            <p className="flex items-start gap-2 text-sm text-slate-500 dark:text-slate-400">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              Behavioral questions don't have difficulty levels. Structure your answers with the STAR
              method: Situation, Task, Action, Result.
            </p>
          ) : null}

          <div className="flex flex-col gap-4 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
            <div className="flex flex-wrap gap-2">
              {summary.map((item) => (
                <span
                  key={item}
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                >
                  {item}
                </span>
              ))}
            </div>
            <button
              type="button"
              onClick={startSession}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
            >
              {isMock ? "Start mock interview" : "Start practice session"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
