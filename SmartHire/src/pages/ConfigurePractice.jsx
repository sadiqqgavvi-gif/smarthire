import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const difficulties = ["Easy", "Medium", "Hard"];
const questionCounts = [5, 10, 15, 20];

export default function ConfigurePractice() {
  const { type } = useParams();
  const navigate = useNavigate();

  const isBehavioral =
    decodeURIComponent(type).toLowerCase() === "behavioral";

  const [difficulty, setDifficulty] = useState("Medium");
  const [count, setCount] = useState(5);
  const [mode, setMode] = useState("practice"); // NEW
  const [role] = useState("");

  useEffect(() => {
    setCount(mode === "mock" ? 10 : 5);
  }, [mode]);

  const startPractice = () => {
    const params = new URLSearchParams({
      count,
      role,
      mode, // send interview mode
    });

    if (!isBehavioral) {
      params.append("difficulty", difficulty);
    }

    // Route based on mode
    if (mode === "mock") {
      navigate(`/mock-interview/${type}?${params.toString()}`);
    } else {
      navigate(`/practice/${type}?${params.toString()}`);
    }
  };

  return (
    <section className="min-h-screen bg-gray-50 py-20 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow p-8">
        <h2 className="text-2xl font-bold mb-2">
          Configure Practice Set
        </h2>

        <p className="text-gray-600 mb-8">
          Category:
          <span className="font-semibold">
            {" "}
            {decodeURIComponent(type)}
          </span>
        </p>

        {/* ⭐ Mode Selection */}
        <div className="mb-6">
          <p className="text-sm text-gray-500 mb-2">Session Type</p>
          <div className="flex gap-3">
            <button
              onClick={() => setMode("practice")}
              className={`px-4 py-2 rounded-full border ${
                mode === "practice"
                  ? "bg-green-600 text-white border-green-600"
                  : "border-gray-300"
              }`}
            >
              Practice
            </button>

            <button
              onClick={() => setMode("mock")}
              className={`px-4 py-2 rounded-full border ${
                mode === "mock"
                  ? "bg-purple-600 text-white border-purple-600"
                  : "border-gray-300"
              }`}
            >
              Mock Interview
            </button>
          </div>
        </div>

        {/* Difficulty */}
       {/* Difficulty — only for Practice mode */}
{mode === "practice" && !isBehavioral ? (
  <div className="mb-6">
    <p className="text-sm text-gray-500 mb-2">Difficulty</p>
    <div className="flex gap-3">
      {difficulties.map((level) => (
        <button
          key={level}
          onClick={() => setDifficulty(level)}
          className={`px-4 py-2 rounded-full border ${
            difficulty === level
              ? "bg-blue-600 text-white border-blue-600"
              : "border-gray-300"
          }`}
        >
          {level}
        </button>
      ))}
    </div>
  </div>
) : null}

        {/* Question Count */}
        {mode === "practice" && (
          <div className="mb-6">
            <p className="text-sm text-gray-500 mb-2">
              Number of Questions
            </p>
            <div className="flex gap-3">
              {questionCounts.map((q) => (
                <button
                  key={q}
                  onClick={() => setCount(q)}
                  className={`px-4 py-2 rounded-full border ${
                    count === q
                      ? "bg-gray-900 text-white border-gray-900"
                      : "border-gray-300"
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        <button
          onClick={startPractice}
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700"
        >
          Start Session
        </button>
      </div>

      <button
        onClick={() => window.history.back()}
        className="absolute top-6 left-6 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
      >
        ← Back
      </button>
    </section>
  );
}
