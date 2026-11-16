// src/components/Contact.jsx
import { createElement, useState } from "react";
import { Bug, CheckCircle2, Lightbulb, Loader2, MessageSquare, Send } from "lucide-react";
import { API_BASE_URL } from "../utils/apiBaseUrl";
import Reveal from "./motion/Reveal";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMPTY_FORM = { name: "", email: "", message: "" };

const TOPICS = [
  {
    icon: MessageSquare,
    title: "General questions",
    text: "Ask anything about how SmartHire works.",
  },
  {
    icon: Lightbulb,
    title: "Suggestions",
    text: "Tell us which questions or features you want next.",
  },
  {
    icon: Bug,
    title: "Report a problem",
    text: "Something not working? Let us know so we can fix it.",
  },
];

const validate = ({ name, email, message }) => {
  if (name.trim().length < 2) return "Please enter your name.";
  if (!EMAIL_PATTERN.test(email.trim())) return "Please enter a valid email address.";
  if (message.trim().length < 5) return "Please write a slightly longer message.";
  return "";
};

export default function Contact() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [status, setStatus] = useState({ type: "", text: "" });
  const [sending, setSending] = useState(false);

  const updateField = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (sending) return;

    const validationError = validate(form);
    if (validationError) {
      setStatus({ type: "error", text: validationError });
      return;
    }

    try {
      setSending(true);
      setStatus({ type: "", text: "" });

      const res = await fetch(`${API_BASE_URL}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          message: form.message.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error?.message || data?.message || "Failed to send message.");
      }

      setStatus({
        type: "success",
        text: "Thanks! Your message has been sent. We'll get back to you by email.",
      });
      setForm(EMPTY_FORM);
    } catch (err) {
      setStatus({
        type: "error",
        text:
          err?.message === "Failed to fetch"
            ? "Could not reach the server. Please check your connection and try again."
            : err?.message || "Failed to send message. Please try again later.",
      });
    } finally {
      setSending(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-blue-400";

  return (
    <section
      id="contact"
      className="scroll-mt-20 bg-white px-4 py-24 sm:px-6 lg:px-8 dark:bg-slate-950"
    >
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <Reveal>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">
            Contact
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            We'd love to hear from you
          </h2>
          <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-400">
            Questions, ideas or feedback about SmartHire? Send us a message and we'll reply by
            email.
          </p>

          <ul className="mt-10 space-y-6">
            {TOPICS.map(({ icon, title, text }) => (
              <li key={title} className="flex gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                  {createElement(icon, { className: "h-5 w-5" })}
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">{title}</p>
                  <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={120}>
        <form
          onSubmit={handleSubmit}
          noValidate
          className="rounded-3xl border border-slate-200 bg-slate-50/60 p-6 shadow-sm sm:p-8 dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Full name
              </span>
              <input
                type="text"
                value={form.name}
                onChange={updateField("name")}
                placeholder="Your name"
                autoComplete="name"
                maxLength={80}
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Email address
              </span>
              <input
                type="email"
                value={form.email}
                onChange={updateField("email")}
                placeholder="you@example.com"
                autoComplete="email"
                className={inputClass}
              />
            </label>
          </div>

          <label className="mt-5 block">
            <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Message
            </span>
            <textarea
              rows={5}
              value={form.message}
              onChange={updateField("message")}
              placeholder="How can we help?"
              maxLength={2000}
              className={`${inputClass} resize-y`}
            />
          </label>

          <button
            type="submit"
            disabled={sending}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Send message
              </>
            )}
          </button>

          {status.text ? (
            <p
              role={status.type === "error" ? "alert" : "status"}
              className={`mt-4 flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${
                status.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
                  : "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
              }`}
            >
              {status.type === "success" ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : null}
              {status.text}
            </p>
          ) : null}
        </form>
        </Reveal>
      </div>
    </section>
  );
}
