// src/components/Features.jsx
import {
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  Library,
  Mic,
  ShieldCheck,
  SlidersHorizontal,
  Volume2,
} from "lucide-react";
import Reveal from "./motion/Reveal";

// Every card describes a feature that exists in the app today.
const TOPICS = [
  "JavaScript",
  "React",
  "Node.js",
  "TypeScript",
  "SQL",
  "MongoDB",
  "Java",
  "Angular",
  "Git",
  "Data Structures",
  "Design Patterns",
  "and more",
];

const STEPS = [
  {
    title: "Pick a track",
    text: "Choose technical, behavioral or situational, then set the difficulty and number of questions.",
  },
  {
    title: "Answer like it's real",
    text: "Listen to each question and reply by speaking or typing, just like a live interview.",
  },
  {
    title: "Improve with feedback",
    text: "Get a score, strengths and concrete tips, then track your progress on the dashboard.",
  },
];

export default function Features() {
  return (
    <section
      id="features"
      className="scroll-mt-20 bg-slate-50 px-4 py-24 sm:px-6 lg:px-8 dark:bg-slate-900/60"
    >
      <div className="mx-auto max-w-7xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">
            Features
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            How SmartHire helps you succeed
          </h2>
          <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-400">
            Everything you need to prepare in one place: realistic questions, a voice-ready
            interview room and an AI coach that tells you exactly what to fix.
          </p>
        </Reveal>

        <div className="mt-16 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {/* AI feedback (wide) */}
          <FeatureCard
            delay={0}
            className="lg:col-span-2"
            icon={BrainCircuit}
            accent="from-blue-600 to-indigo-600"
            title="Instant AI feedback on every answer"
            text="Each answer is scored out of 10 with clear strengths, weaknesses and an improvement tip, so you know what to say better next time."
          >
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                { label: "Strength", text: "Clear example with a real outcome", tone: "emerald" },
                { label: "Weakness", text: "Situation explained too briefly", tone: "amber" },
                { label: "Improve", text: "Add numbers to show your impact", tone: "blue" },
              ].map((item) => (
                <FeedbackPill key={item.label} {...item} />
              ))}
            </div>
          </FeatureCard>

          {/* Voice mock interview */}
          <FeatureCard
            delay={100}
            icon={Mic}
            accent="from-purple-600 to-fuchsia-600"
            title="Voice-ready mock interviews"
            text="Questions are read aloud and you can answer with your microphone, building real speaking confidence."
          >
            <div className="mt-6 flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800/70">
              <Volume2 className="h-4 w-4 shrink-0 text-purple-500" />
              <div className="flex h-10 flex-1 items-center justify-between" aria-hidden="true">
                {[30, 60, 45, 85, 55, 100, 70, 40, 80, 50, 90, 60, 35, 75, 50, 65, 40].map((h, i) => (
                  <span
                    key={i}
                    className="block w-1 rounded-full bg-gradient-to-t from-purple-500 to-blue-400 motion-safe:animate-pulse"
                    style={{ height: `${h}%`, animationDelay: `${i * 90}ms` }}
                  />
                ))}
              </div>
            </div>
          </FeatureCard>

          {/* Practice your way */}
          <FeatureCard
            delay={200}
            icon={SlidersHorizontal}
            accent="from-orange-500 to-amber-500"
            title="Practice your way"
            text="Three interview tracks, Easy, Medium or Hard difficulty and 5 to 20 questions per session."
          >
            <div className="mt-6 flex flex-wrap gap-2">
              {["Technical", "Behavioral", "Situational", "Easy", "Medium", "Hard"].map((chip) => (
                <span
                  key={chip}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  {chip}
                </span>
              ))}
            </div>
          </FeatureCard>

          {/* Progress dashboard (wide) */}
          <FeatureCard
            delay={0}
            className="lg:col-span-2"
            icon={BarChart3}
            accent="from-emerald-500 to-teal-500"
            title="Track your progress"
            text="Your dashboard saves every practice and mock session and charts your average score by category, so you can see where you are improving."
          >
            <div className="mt-6 grid grid-cols-3 gap-4 rounded-xl bg-slate-50 px-6 pb-3 pt-5 dark:bg-slate-800/70" aria-hidden="true">
              {[
                { label: "Technical", value: 72 },
                { label: "Behavioral", value: 86 },
                { label: "Situational", value: 64 },
              ].map((bar) => (
                <div key={bar.label} className="flex flex-col items-center">
                  <div className="flex h-28 w-full max-w-[96px] flex-col items-center justify-end">
                    <span className="mb-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
                      {bar.value}%
                    </span>
                    <div
                      className="w-full rounded-t-md bg-gradient-to-t from-emerald-500 to-teal-400"
                      style={{ height: `${bar.value}px` }}
                    />
                  </div>
                  <span className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">{bar.label}</span>
                </div>
              ))}
            </div>
          </FeatureCard>

          {/* Question bank (wide) */}
          <FeatureCard
            delay={100}
            className="lg:col-span-2"
            icon={Library}
            accent="from-sky-500 to-blue-600"
            title="30,000+ real interview questions"
            text="A large question bank covering 20+ technical topics plus behavioral and situational scenarios, so practice never feels repetitive."
          >
            <div className="mt-6 flex flex-wrap gap-2">
              {TOPICS.map((topic) => (
                <span
                  key={topic}
                  className="rounded-lg bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700 dark:bg-sky-500/10 dark:text-sky-300"
                >
                  {topic}
                </span>
              ))}
            </div>
          </FeatureCard>

          {/* Secure access */}
          <FeatureCard
            delay={200}
            icon={ShieldCheck}
            accent="from-slate-700 to-slate-900 dark:from-slate-500 dark:to-slate-700"
            title="Secure and simple"
            text="Sign in with Google or email. Your sessions are protected and saved to your account."
          >
            <ul className="mt-6 space-y-2 text-sm text-slate-600 dark:text-slate-300">
              {["One-click Google sign-in", "Passwords stored securely hashed", "Light and dark mode"].map((point) => (
                <li key={point} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  {point}
                </li>
              ))}
            </ul>
          </FeatureCard>
        </div>

        {/* How it works */}
        <div className="mt-24">
          <h3 className="text-center text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
            Start improving in three steps
          </h3>
          <ol className="relative mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
            <div
              aria-hidden="true"
              className="absolute left-[16.66%] right-[16.66%] top-6 hidden h-px bg-gradient-to-r from-blue-300 via-purple-300 to-emerald-300 md:block dark:from-blue-500/40 dark:via-purple-500/40 dark:to-emerald-500/40"
            />
            {STEPS.map((step, index) => (
              <Reveal as="li" key={step.title} delay={index * 150} className="relative text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-lg font-bold text-blue-600 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-blue-400">
                  {index + 1}
                </div>
                <h4 className="mt-5 text-lg font-semibold text-slate-900 dark:text-white">{step.title}</h4>
                <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-slate-600 dark:text-slate-400">
                  {step.text}
                </p>
              </Reveal>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ icon, accent, title, text, className = "", delay = 0, children }) {
  const Icon = icon;
  return (
    <Reveal className={className} delay={delay}>
    <div
      className={`group relative h-full overflow-hidden rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 dark:hover:shadow-black/30`}
    >
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm ${accent}`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-5 text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{text}</p>
      {children}
    </div>
    </Reveal>
  );
}

const PILL_TONES = {
  emerald:
    "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300",
  amber:
    "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300",
  blue: "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300",
};

function FeedbackPill({ label, text, tone }) {
  return (
    <div className={`rounded-xl border px-4 py-3 ${PILL_TONES[tone]}`}>
      <p className="text-xs font-semibold uppercase tracking-wider opacity-80">{label}</p>
      <p className="mt-1 text-sm">{text}</p>
    </div>
  );
}
