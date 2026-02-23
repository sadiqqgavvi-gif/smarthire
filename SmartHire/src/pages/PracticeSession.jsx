import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { authFetch } from "../utils/authFetch";
import { API_BASE_URL } from "../utils/apiBaseUrl";

export default function PracticeSession() {
  const { type } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const category = decodeURIComponent(type);
  const isBehavioral = category.toLowerCase() === "behavioral";

  const difficulty = searchParams.get("difficulty"); // DO NOT lowercase
  const count = searchParams.get("count") || 3;
  const role = searchParams.get("role") || "";

  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [evaluations, setEvaluations] = useState({});
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  /* 📥 FETCH QUESTIONS */
  useEffect(() => {
    const fetchQuestions = async () => {
      setFetching(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          category,
          count,
          role,
        });

        // Only send difficulty for NON-behavioral
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

        setQuestions(data.questions);
      } catch (err) {
        console.error("❌ Fetch questions error:", err);
        setError(err.message || "Failed to fetch questions");
        setQuestions([]);
      } finally {
        setFetching(false);
      }
    };

    fetchQuestions();
  }, [category, difficulty, count, role, isBehavioral]);

  /* 🧠 AI EVALUATION */
  const evaluateAnswer = async (questionId, questionText) => {
    if (!answers[questionId]) return;

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/ai/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: questionText,
          answer: answers[questionId],
          category: category.toLowerCase(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.message || "Evaluation failed");
      }

      setEvaluations((prev) => ({ ...prev, [questionId]: data }));
    } catch (err) {
      console.error("❌ Evaluation failed:", err);
      setEvaluations((prev) => ({
        ...prev,
        [questionId]: {
          success: false,
          score: 0,
          strengths: "",
          weaknesses: "Evaluation unavailable right now.",
          improvement: "Try again in a moment.",
          overall_feedback: "Could not evaluate this answer.",
          feedback: "Could not evaluate this answer.",
        },
      }));
    } finally {
      setLoading(false);
    }
  };

  const saveSession = async () => {
    const scores = Object.values(evaluations)
      .map((ev) => Number(ev?.score))
      .filter((n) => Number.isFinite(n));

    const averageScore = scores.length
      ? Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2))
      : 0;

    setSaving(true);
    setSaveMessage("");

    try {
      const res = await authFetch(`${API_BASE_URL}/api/practice/sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode: "practice",
          category: category.toLowerCase(),
          difficulty: isBehavioral
            ? ""
            : (difficulty || "mixed").toLowerCase(),
          questionCount: Number(count) || questions.length,
          attemptedCount: Object.keys(evaluations).length,
          averageScore,
        }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          navigate("/login", { state: { from: location }, replace: true });
          return;
        }
        throw new Error("Failed to save session");
      }

      setSaveMessage("Session saved to dashboard.");
    } catch (err) {
      setSaveMessage(err.message || "Unable to save session.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="py-16 px-4 bg-gray-50 min-h-screen relative">
      <div className="max-w-4xl mx-auto space-y-6">
        <h2 className="text-2xl font-bold">
          {category} Practice Session
        </h2>

        {fetching && (
          <p className="text-gray-500">Loading questions...</p>
        )}

        {error && (
          <p className="text-red-500">
            Failed to load questions: {error}
          </p>
        )}

        {!fetching && !error && questions.length === 0 && (
          <p className="text-gray-500">
            No questions found for this category.
          </p>
        )}

        {questions.map((q, index) => (
          <div
            key={q._id}
            className="bg-white rounded-xl shadow p-6 space-y-4"
          >
            <h3 className="font-semibold">
              Q{index + 1}. {q.question}
            </h3>

            <textarea
              rows="4"
              placeholder="Write your answer here..."
              className="w-full border rounded-lg p-3"
              value={answers[q._id] || ""}
              onChange={(e) =>
                setAnswers({
                  ...answers,
                  [q._id]: e.target.value,
                })
              }
            />

            <button
              onClick={() =>
                evaluateAnswer(q._id, q.question)
              }
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Evaluating..." : "Evaluate Answer"}
            </button>

            {evaluations[q._id] && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p>
                  <strong>Score:</strong>{" "}
                  {evaluations[q._id].score}/10
                </p>
                <p className="mt-1">
                  <strong>Strengths:</strong>{" "}
                  {evaluations[q._id].strengths || "N/A"}
                </p>
                <p className="mt-1">
                  <strong>Weaknesses:</strong>{" "}
                  {evaluations[q._id].weaknesses || "N/A"}
                </p>
                <p className="mt-1">
                  <strong>Improvement:</strong>{" "}
                  {evaluations[q._id].improvement}
                </p>
                <p className="mt-1">
                  <strong>Overall Feedback:</strong>{" "}
                  {evaluations[q._id].overall_feedback || evaluations[q._id].feedback}
                </p>
              </div>
            )}
          </div>
        ))}

        {!fetching && questions.length > 0 && (
          <div className="pt-2">
            <button
              onClick={saveSession}
              disabled={saving || Object.keys(evaluations).length === 0}
              className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Finish & Save Session"}
            </button>
            {saveMessage && (
              <p className="mt-2 text-sm text-gray-600">{saveMessage}</p>
            )}
          </div>
        )}
      </div>

      <button
        onClick={() => navigate(-1)}
        className="absolute top-6 left-6 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition"
      >
        ← Back
      </button>
    </section>
  );
}
