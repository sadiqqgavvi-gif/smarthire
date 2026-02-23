import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { authFetch, logoutUser } from "../utils/authFetch";
import { API_BASE_URL } from "../utils/apiBaseUrl";

export default function Auth({ type }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    // Clear fields when page loads
    setForm({ email: "", password: "" });

    const checkAuth = async () => {
      try {
        const res = await authFetch(`${API_BASE_URL}/api/auth/me`);
        if (!isMounted) return;
        setIsAuthenticated(res.ok);
      } catch {
        if (!isMounted) return;
        setIsAuthenticated(false);
      }
    };

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logoutUser();
      setMessage("Logged out successfully");
    } catch {
      setMessage("Logout failed");
    } finally {
      setIsAuthenticated(false);
      setForm({ email: "", password: "" });
      navigate("/", { replace: true });
    }
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate("/", { replace: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url =
        type === "login"
          ? `${API_BASE_URL}/api/auth/login`
          : `${API_BASE_URL}/api/auth/register`;

      const res = await axios.post(url, form, { withCredentials: true });

      setMessage(res.data.message);
      const verifyRes = await authFetch(`${API_BASE_URL}/api/auth/me`);

      if (!verifyRes.ok) {
        throw new Error("Session validation failed. Please try again.");
      }

    if (type === "login") {
      navigate("/", { replace: true });
    } else {
      navigate("/login", { replace: true });
    }

    } catch (err) {
      const apiMessage =
        err.response?.data?.error?.message ||
        err.response?.data?.message;
      setMessage(apiMessage || err.message || "Something went wrong");
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center h-screen ${
        type === "login" ? "bg-gray-200" : "bg-gray-200"
      }`}  >
      
      {/* Back Button */}
      <button
        onClick={handleBack}
        className="absolute top-6 left-6 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition"
      >
        {"<- Back"}
      </button>
      {isAuthenticated && (
        <button
          onClick={handleLogout}
          className="absolute top-6 right-6 px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition"
        >
          Logout
        </button>
      )}
      <div className="bg-white shadow-md p-8 rounded-2xl w-96">
        <h1 className="text-2xl font-bold mb-4 text-center">
          {type === "login" ? "Login to SmartHire" : "Create Your SmartHire Account"}
        </h1>

        <form onSubmit={handleSubmit} autoComplete="off" className="flex flex-col gap-3">
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            autoComplete="new-email"
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="p-2 border rounded"
          />

          <input
            type="password"
            placeholder="Password"
            value={form.password}
            autoComplete="new-password"
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="p-2 border rounded"
          />

          <button
            type="submit"
            className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
          >
            {type === "login" ? "Login" : "Sign Up"}
          </button>
        </form>

        {message && <p className="mt-4 text-center text-sm text-gray-600">{message}</p>}
      </div>
    </div>
  );
}

