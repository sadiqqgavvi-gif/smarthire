import { ArrowRight, Briefcase, Code2, Mic, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Reveal from "./motion/Reveal";

const PRACTICE_TRACKS = [
  {
    key: "technical",
    title: "Technical",
    icon: Code2,
    accent: "from-blue-600 to-indigo-600",
    ring: "hover:border-blue-300 dark:hover:border-blue-500/50",
    link: "text-blue-600 dark:text-blue-400",
    description: "Coding concepts, frameworks, databases and system design across 20+ technologies.",
    sample: "What is the difference between let, const and var in JavaScript?",
    tags: ["JavaScript", "React", "SQL", "Node.js"],
  },
  {
    key: "behavioral",
    title: "Behavioral",
    icon: Users,
    accent: "from-purple-600 to-fuchsia-600",
    ring: "hover:border-purple-300 dark:hover:border-purple-500/50",
    link: "text-purple-600 dark:text-purple-400",
    description: "Teamwork, leadership and communication questions, answered with the STAR method.",
    sample: "Tell me about a time you had to meet a tight deadline.",
    tags: ["Teamwork", "Leadership", "Conflict", "STAR"],
  },
  {
    key: "situational",
    title: "Situational",
    icon: Briefcase,
    accent: "from-orange-500 to-amber-500",
    ring: "hover:border-orange-300 dark:hover:border-orange-500/50",
    link: "text-orange-700 dark:text-orange-400",
    description: "Real workplace scenarios that test your judgement, priorities and problem-solving.",
    sample: "Your manager wants a feature tomorrow that needs a week. What do you do?",
    tags: ["Decisions", "Priorities", "Ethics", "Pressure"],
  },
];

export default function Practice() {
  const navigate = useNavigate();

  return (
    <section
      id="practice"
      className="scroll-mt-20 bg-white px-4 py-24 sm:px-6 lg:px-8 dark:bg-slate-950"
    >
      <div className="mx-auto max-w-7xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">
            Practice
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            Start practicing now
          </h2>
          <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-400">
            Pick an interview track. You can choose the difficulty, the number of questions and
            whether you want a practice session or a full mock interview.
          </p>
        </Reveal>

        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {PRACTICE_TRACKS.map((track, index) => {
            const Icon = track.icon;
            return (
              <Reveal key={track.key} delay={index * 120}>
              <button
                type="button"
                onClick={() => navigate(`/practice/${track.key}/configure`)}
                className={`group flex h-full w-full flex-col rounded-3xl border border-slate-200 bg-white p-7 text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:hover:shadow-black/30 ${track.ring}`}
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-sm ${track.accent}`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    10,000 questions
                  </span>
                </div>

                <h3 className="mt-6 text-xl font-semibold text-slate-900 dark:text-white">
                  {track.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                  {track.description}
                </p>

                <div className="mt-5 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/70">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Sample question
                  </p>
                  <p className="mt-1.5 text-sm font-medium leading-6 text-slate-700 dark:text-slate-200">
                    “{track.sample}”
                  </p>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {track.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-slate-200 px-2.5 py-0.5 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <span
                  className={`mt-auto inline-flex items-center gap-2 pt-7 text-sm font-semibold ${track.link}`}
                >
                  Start {track.title.toLowerCase()} practice
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </span>
              </button>
              </Reveal>
            );
          })}
        </div>

        {/* Mock interview banner */}
        <Reveal>
        <div className="relative mt-10 overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-8 text-white shadow-lg sm:p-10">
          <div
            aria-hidden="true"
            className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl"
          />
          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15">
                <Mic className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">Want the real interview feel?</h3>
                <p className="mt-1 max-w-xl text-sm leading-6 text-blue-100">
                  Choose <span className="font-semibold text-white">Mock Interview</span> when you
                  start a session. Questions come one at a time, you can answer by voice, and you
                  get a final score saved to your dashboard.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate("/practice/behavioral/configure")}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-indigo-700 transition hover:-translate-y-0.5 hover:bg-blue-50"
            >
              Try a mock interview
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
        </Reveal>
      </div>
    </section>
  );
}
