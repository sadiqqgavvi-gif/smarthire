import { createElement, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BrainCircuit,
  Loader2,
  Mic,
  MicOff,
  RotateCcw,
  Save,
  SkipForward,
  Trophy,
  Volume2,
  VolumeX,
} from "lucide-react";
import { authFetch } from "../utils/authFetch";
import { API_BASE_URL } from "../utils/apiBaseUrl";
import AppHeader from "../components/app/AppHeader";
import FeedbackPanel from "../components/app/FeedbackPanel";
import { getTrack } from "../components/app/tracks";
import { getScoreTone, toScore } from "../components/app/scoreTone";

const secondaryButton =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800";
const primaryButton =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100";

export default function MockInterview() {
  const { type } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const track = getTrack(type);

  const count = searchParams.get("count") || 10;
  const difficulty = searchParams.get("difficulty")?.toLowerCase() || "medium";

  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [evalError, setEvalError] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [evaluating, setEvaluating] = useState(false);
  const [results, setResults] = useState([]); // { question, score | null, skipped }
  const [sessionSaved, setSessionSaved] = useState(false);
  const [savingSession, setSavingSession] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [voiceMessage, setVoiceMessage] = useState("");
  const [speaking, setSpeaking] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const recognitionRef = useRef(null);

  const scores = results.map((r) => r.score).filter((s) => s !== null);

  /* Load questions */
  useEffect(() => {
    let cancelled = false;

    async function loadQuestions() {
      setLoading(true);
      setLoadError("");
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/practice/${type}?count=${count}&difficulty=${difficulty}`
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || "Could not load questions");
        if (!cancelled) setQuestions(data.questions || []);
      } catch (err) {
        console.error("Error loading questions", err);
        if (!cancelled) setLoadError(err.message || "Could not load questions");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadQuestions();
    return () => {
      cancelled = true;
    };
  }, [type, count, difficulty, reloadKey]);

  /* Speech recognition */
  useEffect(() => {
    const SpeechRecognition =
      typeof window !== "undefined" &&
      (window.SpeechRecognition || window.webkitSpeechRecognition);

    if (!SpeechRecognition) {
      setVoiceSupported(false);
      return undefined;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let finalText = "";
      let interimText = "";

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const transcript = event.results[i][0]?.transcript || "";
        if (event.results[i].isFinal) {
          finalText += transcript;
        } else {
          interimText += transcript;
        }
      }

      if (finalText.trim()) {
        setAnswer((prev) => {
          const separator = prev.trim() ? " " : "";
          return `${prev}${separator}${finalText.trim()}`;
        });
      }

      setInterimTranscript(interimText.trim());
    };

    recognition.onerror = (event) => {
      setListening(false);
      setInterimTranscript("");
      setVoiceMessage(
        event.error === "not-allowed"
          ? "Microphone permission was blocked. Allow it in your browser settings."
          : "Voice capture stopped. Try again."
      );
    };

    recognition.onend = () => {
      setListening(false);
      setInterimTranscript("");
    };

    recognitionRef.current = recognition;
    setVoiceSupported(true);

    return () => {
      recognition.stop();
      recognitionRef.current = null;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const startListening = () => {
    if (!recognitionRef.current) {
      setVoiceMessage("Voice input is not supported in this browser.");
      return;
    }
    try {
      setVoiceMessage("");
      setInterimTranscript("");
      recognitionRef.current.start();
      setListening(true);
    } catch {
      setVoiceMessage("Voice capture is already running.");
    }
  };

  const stopListening = () => {
    if (!recognitionRef.current) return;
    recognitionRef.current.stop();
    setListening(false);
    setInterimTranscript("");
  };

  const stopSpeaking = () => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  };

  const speakText = (text) => {
    if (typeof window === "undefined" || !window.speechSynthesis || !text?.trim()) return;
    stopSpeaking();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  /* Evaluate */
  const evaluateAnswer = async () => {
    if (!answer.trim()) return;

    stopListening();
    setEvaluating(true);
    setFeedback(null);
    setEvalError("");

    try {
      const res = await fetch(`${API_BASE_URL}/api/mock/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: questions[current]?.question,
          answer,
          category: type,
        }),
      });
      const data = await res.json();

      if (!data.success || !data.evaluation) {
        throw new Error(data?.error?.message || data?.message || "Evaluation unavailable");
      }

      setFeedback(data.evaluation);
      setResults((prev) => [
        ...prev,
        { question: questions[current]?.question, score: toScore(data.evaluation.score), skipped: false },
      ]);
    } catch (err) {
      console.error("Evaluation error", err);
      setEvalError(
        "We couldn't evaluate this answer right now. Your answer is still here, so please try again."
      );
    } finally {
      setEvaluating(false);
    }
  };

  const goToNext = () => {
    stopListening();
    stopSpeaking();
    setAnswer("");
    setFeedback(null);
    setEvalError("");
    setInterimTranscript("");
    setVoiceMessage("");
    setCurrent((prev) => prev + 1);
  };

  const skipQuestion = () => {
    setResults((prev) => [...prev, { question: questions[current]?.question, score: null, skipped: true }]);
    goToNext();
  };

  const retryInterview = () => {
    stopListening();
    stopSpeaking();
    setCurrent(0);
    setAnswer("");
    setFeedback(null);
    setEvalError("");
    setResults([]);
    setSessionSaved(false);
    setSavingSession(false);
    setSaveMessage("");
    setInterimTranscript("");
    setVoiceMessage("");
  };

  const saveSession = async () => {
    if (sessionSaved || savingSession) return;

    const averageScore = scores.length
      ? Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2))
      : 0;

    setSavingSession(true);
    setSaveMessage("");

    try {
      const res = await authFetch(`${API_BASE_URL}/api/practice/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "mock",
          category: String(type).toLowerCase(),
          difficulty: difficulty || "mixed",
          questionCount: Number(count) || questions.length,
          attemptedCount: scores.length,
          averageScore,
        }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          navigate("/login", { state: { from: location }, replace: true });
          return;
        }
        throw new Error("Unable to save this mock interview.");
      }

      setSessionSaved(true);
      setSaveMessage("Mock interview saved to your dashboard.");
    } catch (err) {
      console.error("Failed to save mock session", err);
      setSaveMessage(err.message || "Unable to save this mock interview.");
    } finally {
      setSavingSession(false);
    }
  };

  const feedbackText = feedback
    ? [
        feedback.score !== undefined ? `Score: ${feedback.score} out of 10.` : "",
        feedback.strengths ? `Strengths: ${feedback.strengths}.` : "",
        feedback.weaknesses ? `Weaknesses: ${feedback.weaknesses}.` : "",
        feedback.improvement ? `Improvement: ${feedback.improvement}.` : "",
        feedback.overall_feedback ? `Overall feedback: ${feedback.overall_feedback}.` : "",
      ]
        .filter(Boolean)
        .join(" ")
    : "";

  const averageScore = scores.length
    ? Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1))
    : 0;

  const saveButton = (
    <button
      type="button"
      onClick={saveSession}
      disabled={savingSession || sessionSaved || scores.length === 0}
      className={primaryButton}
    >
      {savingSession ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
      {sessionSaved ? "Saved to dashboard" : savingSession ? "Saving..." : "Save to dashboard"}
    </button>
  );

  const saveNotice = saveMessage ? (
    <p
      role="status"
      className={`mt-4 text-sm ${
        sessionSaved ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
      }`}
    >
      {saveMessage}
    </p>
  ) : null;

  const shell = (content) => (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <AppHeader />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">{content}</main>
    </div>
  );

  /* Loading / error / empty */
  if (loading) {
    return shell(
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-slate-500 dark:text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p>Preparing your interview...</p>
      </div>
    );
  }

  if (loadError || !questions.length) {
    return shell(
      <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center dark:border-slate-800 dark:bg-slate-900">
        <AlertCircle className="mx-auto h-10 w-10 text-amber-500" />
        <h1 className="mt-4 text-xl font-semibold text-slate-900 dark:text-white">
          {loadError ? "We couldn't load your interview" : "No questions found"}
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {loadError ? "Please check your connection and try again." : "Try a different interview track."}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          {loadError ? (
            <button type="button" onClick={() => setReloadKey((k) => k + 1)} className={primaryButton}>
              <RotateCcw className="h-4 w-4" />
              Try again
            </button>
          ) : null}
          <a href="/#practice" className={secondaryButton}>
            All tracks
          </a>
        </div>
      </div>
    );
  }

  /* Summary */
  if (current >= questions.length) {
    const tone = getScoreTone(scores.length ? averageScore : null);
    return shell(
      <>
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 px-8 py-10 text-center text-white">
            <Trophy className="mx-auto h-10 w-10 text-amber-300" />
            <p className="mt-3 text-sm font-medium uppercase tracking-widest text-blue-100">
              Mock interview complete
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Review your results</h1>
            <p className="mx-auto mt-2 max-w-md text-sm text-blue-100">
              You answered {scores.length} of {questions.length} questions in this {track.label.toLowerCase()} interview.
            </p>
          </div>

          <div className="grid gap-4 p-6 sm:grid-cols-3 sm:p-8">
            <div className="rounded-2xl bg-slate-50 p-5 text-center dark:bg-slate-800/60">
              <p className="text-sm text-slate-500 dark:text-slate-400">Average score</p>
              <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{averageScore}/10</p>
              <span className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${tone.badge}`}>
                {tone.label}
              </span>
            </div>
            <div className="rounded-2xl bg-slate-50 p-5 text-center dark:bg-slate-800/60">
              <p className="text-sm text-slate-500 dark:text-slate-400">Questions</p>
              <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{questions.length}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-5 text-center dark:bg-slate-800/60">
              <p className="text-sm text-slate-500 dark:text-slate-400">Attempted</p>
              <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{scores.length}</p>
            </div>
          </div>

          {results.length ? (
            <div className="border-t border-slate-200 px-6 py-6 sm:px-8 dark:border-slate-800">
              <h2 className="font-semibold text-slate-900 dark:text-white">Question breakdown</h2>
              <ol className="mt-4 space-y-3">
                {results.map((result, index) => {
                  const resultTone = getScoreTone(result.score);
                  return (
                    <li key={`${index}-${result.question}`} className="flex items-start gap-4">
                      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {index + 1}
                      </span>
                      <p className="flex-1 text-sm leading-6 text-slate-700 dark:text-slate-300">{result.question}</p>
                      <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${resultTone.badge}`}>
                        {result.skipped ? "Skipped" : result.score === null ? "N/A" : `${result.score}/10`}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </div>
          ) : null}

          <div className="flex flex-wrap justify-center gap-3 border-t border-slate-200 px-6 py-6 dark:border-slate-800">
            {saveButton}
            <button type="button" onClick={retryInterview} className={secondaryButton}>
              <RotateCcw className="h-4 w-4" />
              Retry mock interview
            </button>
            <button type="button" onClick={() => navigate("/dashboard")} className={secondaryButton}>
              <BarChart3 className="h-4 w-4" />
              View dashboard
            </button>
            <button type="button" onClick={() => navigate(-1)} className={secondaryButton}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          </div>
          <div className="px-6 pb-6 text-center">{saveNotice}</div>
        </div>
      </>
    );
  }

  /* Interview */
  const isFinalQuestion = current === questions.length - 1;
  const progress = Math.round((current / questions.length) * 100);
  const wordCount = answer.trim() ? answer.trim().split(/\s+/).length : 0;

  return shell(
    <>
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700">
          {createElement(track.icon, { className: "h-3.5 w-3.5" })}
          {track.label} mock interview
        </span>
      </div>

      {/* Progress */}
      <div className="mt-6">
        <div className="flex justify-between text-sm font-medium text-slate-600 dark:text-slate-300">
          <span>
            Question {current + 1} of {questions.length}
          </span>
          <span className="text-slate-400">{progress}% complete</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-800 dark:bg-slate-900">
        {/* Question */}
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 text-white">
            <BrainCircuit className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Interviewer
            </p>
            <h1 className="mt-1 text-lg font-semibold leading-8 text-slate-900 sm:text-xl dark:text-white">
              {questions[current]?.question}
            </h1>
          </div>
          <button
            type="button"
            onClick={() => (speaking ? stopSpeaking() : speakText(questions[current]?.question || ""))}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            title={speaking ? "Stop audio" : "Read question aloud"}
            aria-label={speaking ? "Stop audio" : "Read question aloud"}
          >
            {speaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
        </div>

        {/* Answer */}
        <div className="mt-6">
          <div
            className={`rounded-2xl border transition ${
              listening
                ? "border-red-300 ring-4 ring-red-500/10 dark:border-red-500/50"
                : "border-slate-200 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 dark:border-slate-700"
            }`}
          >
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              disabled={Boolean(feedback)}
              placeholder="Speak naturally as if the interviewer is listening, or type your answer..."
              aria-label="Your answer"
              className="h-40 w-full resize-y rounded-2xl bg-transparent p-4 text-sm leading-6 text-slate-900 outline-none placeholder:text-slate-400 disabled:opacity-70 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
            {interimTranscript ? (
              <p className="px-4 pb-3 text-sm italic text-slate-400">{interimTranscript}…</p>
            ) : null}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={listening ? stopListening : startListening}
              disabled={!voiceSupported || evaluating || Boolean(feedback)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                listening
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              }`}
              title={listening ? "Stop voice input" : "Start voice input"}
            >
              {listening ? (
                <>
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-white opacity-75 motion-safe:animate-ping" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
                  </span>
                  <MicOff className="h-4 w-4" />
                  Stop
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4" />
                  Speak
                </>
              )}
            </button>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {!voiceSupported
                ? "Voice input works in Chrome and Edge. You can type your answer instead."
                : listening
                  ? "Listening... speak clearly."
                  : `${wordCount} words`}
            </span>
            {voiceMessage ? (
              <span className="text-xs text-amber-600 dark:text-amber-400">{voiceMessage}</span>
            ) : null}
          </div>
        </div>

        {evalError ? (
          <p
            role="alert"
            className="mt-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {evalError}
          </p>
        ) : null}

        {/* Actions / feedback */}
        {!feedback ? (
          <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
            <button
              type="button"
              onClick={skipQuestion}
              disabled={evaluating}
              className="inline-flex items-center justify-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900 disabled:opacity-50 dark:text-slate-400 dark:hover:text-white"
            >
              <SkipForward className="h-4 w-4" />
              Skip question
            </button>
            <button
              type="button"
              onClick={evaluateAnswer}
              disabled={evaluating || !answer.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {evaluating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Evaluating...
                </>
              ) : (
                "Submit answer"
              )}
            </button>
          </div>
        ) : (
          <div className="mt-6 space-y-5">
            <FeedbackPanel
              evaluation={feedback}
              action={
                <button
                  type="button"
                  onClick={() => speakText(feedbackText)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                  title="Read feedback aloud"
                  aria-label="Read feedback aloud"
                >
                  <Volume2 className="h-4 w-4" />
                </button>
              }
            />

            {isFinalQuestion ? (
              <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-5 dark:border-blue-500/30 dark:bg-blue-500/10">
                <h2 className="font-semibold text-slate-900 dark:text-white">Final question evaluated</h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Your mock interview is ready to finish. Save this attempt to the dashboard, retry
                  the interview, or review your overall summary.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  {saveButton}
                  <button type="button" onClick={retryInterview} className={secondaryButton}>
                    <RotateCcw className="h-4 w-4" />
                    Retry mock interview
                  </button>
                  <button type="button" onClick={goToNext} className={secondaryButton}>
                    Review summary
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
                {saveNotice}
              </div>
            ) : (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={goToNext}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
                >
                  Next question
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <p className="mt-6 text-center text-xs text-slate-400">
        Tip: structure your answer clearly, give a real example and finish with the result.{" "}
        <Link to="/dashboard" className="underline hover:text-slate-600 dark:hover:text-slate-300">
          View your dashboard
        </Link>
      </p>
    </>
  );
}
