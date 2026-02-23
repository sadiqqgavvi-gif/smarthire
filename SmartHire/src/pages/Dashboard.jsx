import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, CheckCircle, Clock } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { authFetch, logoutUser } from "../utils/authFetch";
import { API_BASE_URL } from "../utils/apiBaseUrl";

export default function Dashboard() {
  const [stats, setStats] = useState({
    overallScore: 0,
    totalSessions: 0,
    completedInterviews: 0,
  });
  const [performanceData, setPerformanceData] = useState([]);

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

        setPerformanceData(data?.categoryScores || []);
      } catch (err) {
        console.error(err);
      }
    };

    loadDashboard();
  }, [API_BASE_URL, location, navigate]);

  const handleLogout = async () => {
    await logoutUser();
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10">
      <h1 className="text-4xl font-bold text-gray-800 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="p-6 bg-white rounded-2xl shadow">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-700">Overall Score</h2>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.overallScore * 10}%</p>
        </div>

        <div className="p-6 bg-white rounded-2xl shadow">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-6 h-6 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-700">Practice Sessions</h2>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.totalSessions}</p>
        </div>

        <div className="p-6 bg-white rounded-2xl shadow">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="w-6 h-6 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-700">Completed Interviews</h2>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.completedInterviews}</p>
        </div>
      </div>

      <div className="p-6 bg-white rounded-2xl shadow w-full h-[350px] min-h-[350px]">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Skill Performance</h2>

        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={performanceData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Bar dataKey="score" fill="#4f46e5" radius={[10, 10, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="absolute top-6 right-6 flex gap-2">
        <button
          onClick={() => window.history.back()}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition"
        >
          Back
        </button>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
