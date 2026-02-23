import { useEffect, useState } from "react";
import { useSearchParams, useParams } from "react-router-dom";
import { authFetch } from "../utils/authFetch";
import { API_BASE_URL } from "../utils/apiBaseUrl";

export default function MockInterview() {
  const { type } = useParams();
  const [searchParams] = useSearchParams();

  const count = searchParams.get("count") || 3;
  const difficulty = searchParams.get("difficulty")?.toLowerCase() || "medium";

  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [scores, setScores] = useState([]);
  const [sessionSaved, setSessionSaved] = useState(false);

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

  /* =========================
     EVALUATE ANSWER
  ========================= */
  const evaluateAnswer = async () => {
    if (!answer.trim()) return;

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
    setAnswer("");
    setFeedback(null);
    setCurrent((prev) => prev + 1);
  };

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

        <p className="mb-4 font-medium">
          Q{current + 1}: {questions[current]?.question}
        </p>

        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Speak naturally as if interviewer is listening..."
          className="w-full border rounded-xl p-3 h-32 mb-4"
        />

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
              <h3 className="font-semibold mb-2">AI Feedback</h3>
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
