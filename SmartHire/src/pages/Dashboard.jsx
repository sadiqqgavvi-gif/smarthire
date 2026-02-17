import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, CheckCircle, Clock } from "lucide-react";

export default function Dashboard() {
  const API_BASE_URL =
    import.meta.env.VITE_API_URL || "http://localhost:5000";

  const [stats, setStats] = useState({
    overallScore: 0,
    totalSessions: 0,
    completedInterviews: 0,
  });
  const [performanceData, setPerformanceData] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");

    const loadDashboard = async () => {
      if (!token) return;

      try {
        const res = await fetch(`${API_BASE_URL}/api/practice/sessions/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
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
  }, [API_BASE_URL]);

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10">
      
      {/* Header */}
      <h1 className="text-4xl font-bold text-gray-800 mb-6">Dashboard</h1>

      {/* Top Stats */}
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

      {/* Performance Chart */}
      <div className="p-6 bg-white rounded-2xl shadow w-full h-[350px]">
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

       {/* Back Button */}
      <button
        onClick={() => window.history.back()}
        className="absolute top-6 right-6 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition"
      >
        ← Back
      </button>


    </div>
  );
}
