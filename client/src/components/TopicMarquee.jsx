// A slowly scrolling strip of practice topics shown under the hero.
const TOPICS = [
  "JavaScript",
  "React",
  "Node.js",
  "TypeScript",
  "SQL",
  "MongoDB",
  "Java",
  "Angular",
  "Data Structures",
  "Design Patterns",
  "Git",
  "C#",
  "Go",
  "GraphQL",
  "Teamwork",
  "Leadership",
  "Conflict resolution",
  "Problem-solving",
];

export default function TopicMarquee() {
  return (
    <section
      aria-label="Topics you can practice"
      className="border-y border-slate-200 bg-white py-6 dark:border-slate-800 dark:bg-slate-950"
    >
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 sm:flex-row sm:gap-8 sm:px-6 lg:px-8">
        <p className="shrink-0 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
          Practice questions on
        </p>
        <div className="relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
          <div className="flex w-max gap-3 motion-safe:animate-marquee hover:[animation-play-state:paused]">
            {[...TOPICS, ...TOPICS].map((topic, index) => (
              <span
                key={`${topic}-${index}`}
                aria-hidden={index >= TOPICS.length}
                className="whitespace-nowrap rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 text-sm font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
              >
                {topic}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
