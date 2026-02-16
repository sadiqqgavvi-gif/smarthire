import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function PracticeSession() {
  const { type } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

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

  /* 🔐 AUTH CHECK */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/login", { replace: true });
  }, [navigate]);

  /* 📥 FETCH QUESTIONS */
  useEffect(() => {
    const fetchQuestions = async () => {
      setFetching(true);
      setError(null);

      try {
        const token = localStorage.getItem("token");

        const params = new URLSearchParams({
          category,
          count,
          role,
        });

        // Only send difficulty for NON-behavioral
        if (!isBehavioral && difficulty) {
          params.append("difficulty", difficulty);
        }

        const res = await fetch(
          `${API_BASE_URL}/api/questions?${params.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Failed to fetch questions");
        }

        if (!Array.isArray(data)) {
          throw new Error("Invalid response format");
        }

        setQuestions(data);
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
        }),
      });

      const data = await res.json();
      setEvaluations((prev) => ({ ...prev, [questionId]: data }));
    } catch (err) {
      console.error("❌ Evaluation failed:", err);
    } finally {
      setLoading(false);
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
                  <strong>Feedback:</strong>{" "}
                  {evaluations[q._id].feedback}
                </p>
                <p className="mt-1">
                  <strong>Improvement:</strong>{" "}
                  {evaluations[q._id].improvement}
                </p>
              </div>
            )}
          </div>
        ))}
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
