import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Mic } from "lucide-react";
import Reveal from "./motion/Reveal";

// Closing call to action shown above the footer.
export default function FinalCTA() {
  return (
    <section className="relative overflow-hidden bg-slate-950 px-4 py-28 text-white sm:px-6 lg:px-8">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_60%_70%_at_50%_50%,black,transparent)]" />
        <div className="absolute left-1/2 top-1/2 h-[480px] w-[760px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-blue-600/40 via-indigo-600/30 to-purple-600/40 blur-3xl motion-safe:animate-glow-pulse" />
      </div>

      <Reveal className="relative mx-auto max-w-3xl text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-300">Your next interview starts here</p>
        <h2 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">
          Stop guessing.{" "}
          <span className="bg-gradient-to-r from-blue-300 via-indigo-300 to-purple-300 bg-clip-text text-transparent">
            Start practicing.
          </span>
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-slate-300">
          Answer real interview questions, get scored on relevance, structure and clarity, and walk
          in knowing exactly what to say.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/signup"
            className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-7 py-3.5 text-base font-semibold text-slate-900 shadow-lg shadow-blue-500/20 transition hover:-translate-y-0.5 hover:bg-blue-50 sm:w-auto"
          >
            Start practicing free
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
          </Link>
          <Link
            to="/practice/behavioral/configure"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-7 py-3.5 text-base font-semibold text-white backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/10 sm:w-auto"
          >
            <Mic className="h-5 w-5" />
            Try a mock interview
          </Link>
        </div>

        <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-400">
          {["No credit card", "30,000+ questions", "Voice or text answers"].map((point) => (
            <li key={point} className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              {point}
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}
