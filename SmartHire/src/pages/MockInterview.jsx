import { useEffect, useRef, useState } from "react";
import { useSearchParams, useParams } from "react-router-dom";
import { Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { authFetch } from "../utils/authFetch";
import { API_BASE_URL } from "../utils/apiBaseUrl";

export default function MockInterview() {
  const { type } = useParams();
  const [searchParams] = useSearchParams();

  const count = searchParams.get("count") || 10;
  const difficulty = searchParams.get("difficulty")?.toLowerCase() || "medium";

  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [scores, setScores] = useState([]);
  const [sessionSaved, setSessionSaved] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [voiceMessage, setVoiceMessage] = useState("");
  const [speaking, setSpeaking] = useState(false);

  const recognitionRef = useRef(null);

  /* =========================
     FETCH QUESTIONS FROM API
  ========================= */
  useEffect(() => {
    async function loadQuestions() {
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/practice/${type}?count=${count}&difficulty=${difficulty}`
        );
        const data = await res.json();
        setQuestions(data.questions || []);
      } catch (err) {
        console.error("Error loading questions", err);
      } finally {
        setLoading(false);
      }
    }
    loadQuestions();
  }, [type, count, difficulty]);

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
          ? "Microphone permission was blocked."
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

  /* =========================
     EVALUATE ANSWER
  ========================= */
  const evaluateAnswer = async () => {
    if (!answer.trim()) return;

    stopListening();
    setEvaluating(true);
    setFeedback(null);

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

      if (data.success && data.evaluation) {
        setFeedback(data.evaluation);
        const score = Number(data.evaluation?.score);
        if (Number.isFinite(score)) {
          setScores((prev) => [...prev, score]);
        }
      } else {
        setFeedback({
          score: "N/A",
          strengths: "",
          weaknesses: "",
          improvement: "",
          overall_feedback: data.message || "Evaluation unavailable",
        });
      }
    } catch (err) {
      console.error("Evaluation error", err);
      setFeedback({
        score: "N/A",
        strengths: "Good clarity",
        weaknesses: "Could add more examples",
        improvement: "Explain with more real-world examples",
        overall_feedback: "Evaluation failed. Showing mock feedback.",
      });
    } finally {
      setEvaluating(false);
    }
  };

  useEffect(() => {
    const saveSession = async () => {
      if (sessionSaved || current < questions.length) return;

      const averageScore = scores.length
        ? Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2))
        : 0;

      try {
        const res = await authFetch(`${API_BASE_URL}/api/practice/sessions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            mode: "mock",
            category: String(type).toLowerCase(),
            difficulty: difficulty || "mixed",
            questionCount: Number(count) || questions.length,
            attemptedCount: scores.length,
            averageScore,
          }),
        });

        if (res.ok) {
          setSessionSaved(true);
        }
      } catch (err) {
        console.error("Failed to save mock session", err);
      }
    };

    saveSession();
  }, [count, current, difficulty, questions.length, scores, sessionSaved, type]);

  const nextQuestion = () => {
    stopListening();
    stopSpeaking();
    setAnswer("");
    setFeedback(null);
    setInterimTranscript("");
    setVoiceMessage("");
    setCurrent((prev) => prev + 1);
  };

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
    if (typeof window === "undefined" || !window.speechSynthesis || !text?.trim()) {
      return;
    }

    stopSpeaking();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const feedbackText = feedback
    ? [
        feedback.score ? `Score: ${feedback.score}.` : "",
        feedback.strengths ? `Strengths: ${feedback.strengths}.` : "",
        feedback.weaknesses ? `Weaknesses: ${feedback.weaknesses}.` : "",
        feedback.improvement ? `Improvement: ${feedback.improvement}.` : "",
        feedback.overall_feedback ? `Overall feedback: ${feedback.overall_feedback}.` : "",
      ]
        .filter(Boolean)
        .join(" ")
    : "";

  if (loading) return <p className="p-10">Loading interview...</p>;

  if (!questions.length) return <p className="p-10">No questions found.</p>;

  if (current >= questions.length)
    return (
      <div className="p-10 text-center">
        <h2 className="text-2xl font-bold mb-4">Interview Completed 🎉</h2>
        <p>Great job practicing!</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow p-8">
        <h2 className="text-xl font-semibold mb-6">Mock Interview — {type}</h2>

        <div className="mb-4 flex items-start justify-between gap-4">
          <p className="font-medium">
            Q{current + 1}: {questions[current]?.question}
          </p>
          <button
            type="button"
            onClick={() => speakText(questions[current]?.question || "")}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50"
            title="Read question aloud"
            aria-label="Read question aloud"
          >
            <Volume2 className="h-4 w-4" />
          </button>
        </div>

        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Speak naturally as if interviewer is listening..."
          className="w-full border rounded-xl p-3 h-32 mb-4"
        />

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={listening ? stopListening : startListening}
            disabled={!voiceSupported || evaluating || Boolean(feedback)}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-300"
            title={listening ? "Stop voice input" : "Start voice input"}
          >
            {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            {listening ? "Stop" : "Speak"}
          </button>

          {speaking ? (
            <button
              type="button"
              onClick={stopSpeaking}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              title="Stop audio"
            >
              <VolumeX className="h-4 w-4" />
              Stop audio
            </button>
          ) : null}

          {!voiceSupported ? (
            <span className="text-sm text-gray-500">Voice input is not supported in this browser.</span>
          ) : null}
          {voiceMessage ? <span className="text-sm text-gray-500">{voiceMessage}</span> : null}
          {interimTranscript ? (
            <span className="text-sm italic text-gray-500">{interimTranscript}</span>
          ) : null}
        </div>

        {!feedback ? (
          <button
            onClick={evaluateAnswer}
            disabled={evaluating}
            className="bg-blue-600 text-white px-6 py-2 rounded-xl"
          >
            {evaluating ? "Evaluating..." : "Submit Answer"}
          </button>
        ) : (
          <>
            <div className="bg-gray-100 p-4 rounded-xl mb-4">
              <div className="mb-2 flex items-center justify-between gap-4">
                <h3 className="font-semibold">AI Feedback</h3>
                <button
                  type="button"
                  onClick={() => speakText(feedbackText)}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-700 hover:bg-white"
                  title="Read feedback aloud"
                  aria-label="Read feedback aloud"
                >
                  <Volume2 className="h-4 w-4" />
                </button>
              </div>
              <ul className="space-y-1">
                {feedback.score && <li><strong>Score:</strong> {feedback.score}</li>}
                {feedback.strengths && <li><strong>Strengths:</strong> {feedback.strengths}</li>}
                {feedback.weaknesses && <li><strong>Weaknesses:</strong> {feedback.weaknesses}</li>}
                {feedback.improvement && <li><strong>Improvement:</strong> {feedback.improvement}</li>}
                {feedback.overall_feedback && <li><strong>Overall Feedback:</strong> {feedback.overall_feedback}</li>}
              </ul>
            </div>

            <button
              onClick={nextQuestion}
              className="bg-green-600 text-white px-6 py-2 rounded-xl"
            >
              Next Question
            </button>
          </>
        )}
      </div>

      <button
        onClick={() => window.history.back()}
        className="absolute top-6 left-6 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
      >
        ← Back
      </button>
    </div>
  );
}
