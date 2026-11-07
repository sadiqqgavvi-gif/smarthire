// src/components/Hero.jsx
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  Mic,
  PlayCircle,
  Sparkles,
  TrendingUp,
} from "lucide-react";

// Real numbers from the bundled question bank (smarthire-server/topics).
const STATS = [
  { value: "30,000+", label: "Practice questions" },
  { value: "3", label: "Interview tracks" },
  { value: "25", label: "Technical topics" },
  { value: "Instant", label: "AI feedback" },
];

const TRUST_POINTS = ["Free to start", "Sign up with Google", "Voice or text answers"];

const FEEDBACK_BARS = [
  { label: "Relevance", value: 90 },
  { label: "Structure", value: 80 },
  { label: "Clarity", value: 75 },
];

export default function Hero() {
  return (
    <section
      id="home"
      className="relative overflow-hidden bg-white px-4 pb-20 pt-28 sm:px-6 sm:pt-32 lg:px-8 lg:pb-28 dark:bg-slate-950"
    >
      <HeroBackground />

      <div className="relative mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
        {/* Copy */}
        <div className="text-center lg:text-left">
          <div className="motion-safe:animate-fade-up inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300">
            <Sparkles className="h-4 w-4" />
            Your AI interview coach
          </div>

          <h1 className="motion-safe:animate-fade-up mt-6 text-4xl font-bold tracking-tight text-slate-900 [animation-delay:80ms] sm:text-5xl lg:text-6xl dark:text-white">
            Walk into your next interview{" "}
            <span className="whitespace-nowrap bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400">
              ready to win it
            </span>
          </h1>

          <p className="motion-safe:animate-fade-up mx-auto mt-6 max-w-xl text-lg leading-8 text-slate-600 [animation-delay:160ms] lg:mx-0 dark:text-slate-400">
            Practice real technical, behavioral and situational questions, answer by voice or text,
            and get instant AI feedback on what to improve before it counts.
          </p>

          <div className="motion-safe:animate-fade-up mt-9 flex flex-col items-center gap-3 [animation-delay:240ms] sm:flex-row sm:justify-center lg:justify-start">
            <Link
              to="/signup"
              className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:-translate-y-0.5 hover:bg-blue-700 sm:w-auto"
            >
              Start practicing free
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </Link>
            <a
              href="#practice"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-7 py-3.5 text-base font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 sm:w-auto dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <PlayCircle className="h-5 w-5" />
              Explore interview tracks
            </a>
          </div>

          <ul className="motion-safe:animate-fade-up mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-500 [animation-delay:320ms] lg:justify-start dark:text-slate-400">
            {TRUST_POINTS.map((point) => (
              <li key={point} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                {point}
              </li>
            ))}
          </ul>
        </div>

        {/* Product preview */}
        <div className="motion-safe:animate-fade-up relative mx-auto w-full max-w-lg [animation-delay:200ms] lg:max-w-none">
          <InterviewPreview />
        </div>
      </div>

      {/* Stats */}
      <div className="relative mx-auto mt-20 max-w-5xl">
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 sm:grid-cols-4 dark:border-slate-800 dark:bg-slate-800">
          {STATS.map((stat) => (
            <div key={stat.label} className="bg-white/90 px-6 py-6 text-center backdrop-blur dark:bg-slate-900/90">
              <dt className="text-sm text-slate-500 dark:text-slate-400">{stat.label}</dt>
              <dd className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

function HeroBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      {/* soft grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.12)_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_30%,black,transparent)]" />
      {/* glows */}
      <div className="absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-400/25 via-indigo-400/20 to-purple-400/25 blur-3xl dark:from-blue-600/20 dark:via-indigo-600/15 dark:to-purple-600/20" />
      <div className="absolute -right-32 top-1/2 h-72 w-72 rounded-full bg-purple-400/20 blur-3xl dark:bg-purple-600/15" />
    </div>
  );
}

// An illustrative preview of a SmartHire practice answer and its AI feedback.
function InterviewPreview() {
  return (
    <div className="relative">
      <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-blue-500/20 to-purple-500/20 blur-2xl" />

      <div className="relative rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-2xl shadow-slate-900/10 backdrop-blur sm:p-6 dark:border-slate-700/80 dark:bg-slate-900/95 dark:shadow-black/40">
        {/* header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 text-white">
              <BrainCircuit className="h-5 w-5" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Mock Interview</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Behavioral · Question 3 of 5</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 dark:bg-red-500/10 dark:text-red-400">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500 motion-safe:animate-pulse" />
            Recording
          </span>
        </div>

        {/* question */}
        <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-left dark:bg-slate-800/70">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            Question
          </p>
          <p className="mt-1.5 text-sm font-medium leading-6 text-slate-800 dark:text-slate-100">
            Tell me about a time you handled a conflict within your team.
          </p>
        </div>

        {/* answer */}
        <div className="mt-3 flex items-start gap-3 rounded-2xl border border-dashed border-slate-200 p-4 text-left dark:border-slate-700">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
            <Mic className="h-4 w-4" />
          </div>
          <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
            “In my final-year project, two teammates disagreed on the database design. I set up a
            short meeting, listed the trade-offs…”
            <span className="ml-0.5 inline-block h-4 w-0.5 translate-y-0.5 bg-blue-500 motion-safe:animate-pulse" />
          </p>
        </div>

        {/* feedback */}
        <div className="mt-4 grid gap-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-4 text-left text-white sm:grid-cols-[auto_1fr] dark:from-slate-800 dark:to-slate-800/60">
          <ScoreRing score={8.4} />
          <div className="space-y-2.5">
            {FEEDBACK_BARS.map((bar) => (
              <div key={bar.label}>
                <div className="flex justify-between text-xs text-slate-300">
                  <span>{bar.label}</span>
                  <span>{bar.value}%</span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-white/10">
                  <div
                    className="h-1.5 rounded-full bg-gradient-to-r from-blue-400 to-purple-400"
                    style={{ width: `${bar.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* floating chips */}
      <div className="motion-safe:animate-float absolute -top-5 right-6 hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-lg sm:flex dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        STAR structure detected
      </div>
      <div className="motion-safe:animate-float absolute -bottom-5 left-6 hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-lg [animation-delay:1.5s] sm:flex dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
        <TrendingUp className="h-4 w-4 text-blue-500" />
        Tip: add a measurable result
      </div>
    </div>
  );
}

function ScoreRing({ score }) {
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 10) * circumference;

  return (
    <div className="flex items-center gap-3 sm:flex-col sm:justify-center sm:gap-1">
      <div className="relative h-20 w-20">
        <svg viewBox="0 0 72 72" className="h-20 w-20 -rotate-90">
          <circle cx="36" cy="36" r={radius} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="7" />
          <circle
            cx="36"
            cy="36"
            r={radius}
            fill="none"
            stroke="url(#heroScoreGradient)"
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={`${progress} ${circumference}`}
          />
          <defs>
            <linearGradient id="heroScoreGradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="100%" stopColor="#c084fc" />
            </linearGradient>
          </defs>
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-lg font-bold">
          {score}
        </span>
      </div>
      <span className="text-xs font-medium text-slate-300">AI score / 10</span>
    </div>
  );
}
