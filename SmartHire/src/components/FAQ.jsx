// src/components/FAQ.jsx
import { useState } from "react";
import { ChevronDown } from "lucide-react";

const FAQS = [
  {
    question: "Is SmartHire free to use?",
    answer:
      "Yes. Creating an account, practicing questions, running mock interviews and viewing your dashboard are all free.",
  },
  {
    question: "Do I need a Google account to sign up?",
    answer:
      "No. You can continue with Google in one click, or create an account with any email address and a password.",
  },
  {
    question: "How does SmartHire evaluate my answers?",
    answer:
      "Every answer is scored out of 10 on five criteria: relevance, depth, structure (the STAR method for behavioral questions), clarity and examples. For over a thousand technical questions SmartHire compares your answer with a reference answer and tells you which key concepts you missed. It also points out filler words and lets you view a model answer. When an AI model is connected, it adds more detailed written feedback.",
  },
  {
    question: "What is the difference between a practice session and a mock interview?",
    answer:
      "A practice session shows a set of questions you can answer at your own pace and get feedback on each one. A mock interview gives you one question at a time, lets you listen to the question and answer by voice, and finishes with an overall score.",
  },
  {
    question: "Can I answer by speaking instead of typing?",
    answer:
      "Yes. In mock interviews you can use your microphone, and your speech is turned into text automatically. Voice input works in browsers that support speech recognition, such as Google Chrome and Microsoft Edge.",
  },
  {
    question: "Is my progress saved?",
    answer:
      "Yes. When you save a practice session or mock interview it appears on your dashboard, where you can see your scores by category over time.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section
      id="faq"
      className="scroll-mt-20 bg-slate-50 px-4 py-24 sm:px-6 lg:px-8 dark:bg-slate-900/60"
    >
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">
            FAQ
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            Frequently asked questions
          </h2>
          <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-400">
            Everything you need to know before your first session. Can't find your answer?{" "}
            <a href="#contact" className="font-semibold text-blue-600 hover:underline dark:text-blue-400">
              Send us a message
            </a>
            .
          </p>
        </div>

        <dl className="space-y-3">
          {FAQS.map((item, index) => {
            const isOpen = openIndex === index;
            const panelId = `faq-panel-${index}`;
            return (
              <div
                key={item.question}
                className={`rounded-2xl border bg-white transition dark:bg-slate-900 ${
                  isOpen
                    ? "border-blue-200 shadow-sm dark:border-blue-500/40"
                    : "border-slate-200 dark:border-slate-800"
                }`}
              >
                <dt>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => setOpenIndex(isOpen ? -1 : index)}
                    className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                  >
                    <span className="text-base font-semibold text-slate-900 dark:text-white">
                      {item.question}
                    </span>
                    <ChevronDown
                      className={`h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-blue-600 dark:text-blue-400" : ""
                      }`}
                    />
                  </button>
                </dt>
                <dd
                  id={panelId}
                  hidden={!isOpen}
                  className="px-6 pb-5 text-sm leading-7 text-slate-600 dark:text-slate-400"
                >
                  {item.answer}
                </dd>
              </div>
            );
          })}
        </dl>
      </div>
    </section>
  );
}
