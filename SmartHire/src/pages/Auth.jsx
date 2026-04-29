import { useEffect, useRef, useState } from "react";
import axios from "axios";
import {
  Chrome,
  ArrowLeft,
  LogIn,
  LogOut,
  UserPlus,
  LockKeyhole,
  Mail,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { authFetch, logoutUser } from "../utils/authFetch";
import { API_BASE_URL } from "../utils/apiBaseUrl";

const GOOGLE_SIGN_IN_SCRIPT_ID = "google-sign-in-script";

export default function Auth({ type }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const googleButtonRef = useRef(null);
  const navigate = useNavigate();
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    let isMounted = true;

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

  useEffect(() => {
    if (type !== "login") {
      setGoogleReady(false);
      return;
    }

    if (!googleClientId) {
      setGoogleReady(false);
      return;
    }

    let cancelled = false;

    const mountGoogleButton = () => {
      if (cancelled) return;
      if (!window.google?.accounts?.id || !googleButtonRef.current) return;

      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async (response) => {
          if (!response?.credential) {
            setMessage("Google sign-in did not return a valid credential.");
            return;
          }

          try {
            setMessage("");
            setGoogleLoading(true);

            const res = await axios.post(
              `${API_BASE_URL}/api/auth/google`,
              { credential: response.credential },
              { withCredentials: true }
            );

            setMessage(res.data.message || "Google login successful");
            const verifyRes = await authFetch(`${API_BASE_URL}/api/auth/me`);

            if (!verifyRes.ok) {
              throw new Error("Session validation failed. Please try again.");
            }

            navigate("/", { replace: true });
          } catch (err) {
            const apiMessage = err.response?.data?.error?.message || err.response?.data?.message;
            setMessage(apiMessage || err.message || "Google login failed");
          } finally {
            setGoogleLoading(false);
          }
        },
      });

      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: "outline",
        size: "large",
        width: googleButtonRef.current.clientWidth || 320,
        shape: "pill",
        text: "continue_with",
      });
      setGoogleReady(true);
    };

    const existingScript = document.getElementById(GOOGLE_SIGN_IN_SCRIPT_ID);

    if (window.google?.accounts?.id) {
      mountGoogleButton();
      return () => {
        cancelled = true;
      };
    }

    if (existingScript) {
      const onLoad = () => mountGoogleButton();
      existingScript.addEventListener("load", onLoad);
      return () => {
        cancelled = true;
        existingScript.removeEventListener("load", onLoad);
      };
    }

    const script = document.createElement("script");
    script.id = GOOGLE_SIGN_IN_SCRIPT_ID;
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = mountGoogleButton;
    script.onerror = () => {
      if (!cancelled) {
        setMessage("Google sign-in could not be loaded right now.");
      }
    };
    document.head.appendChild(script);

    return () => {
      cancelled = true;
    };
  }, [googleClientId, navigate, type]);

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

  const verifySessionAndRedirect = async (successMessage, redirectTo) => {
    setMessage(successMessage);
    const verifyRes = await authFetch(`${API_BASE_URL}/api/auth/me`);

    if (!verifyRes.ok) {
      throw new Error("Session validation failed. Please try again.");
    }

    navigate(redirectTo, { replace: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const url =
        type === "login"
          ? `${API_BASE_URL}/api/auth/login`
          : `${API_BASE_URL}/api/auth/register`;

      const res = await axios.post(url, form, { withCredentials: true });
      await verifySessionAndRedirect(
        res.data.message,
        type === "login" ? "/" : "/login"
      );
    } catch (err) {
      const apiMessage = err.response?.data?.error?.message || err.response?.data?.message;
      setMessage(apiMessage || err.message || "Something went wrong");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900">
      <button
        onClick={handleBack}
        className="absolute left-6 top-6 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      {isAuthenticated ? (
        <button
          onClick={handleLogout}
          className="absolute right-6 top-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      ) : null}

      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_20px_80px_rgba(15,23,42,0.12)] lg:grid-cols-[1.05fr_0.95fr]">
          <div className="hidden flex-col justify-between bg-slate-950 p-10 text-white lg:flex">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-slate-200">
                <SparklesIcon />
                SmartHire access
              </div>
              <h1 className="mt-6 text-4xl font-semibold tracking-tight">
                {type === "login" ? "Welcome back" : "Create your account"}
              </h1>
              <p className="mt-4 max-w-md text-sm leading-6 text-slate-300">
                Sign in with email or use Google to move straight into your interview practice and
                dashboard.
              </p>
            </div>

            <div className="space-y-3 text-sm text-slate-300">
              <p>Polished session tracking</p>
              <p>Mock interview analytics</p>
              <p>Fast access with Google sign-in</p>
            </div>
          </div>

          <div className="p-8 sm:p-10">
            <div className="mb-8">
              <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
                {type === "login" ? "Login to SmartHire" : "Create Your SmartHire Account"}
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                {type === "login"
                  ? "Use your email and password, or continue with Google."
                  : "Create a new account with email and password."}
              </p>
            </div>

            {type === "login" ? (
              <div className="mb-6">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  {googleClientId ? (
                    <>
                      <div ref={googleButtonRef} className="min-h-[44px]" />
                      {googleLoading ? (
                        <p className="mt-3 text-xs text-slate-500">Signing you in with Google...</p>
                      ) : !googleReady ? (
                        <p className="mt-3 text-xs text-slate-500">Preparing Google sign-in...</p>
                      ) : null}
                    </>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="inline-flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-400"
                    >
                      <Chrome className="h-4 w-4" />
                      Continue with Google
                    </button>
                  )}
                  {!googleClientId ? (
                    <p className="mt-3 text-xs text-slate-500">
                      Google sign-in will appear once `VITE_GOOGLE_CLIENT_ID` is configured.
                    </p>
                  ) : null}
                </div>

                <div className="my-6 flex items-center gap-3">
                  <div className="h-px flex-1 bg-slate-200" />
                  <span className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
                    or
                  </span>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>
              </div>
            ) : null}

            <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Email</span>
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 focus-within:border-slate-400">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    placeholder="Email"
                    value={form.email}
                    autoComplete="email"
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full bg-transparent outline-none placeholder:text-slate-400"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Password</span>
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 focus-within:border-slate-400">
                  <LockKeyhole className="h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    placeholder="Password"
                    value={form.password}
                    autoComplete={type === "login" ? "current-password" : "new-password"}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full bg-transparent outline-none placeholder:text-slate-400"
                  />
                </div>
              </label>

              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                {type === "login" ? (
                  <>
                    <LogIn className="h-4 w-4" />
                    Login
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    Sign Up
                  </>
                )}
              </button>
            </form>

            {message ? (
              <p className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                {message}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function SparklesIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
      <path d="M12 2l1.7 5.3L19 9l-5.3 1.7L12 16l-1.7-5.3L5 9l5.3-1.7L12 2zm7 10l.9 2.7L22 16l-2.1.3L19 19l-.9-2.7L16 16l2.1-.3L19 13zm-14 1l1.1 3.4L10 18l-3.9.6L5 22l-1.1-3.4L0 18l3.9-.6L5 13z" />
    </svg>
  );
}
