import React, { useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  CheckCircle,
  Clock3,
  ChartColumnIncreasing,
  Mic,
  ArrowLeft,
  LogOut,
  Sparkles,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { authFetch, logoutUser } from "../utils/authFetch";
import { API_BASE_URL } from "../utils/apiBaseUrl";

const scoreToPercent = (value) => `${Math.round((Number(value) || 0) * 10)}%`;

const formatLabel = (value = "") =>
  String(value)
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const buildCategoryScores = (sessions = []) => {
  const grouped = new Map();

  for (const session of sessions) {
    const key = session?.category || "general";
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(Number(session?.averageScore) || 0);
  }

  return [...grouped.entries()].map(([name, values]) => ({
    name: formatLabel(name),
    score: Math.round((values.reduce((sum, score) => sum + score, 0) / values.length) * 10),
  }));
};

const StatCard = ({ icon: Icon, title, value, description }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <div className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{value}</div>
      </div>
      <div className="rounded-xl bg-slate-100 p-3 text-slate-700">
        <Icon className="h-5 w-5" />
      </div>
    </div>
    {description ? <p className="mt-4 text-sm text-slate-500">{description}</p> : null}
  </div>
);

export default function Dashboard() {
  const [stats, setStats] = useState({
    overallScore: 0,
    totalSessions: 0,
    completedInterviews: 0,
  });
  const [sessions, setSessions] = useState([]);
  const [activeView, setActiveView] = useState("overview");
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const res = await authFetch(`${API_BASE_URL}/api/practice/sessions/me`);

        if (!res.ok) {
          if (res.status === 401) {
            navigate("/login", { state: { from: location }, replace: true });
            return;
          }
          throw new Error("Failed to load dashboard");
        }

        const data = await res.json();

        setStats({
          overallScore: data?.stats?.overallScore || 0,
          totalSessions: data?.stats?.totalSessions || 0,
          completedInterviews: data?.stats?.completedInterviews || 0,
        });
        setSessions(Array.isArray(data?.sessions) ? data.sessions : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [location, navigate]);

  const mockSessions = useMemo(
    () => sessions.filter((session) => session?.mode === "mock"),
    [sessions]
  );

  const mockStats = useMemo(() => {
    const totalMockSessions = mockSessions.length;
    const averageMockScore = totalMockSessions
      ? Math.round(
          mockSessions.reduce(
            (sum, session) => sum + (Number(session?.averageScore) || 0),
            0
          ) / totalMockSessions
        )
      : 0;
    const totalAttempts = mockSessions.reduce(
      (sum, session) => sum + (Number(session?.attemptedCount) || 0),
      0
    );

    return {
      totalMockSessions,
      averageMockScore,
      totalAttempts,
    };
  }, [mockSessions]);

  const performanceData = useMemo(() => {
    if (activeView === "mock") {
      return buildCategoryScores(mockSessions);
    }
    return buildCategoryScores(sessions);
  }, [activeView, mockSessions, sessions]);

  const chartTitle =
    activeView === "mock" ? "Mock interview performance" : "Overall skill performance";
  const chartSubtitle =
    activeView === "mock"
      ? "Average score by interview category for saved mock sessions."
      : "Average score by category across all saved sessions.";

  const handleLogout = async () => {
    await logoutUser();
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
              <Sparkles className="h-4 w-4" />
              Interview analytics
            </div>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">
              Dashboard
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              Review your practice activity and switch to mock interview performance for a more focused
              view of readiness.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="inline-flex rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
            <button
              onClick={() => setActiveView("overview")}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
                activeView === "overview"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <ChartColumnIncreasing className="h-4 w-4" />
              Overall performance
            </button>
            <button
              onClick={() => setActiveView("mock")}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
                activeView === "mock"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Mic className="h-4 w-4" />
              Mock interview performance
            </button>
          </div>

          <p className="text-sm text-slate-500">
            {activeView === "mock"
              ? "Showing saved mock interview results only."
              : "Showing all saved practice and mock sessions."}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <StatCard
            icon={TrendingUp}
            title="Overall score"
            value={scoreToPercent(stats.overallScore)}
            description="Combined average across all saved sessions."
          />
          <StatCard
            icon={Clock3}
            title="Total sessions"
            value={stats.totalSessions}
            description="Practice and mock sessions recorded in the dashboard."
          />
          <StatCard
            icon={CheckCircle}
            title="Mock interviews"
            value={stats.completedInterviews}
            description="Completed mock sessions available for review."
          />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
            <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-slate-900">{chartTitle}</h2>
                <p className="text-sm text-slate-500">{chartSubtitle}</p>
              </div>
              {activeView === "mock" ? (
                <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  {mockStats.totalMockSessions} mock sessions
                </div>
              ) : null}
            </div>

            <div className="h-[360px] w-full">
              {loading ? (
                <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
                  Loading dashboard...
                </div>
              ) : performanceData.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} />
                    <YAxis domain={[0, 100]} tickLine={false} axisLine={false} />
                    <Tooltip
                      cursor={{ fill: "rgba(15, 23, 42, 0.06)" }}
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid #e2e8f0",
                        boxShadow: "0 12px 40px rgba(15, 23, 42, 0.08)",
                      }}
                    />
                    <Bar dataKey="score" fill="#0f172a" radius={[10, 10, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
                  No data available for this view yet.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">
              {activeView === "mock" ? "Mock interview summary" : "Performance summary"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {activeView === "mock"
                ? "A focused snapshot of your mock interview progress."
                : "A quick snapshot of your overall interview activity."}
            </p>

            {activeView === "mock" ? (
              <div className="mt-6 space-y-4">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Average mock score</p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
                    {scoreToPercent(mockStats.averageMockScore)}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Mock interviews completed</p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
                    {mockStats.totalMockSessions}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Attempted answers</p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
                    {mockStats.totalAttempts}
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Overall score</p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
                    {scoreToPercent(stats.overallScore)}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Mock interviews completed</p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
                    {stats.completedInterviews}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Active categories</p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
                    {performanceData.length}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {activeView === "mock" ? (
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-slate-900">Recent mock sessions</h2>
                <p className="text-sm text-slate-500">Latest saved mock interview attempts.</p>
              </div>
            </div>

            {mockSessions.length ? (
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Difficulty</th>
                      <th className="px-4 py-3">Questions</th>
                      <th className="px-4 py-3">Attempted</th>
                      <th className="px-4 py-3">Average score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {mockSessions.slice(0, 5).map((session) => (
                      <tr key={session?._id} className="text-sm text-slate-700">
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {formatLabel(session?.category)}
                        </td>
                        <td className="px-4 py-3">{formatLabel(session?.difficulty || "mixed")}</td>
                        <td className="px-4 py-3">{session?.questionCount || 0}</td>
                        <td className="px-4 py-3">{session?.attemptedCount || 0}</td>
                        <td className="px-4 py-3">{scoreToPercent(session?.averageScore || 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
                No mock interview sessions have been saved yet.
              </div>
            )}
          </section>
        ) : null}
      </main>
    </div>
  );
}
