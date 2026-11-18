import { createElement, useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { AlertCircle, ArrowLeft, CheckCircle2, LayoutDashboard, Loader2, RotateCcw, Save, Sparkles } from "lucide-react";
import { expiredSaveLoginState, stashPendingSession } from "../utils/pendingSession";
import { getClientErrorMessage } from "../utils/apiErrors";
import { revealElement } from "../utils/reveal";
import { authFetch } from "../utils/authFetch";
import { API_BASE_URL } from "../utils/apiBaseUrl";
import AppHeader from "../components/app/AppHeader";
import FeedbackPanel from "../components/app/FeedbackPanel";
import { getTrack } from "../components/app/tracks";
import { useGoBack } from "../utils/navigation";
import { toScore } from "../components/app/scoreTone";

const MIN_ANSWER_LENGTH = 10;

export default function PracticeSession() {
  const { type } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const category = decodeURIComponent(type);
  const track = getTrack(type);
  const isBehavioral = category.toLowerCase() === "behavioral";
  const goBack = useGoBack(`/practice/${type}/configure`);

  const difficulty = searchParams.get("difficulty"); // keep original casing for the API
  const count = searchParams.get("count") || 3;
  const role = searchParams.get("role") || "";

  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [evaluations, setEvaluations] = useState({});
  const [evaluatingIds, setEvaluatingIds] = useState({});
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveMessage, setSaveMessage] = useState({ type: "", text: "" });
  const [reloadKey, setReloadKey] = useState(0);

  /* Fetch questions */
  useEffect(() => {
    let cancelled = false;

    const fetchQuestions = async () => {
      setFetching(true);
      setError(null);

      try {
        const params = new URLSearchParams({ category, count, role });
        if (!isBehavioral && difficulty) {
          params.append("difficulty", difficulty);
        }

        const res = await fetch(`${API_BASE_URL}/api/questions?${params.toString()}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Failed to fetch questions");
        }
        if (!Array.isArray(data.questions)) {
          throw new Error("Invalid response format");
        }
        if (!cancelled) setQuestions(data.questions);
      } catch (err) {
        console.error("Fetch questions error:", err);
        if (!cancelled) {
          setError(err.message || "Failed to fetch questions");
          setQuestions([]);
        }
      } finally {
        if (!cancelled) setFetching(false);
      }
    };

    fetchQuestions();
    return () => {
      cancelled = true;
    };
  }, [category, difficulty, count, role, isBehavioral, reloadKey]);

  /* AI evaluation (tracked per question so other questions stay usable) */
  const evaluateAnswer = useCallback(
    async (questionId, questionText) => {
      const answer = (answers[questionId] || "").trim();
      if (answer.length < MIN_ANSWER_LENGTH) return;

      setEvaluatingIds((prev) => ({ ...prev, [questionId]: true }));

      try {
        const res = await fetch(`${API_BASE_URL}/api/ai/evaluate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: questionText,
            answer,
            category: category.toLowerCase(),
          }),
        });

        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.success) {
          throw Object.assign(new Error(data?.message || "Evaluation failed"), {
            userMessage: getClientErrorMessage(res, data),
          });
        }

        setEvaluations((prev) => ({ ...prev, [questionId]: data }));
        setSaved(false);
        revealElement(`feedback-${questionId}`);
      } catch (err) {
        console.error("Evaluation failed:", err);
        setEvaluations((prev) => ({
          ...prev,
          [questionId]: {
            success: false,
            failed: true,
            score: null,
            strengths: "",
            weaknesses: "",
            improvement: "",
            overall_feedback:
              err.userMessage ||
              "We couldn't evaluate this answer right now. Please try again in a moment.",
          },
        }));
        revealElement(`feedback-${questionId}`);
      } finally {
        setEvaluatingIds((prev) => ({ ...prev, [questionId]: false }));
      }
    },
    [answers, category]
  );

  const scoredEvaluations = useMemo(
    () =>
      Object.values(evaluations)
        .filter((ev) => !ev?.failed)
        .map((ev) => toScore(ev?.score))
        .filter((n) => n !== null && n >= 0),
    [evaluations]
  );
  const attempted = scoredEvaluations.length;
  const averageScore = attempted
    ? Number((scoredEvaluations.reduce((a, b) => a + b, 0) / attempted).toFixed(2))
    : 0;
  const progress = questions.length ? Math.round((attempted / questions.length) * 100) : 0;

  const saveSession = async () => {
    setSaving(true);
    setSaveMessage({ type: "", text: "" });

    try {
      const payload = {
        mode: "practice",
        category: category.toLowerCase(),
        difficulty: isBehavioral ? "" : (difficulty || "mixed").toLowerCase(),
        questionCount: Number(count) || questions.length,
        attemptedCount: attempted,
        averageScore,
      };
      const res = await authFetch(`${API_BASE_URL}/api/practice/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        if (res.status === 401) {
          // Keep the results so they are saved right after the user logs in again.
          stashPendingSession(payload);
          navigate("/login", { state: expiredSaveLoginState, replace: true });
          return;
        }
        throw new Error("Failed to save session");
      }

      setSaved(true);
      setSaveMessage({ type: "success", text: "Session saved to dashboard." });
    } catch (err) {
      setSaveMessage({ type: "error", text: err.message || "Unable to save session." });
    } finally {
      setSaving(false);
    }
  };

  const meta = [
    `${questions.length || count} questions`,
    isBehavioral ? "STAR method" : difficulty ? `${difficulty} difficulty` : "Mixed difficulty",
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-32 dark:bg-slate-950">
      <AppHeader />

      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        <button
          type="button"
          onClick={goBack}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        {/* Page heading */}
        <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-start gap-4">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white ${track.accent}`}
            >
              {createElement(track.icon, { className: "h-6 w-6" })}
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
                {track.label} practice session
              </h1>
              <div className="mt-2 flex flex-wrap gap-2">
                {meta.map((item) => (
                  <span
                    key={item}
                    className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {questions.length ? (
            <div className="w-full sm:w-56">
              <div className="flex justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
                <span>
                  {attempted} of {questions.length} evaluated
                </span>
                <span>{progress}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : null}
        </div>

        {/* States */}
        {fetching ? (
          <div className="mt-8 space-y-4" aria-label="Loading questions">
            <p className="text-sm text-slate-500 dark:text-slate-400">Loading questions...</p>
            {[0, 1].map((i) => (
              <div key={i} className="animate-pulse rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                <div className="h-4 w-2/3 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="mt-5 h-28 rounded-xl bg-slate-100 dark:bg-slate-800/60" />
              </div>
            ))}
          </div>
        ) : null}

        {error ? (
          <div className="mt-8 flex flex-col items-start gap-4 rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700 sm:flex-row sm:items-center sm:justify-between dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
            <p className="flex items-center gap-2 text-sm">
              <AlertCircle className="h-5 w-5 shrink-0" />
              Failed to load questions: {error}
            </p>
            <button
              type="button"
              onClick={() => setReloadKey((key) => key + 1)}
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              <RotateCcw className="h-4 w-4" />
              Try again
            </button>
          </div>
        ) : null}

        {!fetching && !error && questions.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
            <p className="font-semibold text-slate-900 dark:text-white">No questions found for this category.</p>
            <Link to="/#tracks" className="mt-3 inline-block text-sm font-semibold text-blue-600 hover:underline dark:text-blue-400">
              Choose another track
            </Link>
          </div>
        ) : null}

        {/* Questions */}
        <ol className="mt-6 space-y-6">
          {questions.map((q, index) => {
            const answer = answers[q._id] || "";
            const trimmedLength = answer.trim().length;
            const evaluation = evaluations[q._id];
            const isEvaluating = Boolean(evaluatingIds[q._id]);
            const tooShort = trimmedLength > 0 && trimmedLength < MIN_ANSWER_LENGTH;
            const isDone = Boolean(evaluation) && !evaluation.failed && toScore(evaluation.score) !== null;

            return (
              <li
                key={q._id}
                className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-start gap-4">
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
                      isDone
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    {isDone ? <CheckCircle2 className="h-5 w-5" /> : index + 1}
                  </span>
                  <h3 className="pt-1 font-semibold leading-7 text-slate-900 dark:text-white">{q.question}</h3>
                </div>

                <div className="mt-5">
                  <textarea
                    maxLength={6000}
                    rows="4"
                    // a little shorter on phones so the evaluate button stays above the finish bar
                    placeholder="Write your answer here..."
                    aria-label={`Answer for question ${index + 1}`}
                    className="h-28 w-full resize-y rounded-2xl border border-slate-200 bg-slate-50/50 p-4 sm:h-auto text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-blue-400"
                    value={answer}
                    onChange={(e) => setAnswers({ ...answers, [q._id]: e.target.value })}
                  />
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {tooShort
                        ? `Write at least ${MIN_ANSWER_LENGTH} characters to get feedback.`
                        : `${answer.trim() ? answer.trim().split(/\s+/).length : 0} words`}
                    </p>
                    <button
                      type="button"
                      onClick={() => evaluateAnswer(q._id, q.question)}
                      disabled={isEvaluating || trimmedLength < MIN_ANSWER_LENGTH}
                      className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isEvaluating ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Evaluating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          {evaluation ? "Re-evaluate answer" : "Evaluate answer"}
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {evaluation ? (
                  // scroll margins keep the feedback clear of the header and the sticky finish bar
                  <div id={`feedback-${q._id}`} className="mt-5 scroll-mb-40 scroll-mt-20">
                    <FeedbackPanel evaluation={evaluation} category={category} />
                  </div>
                ) : null}
              </li>
            );
          })}
        </ol>
      </main>

      {/* Sticky finish bar */}
      {!fetching && questions.length > 0 ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/90 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/90">
          <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
            <div className="min-w-0 text-sm">
              <p className="font-semibold text-slate-900 dark:text-white">
                {attempted ? `Average score ${averageScore.toFixed(1)}/10` : "No scores yet"}
              </p>
              {saveMessage.text ? (
                <p
                  role={saveMessage.type === "error" ? "alert" : "status"}
                  className={
                    saveMessage.type === "error"
                      ? "text-red-600 dark:text-red-400"
                      : "text-emerald-700 dark:text-emerald-400"
                  }
                >
                  {saveMessage.text}
                </p>
              ) : (
                <p className="text-slate-500 dark:text-slate-400">
                  {attempted} of {questions.length} evaluated
                </p>
              )}
            </div>
            <div className="flex shrink-0 gap-2">
              {saved ? (
                <Link
                  to="/dashboard"
                  aria-label="View dashboard"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:px-4 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span className="hidden sm:inline">View dashboard</span>
                </Link>
              ) : null}
              <button
                type="button"
                onClick={saveSession}
                disabled={saving || saved || attempted === 0}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50 sm:px-5"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saved ? "Saved" : saving ? "Saving..." : "Finish & save session"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
