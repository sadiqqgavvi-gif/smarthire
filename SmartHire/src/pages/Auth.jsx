import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";

export default function Auth({ type }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");

   const navigate = useNavigate();
   const location = useLocation();

    // Where to go AFTER login
  const from = location.state?.from?.pathname || "/dashboard";

  useEffect(() => {
    // Clear fields when page loads
    setForm({ email: "", password: "" });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url =
        type === "login"
          ? "http://localhost:5000/api/auth/login"
          : "http://localhost:5000/api/auth/register";

      const res = await axios.post(url, form);

      setMessage(res.data.message);
      localStorage.setItem("token", res.data.token);

    if (type === "login") {
      navigate(from, { replace: true });
    } else {
      navigate("/dashboard");
    }

    } catch (err) {
      setMessage(err.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center h-screen ${
        type === "login" ? "bg-gray-200" : "bg-gray-200"
      }`}  >
      
      {/* Back Button */}
      <button
        onClick={() => window.history.back()}
        className="absolute top-6 left-6 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition"
      >
        ← Back
      </button>

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
