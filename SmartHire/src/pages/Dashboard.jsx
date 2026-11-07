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
  BookOpenCheck,
  LogOut,
  Sparkles,
} from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { authFetch, logoutUser } from "../utils/authFetch";
import { API_BASE_URL } from "../utils/apiBaseUrl";
import AppHeader from "../components/app/AppHeader";
import { getScoreTone } from "../components/app/scoreTone";
import { useTheme } from "../theme/themeContext";

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

const StatCard = ({ icon, title, value, description }) => (
  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
        <div className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">{value}</div>
      </div>
      <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 p-3 text-white shadow-sm">
        {React.createElement(icon, { className: "h-5 w-5" })}
      </div>
    </div>
    {description ? <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">{description}</p> : null}
  </div>
);

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
};

const averageOf = (sessionList) =>
  sessionList.length
    ? sessionList.reduce((sum, session) => sum + (Number(session?.averageScore) || 0), 0) /
      sessionList.length
    : 0;

const SessionHistory = ({ sessions }) => (
  <div className="mt-6 rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
    <div className="flex items-center justify-between px-6 pt-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">Session history</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Your latest saved sessions in this view.</p>
      </div>
    </div>
    {sessions.length ? (
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-y border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
              <th className="px-6 py-3 font-semibold">Date</th>
              <th className="px-6 py-3 font-semibold">Type</th>
              <th className="px-6 py-3 font-semibold">Category</th>
              <th className="px-6 py-3 font-semibold">Difficulty</th>
              <th className="px-6 py-3 font-semibold">Answered</th>
              <th className="px-6 py-3 text-right font-semibold">Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {sessions.slice(0, 8).map((session, index) => {
              const tone = getScoreTone(session?.averageScore);
              const isMock = session?.mode === "mock";
              return (
                <tr key={session?._id || index} className="text-slate-700 dark:text-slate-300">
                  <td className="whitespace-nowrap px-6 py-4">{formatDate(session?.createdAt)}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        isMock
                          ? "bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300"
                          : "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
                      }`}
                    >
                      {isMock ? "Mock" : "Practice"}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                    {formatLabel(session?.category || "general")}
                  </td>
                  <td className="px-6 py-4">{session?.difficulty ? formatLabel(session.difficulty) : "—"}</td>
                  <td className="px-6 py-4">
                    {Number(session?.attemptedCount) || 0}/{Number(session?.questionCount) || 0}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${tone.badge}`}>
                      {(Number(session?.averageScore) || 0).toFixed(1)}/10
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    ) : (
      <p className="px-6 pb-6 pt-4 text-sm text-slate-500 dark:text-slate-400">No sessions saved in this view yet.</p>
    )}
    <div className="h-2" />
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
  const [loadError, setLoadError] = useState("");
  const [userName, setUserName] = useState("");

  const navigate = useNavigate();
  const { isDark } = useTheme();
  const chartColors = isDark
    ? { grid: "#334155", tick: "#94a3b8", bar: "#60a5fa", cursor: "rgba(148, 163, 184, 0.12)", tooltipBg: "#0f172a", tooltipBorder: "#334155", tooltipText: "#f1f5f9" }
    : { grid: "#e2e8f0", tick: "#64748b", bar: "#2563eb", cursor: "rgba(15, 23, 42, 0.06)", tooltipBg: "#ffffff", tooltipBorder: "#e2e8f0", tooltipText: "#0f172a" };
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
        setLoadError("");

        setStats({
          overallScore: data?.stats?.overallScore || 0,
          totalSessions: data?.stats?.totalSessions || 0,
          completedInterviews: data?.stats?.completedInterviews || 0,
        });
        setSessions(Array.isArray(data?.sessions) ? data.sessions : []);
      } catch (err) {
        console.error(err);
        setLoadError("We couldn't load your sessions. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    };

    const loadUser = async () => {
      try {
        const res = await authFetch(`${API_BASE_URL}/api/auth/me`);
        if (!res?.ok) return;
        const data = await res.json();
        const name = data?.user?.name || "";
        setUserName(name.split(" ")[0] || "");
      } catch {
        // The greeting is optional.
      }
    };

    loadDashboard();
    loadUser();
  }, [location, navigate]);

  const mockSessions = useMemo(
    () => sessions.filter((session) => session?.mode === "mock"),
    [sessions]
  );

  const practiceSessions = useMemo(
    () => sessions.filter((session) => session?.mode === "practice"),
    [sessions]
  );

  const buildSessionStats = (sessionList) => {
    const totalSessions = sessionList.length;
    // Keep decimals: rounding here turned 7.6/10 into "80%".
    const averageScore = averageOf(sessionList);
    const totalAttempts = sessionList.reduce(
      (sum, session) => sum + (Number(session?.attemptedCount) || 0),
      0
    );

    return {
      totalSessions,
      averageScore,
      totalAttempts,
    };
  };

  const mockStats = useMemo(() => {
    const summary = buildSessionStats(mockSessions);
    return {
      totalMockSessions: summary.totalSessions,
      averageMockScore: summary.averageScore,
      totalAttempts: summary.totalAttempts,
    };
  }, [mockSessions]);

  const practiceStats = useMemo(() => buildSessionStats(practiceSessions), [practiceSessions]);

  const performanceData = useMemo(() => {
    if (activeView === "mock") {
      return buildCategoryScores(mockSessions);
    }
    if (activeView === "practice") {
      return buildCategoryScores(practiceSessions);
    }
    return buildCategoryScores(sessions);
  }, [activeView, mockSessions, practiceSessions, sessions]);

  const chartCopy = {
    mock: {
      title: "Mock interview performance",
      subtitle: "Average score by interview category for saved mock sessions.",
    },
    practice: {
      title: "Practice performance",
      subtitle: "Average score by practice category for saved practice sessions.",
    },
    overview: {
      title: "Overall skill performance",
      subtitle: "Average score by category across all saved sessions.",
    },
  }[activeView];

  const viewStatusText = {
    mock: "Showing saved mock interview results only.",
    practice: "Showing saved practice results only.",
    overview: "Showing all saved practice and mock sessions.",
  }[activeView];

  // Derive every figure from the same session list so the cards always agree.
  const overallScore = sessions.length ? averageOf(sessions) : stats.overallScore;
  const totalSessionCount = sessions.length || stats.totalSessions;
  const mockSessionCount = sessions.length ? mockSessions.length : stats.completedInterviews;

  const historySessions =
    activeView === "mock" ? mockSessions : activeView === "practice" ? practiceSessions : sessions;

  const handleLogout = async () => {
    await logoutUser();
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <AppHeader>
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </AppHeader>

      <div className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/40">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400">
              <Sparkles className="h-4 w-4" />
              {userName ? `Welcome back, ${userName}` : "Interview analytics"}
            </div>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Dashboard
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
              Review your practice activity and switch between practice and mock interview
              performance for a more focused view of readiness.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href="/#practice"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
            >
              <BookOpenCheck className="h-4 w-4" />
              Start practicing
            </a>
            <Link
              to="/practice/behavioral/configure"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <Mic className="h-4 w-4" />
              Mock interview
            </Link>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {loadError ? (
          <p role="alert" className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
            {loadError}
          </p>
        ) : null}

        {!loading && !loadError && sessions.length === 0 ? (
          <div className="mb-6 flex flex-col items-start gap-4 rounded-3xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 sm:flex-row sm:items-center sm:justify-between dark:border-blue-500/30 dark:from-blue-500/10 dark:to-indigo-500/10">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Start your first session</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Complete and save a practice session or mock interview to see your scores and progress here.
              </p>
            </div>
            <a
              href="/#practice"
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Choose a track
            </a>
          </div>
        ) : null}

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="inline-flex max-w-full overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <button
              onClick={() => setActiveView("overview")}
              className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
                activeView === "overview"
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              }`}
            >
              <ChartColumnIncreasing className="h-4 w-4" />
              Overall performance
            </button>
            <button
              onClick={() => setActiveView("mock")}
              className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
                activeView === "mock"
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              }`}
            >
              <Mic className="h-4 w-4" />
              Mock interview performance
            </button>
            <button
              onClick={() => setActiveView("practice")}
              className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
                activeView === "practice"
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              }`}
            >
              <BookOpenCheck className="h-4 w-4" />
              Practice performance
            </button>
          </div>

          <p className="text-sm text-slate-500 dark:text-slate-400">{viewStatusText}</p>
        </div>

        {activeView === "overview" ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <StatCard
              icon={TrendingUp}
              title="Overall score"
              value={scoreToPercent(overallScore)}
              description="Combined average across all saved sessions."
            />
            <StatCard
              icon={Clock3}
              title="Total sessions"
              value={totalSessionCount}
              description="Practice and mock sessions recorded in the dashboard."
            />
            <StatCard
              icon={CheckCircle}
              title="Mock interviews"
              value={mockSessionCount}
              description="Completed mock sessions available for review."
            />
          </div>
        ) : null}

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2 dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                  {chartCopy.title}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">{chartCopy.subtitle}</p>
              </div>
              {activeView === "mock" ? (
                <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                  {mockStats.totalMockSessions} mock sessions
                </div>
              ) : activeView === "practice" ? (
                <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                  {practiceStats.totalSessions} practice sessions
                </div>
              ) : null}
            </div>

            <div className="h-[360px] w-full">
              {loading ? (
                <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400">
                  Loading dashboard...
                </div>
              ) : performanceData.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} vertical={false} />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: chartColors.tick }} />
                    <YAxis domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fill: chartColors.tick }} />
                    <Tooltip
                      cursor={{ fill: chartColors.cursor }}
                      contentStyle={{
                        borderRadius: "12px",
                        border: `1px solid ${chartColors.tooltipBorder}`,
                        background: chartColors.tooltipBg,
                        color: chartColors.tooltipText,
                        boxShadow: "0 12px 40px rgba(15, 23, 42, 0.08)",
                      }}
                      labelStyle={{ color: chartColors.tooltipText }}
                      itemStyle={{ color: chartColors.tooltipText }}
                    />
                    <Bar dataKey="score" name="Score (%)" fill={chartColors.bar} radius={[10, 10, 0, 0]} maxBarSize={72} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400">
                  No data available for this view yet.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              {activeView === "mock"
                ? "Mock interview summary"
                : activeView === "practice"
                  ? "Practice summary"
                  : "Performance summary"}
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {activeView === "mock"
                ? "A focused snapshot of your mock interview progress."
                : activeView === "practice"
                  ? "A focused snapshot of your practice progress."
                : "A quick snapshot of your overall interview activity."}
            </p>

            {activeView === "mock" ? (
              <div className="mt-6 space-y-4">
                <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Average mock score</p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                    {scoreToPercent(mockStats.averageMockScore)}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Mock interviews completed</p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                    {mockStats.totalMockSessions}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Attempted answers</p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                    {mockStats.totalAttempts}
                  </p>
                </div>
              </div>
            ) : activeView === "practice" ? (
              <div className="mt-6 space-y-4">
                <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Average practice score</p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                    {scoreToPercent(practiceStats.averageScore)}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Practice sessions completed</p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                    {practiceStats.totalSessions}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Attempted answers</p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                    {practiceStats.totalAttempts}
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Overall score</p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                    {scoreToPercent(overallScore)}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Mock interviews completed</p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                    {mockSessionCount}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Active categories</p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                    {performanceData.length}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {!loading ? <SessionHistory sessions={historySessions} /> : null}
      </main>
    </div>
  );
}
