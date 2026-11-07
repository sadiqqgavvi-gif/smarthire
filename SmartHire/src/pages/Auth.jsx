import { createElement, useEffect, useRef, useState } from "react";
import axios from "axios";
import {
  Chrome,
  ArrowLeft,
  LogIn,
  LogOut,
  UserPlus,
  LockKeyhole,
  Mail,
  Loader2,
  Eye,
  EyeOff,
  User,
  CheckCircle2,
  LayoutDashboard,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { authFetch, logoutUser } from "../utils/authFetch";
import { API_BASE_URL } from "../utils/apiBaseUrl";
import { setAccessToken } from "../utils/authToken";
import { getAuthErrorMessage } from "../utils/authErrors";
import ThemeToggle from "../components/ThemeToggle";
import { useTheme } from "../theme/themeContext";

const GOOGLE_SIGN_IN_SCRIPT_ID = "google-sign-in-script";

const EMPTY_FORM = { name: "", email: "", password: "", confirmPassword: "" };

const PAGE_COPY = {
  login: {
    panelTitle: "Welcome back",
    panelText:
      "Pick up where you left off. Your practice history, mock interview scores and dashboard are waiting for you.",
    title: "Log in to SmartHire",
    subtitle: "Continue with Google or use the email and password you signed up with.",
    googleHint: "Signed up with Google? Use this button. No password needed.",
    divider: "or log in with email",
  },
  signup: {
    panelTitle: "Create your free account",
    panelText:
      "Start practicing technical, behavioral and situational interviews in under a minute.",
    title: "Create your SmartHire account",
    subtitle: "Sign up with Google in one click, or create an account with your email.",
    googleHint: "Your account is created automatically the first time you continue with Google.",
    divider: "or sign up with email",
  },
};

const PANEL_FEATURES = [
  "AI feedback on every answer",
  "Mock interviews with progress tracking",
  "One account: Google or email, your choice",
];

export default function Auth({ type }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const isSignup = type === "signup";
  const copy = isSignup ? PAGE_COPY.signup : PAGE_COPY.login;
  const [message, setMessage] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [messageType, setMessageType] = useState("info");
  const { isDark } = useTheme();

  const showMessage = (text, kind = "info") => {
    setMessage(text);
    setMessageType(kind);
  };

  const googleButtonRef = useRef(null);
  const navigate = useNavigate();
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    let isMounted = true;

    setForm(EMPTY_FORM);
    setMessage("");
    setShowPassword(false);

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
  }, [type]);

  useEffect(() => {
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
            showMessage("Google sign-in did not return a valid credential.", "error");
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

            setAccessToken(res.data?.accessToken);
            showMessage(
              res.data?.message ||
                (res.data?.isNewUser ? "Account created with Google" : "Google login successful"),
              "success"
            );
            const verifyRes = await authFetch(`${API_BASE_URL}/api/auth/me`);

            if (!verifyRes.ok) {
              throw new Error("Session validation failed. Please try again.");
            }

            navigate("/", { replace: true });
          } catch (err) {
            showMessage(getAuthErrorMessage(err, "Google login failed"), "error");
          } finally {
            setGoogleLoading(false);
          }
        },
      });

      googleButtonRef.current.innerHTML = "";
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: isDark ? "filled_black" : "outline",
        size: "large",
        width: googleButtonRef.current.clientWidth || 320,
        shape: "pill",
        text: type === "signup" ? "signup_with" : "signin_with",
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
        showMessage("Google sign-in could not be loaded right now.", "error");
      }
    };
    document.head.appendChild(script);

    return () => {
      cancelled = true;
    };
  }, [googleClientId, navigate, type, isDark]);

  const handleLogout = async () => {
    try {
      await logoutUser();
      showMessage("Logged out successfully", "success");
    } catch {
      showMessage("Logout failed", "error");
    } finally {
      setIsAuthenticated(false);
      setForm(EMPTY_FORM);
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
    showMessage(successMessage, "success");
    const verifyRes = await authFetch(`${API_BASE_URL}/api/auth/me`);

    if (!verifyRes.ok) {
      throw new Error("Session validation failed. Please try again.");
    }

    navigate(redirectTo, { replace: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    const email = form.email.trim();
    const name = form.name.trim();
    const { password, confirmPassword } = form;

    if (!email || !password) {
      showMessage("Please enter both email and password.", "error");
      return;
    }

    if (password.length < 6) {
      showMessage("Password must be at least 6 characters.", "error");
      return;
    }

    if (isSignup && password !== confirmPassword) {
      showMessage("Passwords do not match.", "error");
      return;
    }

    try {
      setSubmitting(true);
      setMessage("");

      const url = isSignup
        ? `${API_BASE_URL}/api/auth/register`
        : `${API_BASE_URL}/api/auth/login`;
      const payload = isSignup ? { name, email, password } : { email, password };

      const res = await axios.post(url, payload, { withCredentials: true });
      setAccessToken(res.data?.accessToken);

      // Registration also signs the user in, so both flows land on the home page.
      await verifySessionAndRedirect(
        res.data?.message || (isSignup ? "Registration successful" : "Login successful"),
        "/"
      );
    } catch (err) {
      showMessage(getAuthErrorMessage(err), "error");
    } finally {
      setSubmitting(false);
    }
  };

  const messageStyles = {
    error:
      "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300",
    success:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300",
    info: "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400",
  };

  const updateField = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <div className="min-h-screen bg-slate-100 px-4 pb-8 pt-20 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <button
        onClick={handleBack}
        className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 sm:left-6 sm:top-6 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div className="absolute right-4 top-4 flex items-center gap-2 sm:right-6 sm:top-6">
        <ThemeToggle />
        {isAuthenticated ? (
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        ) : null}
      </div>

      <div className="mx-auto flex min-h-[calc(100vh-7rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_20px_80px_rgba(15,23,42,0.12)] lg:grid-cols-[1.05fr_0.95fr] dark:border-slate-700 dark:bg-slate-900">
          <div className="hidden flex-col justify-between bg-slate-950 p-10 text-white lg:flex">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-slate-200">
                <SparklesIcon />
                SmartHire access
              </div>
              <h1 className="mt-6 text-4xl font-semibold tracking-tight">{copy.panelTitle}</h1>
              <p className="mt-4 max-w-md text-sm leading-6 text-slate-300">{copy.panelText}</p>
            </div>

            <ul className="space-y-3 text-sm text-slate-300">
              {PANEL_FEATURES.map((feature) => (
                <li key={feature} className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          <div className="p-6 sm:p-10">
            <div
              role="tablist"
              aria-label="Choose sign up or log in"
              className="mb-6 grid grid-cols-2 rounded-xl bg-slate-100 p-1 text-sm font-medium dark:bg-slate-800"
            >
              {[
                { key: "signup", label: "Sign up", to: "/signup" },
                { key: "login", label: "Log in", to: "/login" },
              ].map((tab) => {
                const active = (tab.key === "signup") === isSignup;
                return (
                  <Link
                    key={tab.key}
                    to={tab.to}
                    replace
                    role="tab"
                    aria-selected={active}
                    className={`rounded-lg px-4 py-2 text-center transition ${
                      active
                        ? "bg-white text-slate-900 shadow-sm dark:bg-slate-950 dark:text-slate-100"
                        : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                    }`}
                  >
                    {tab.label}
                  </Link>
                );
              })}
            </div>

            <div className="mb-6">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-100">
                {copy.title}
              </h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{copy.subtitle}</p>
            </div>

            {isAuthenticated ? (
              <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 sm:flex-row sm:items-center sm:justify-between dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
                <span>You are already signed in.</span>
                <Link
                  to="/dashboard"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 font-medium text-white transition hover:bg-emerald-700"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Go to dashboard
                </Link>
              </div>
            ) : null}

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
              {googleClientId ? (
                <>
                  <div ref={googleButtonRef} className="min-h-[44px]" />
                  <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                    {googleLoading
                      ? "Signing you in with Google..."
                      : !googleReady
                        ? "Preparing Google sign-in..."
                        : copy.googleHint}
                  </p>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    disabled
                    className="inline-flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-400 dark:border-slate-700 dark:bg-slate-900"
                  >
                    <Chrome className="h-4 w-4" />
                    Continue with Google
                  </button>
                  <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                    Google sign-in will appear once `VITE_GOOGLE_CLIENT_ID` is configured.
                  </p>
                </>
              )}
            </div>

            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
              <span className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
                {copy.divider}
              </span>
              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignup ? (
                <AuthField label="Full name" icon={User}>
                  <input
                    type="text"
                    placeholder="Your name (optional)"
                    value={form.name}
                    maxLength={80}
                    autoComplete="name"
                    onChange={updateField("name")}
                    className="w-full bg-transparent outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </AuthField>
              ) : null}

              <AuthField label="Email" icon={Mail}>
                <input
                  type="email"
                  placeholder="Email"
                  value={form.email}
                  required
                  autoComplete="email"
                  onChange={updateField("email")}
                  className="w-full bg-transparent outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </AuthField>

              <AuthField
                label="Password"
                icon={LockKeyhole}
                trailing={
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
              >
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder={isSignup ? "At least 6 characters" : "Password"}
                  value={form.password}
                  required
                  minLength={6}
                  autoComplete={isSignup ? "new-password" : "current-password"}
                  onChange={updateField("password")}
                  className="w-full bg-transparent outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </AuthField>

              {isSignup ? (
                <AuthField label="Confirm password" icon={LockKeyhole}>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Re-enter your password"
                    value={form.confirmPassword}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    onChange={updateField("confirmPassword")}
                    className="w-full bg-transparent outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </AuthField>
              ) : null}

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {isSignup ? "Creating account..." : "Logging in..."}
                  </>
                ) : isSignup ? (
                  <>
                    <UserPlus className="h-4 w-4" />
                    Create account
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4" />
                    Log in
                  </>
                )}
              </button>
            </form>

            {message ? (
              <p
                role={messageType === "error" ? "alert" : "status"}
                className={`mt-4 rounded-xl border px-4 py-3 text-sm ${messageStyles[messageType] || messageStyles.info}`}
              >
                {message}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function AuthField({ label, icon, trailing = null, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
      </span>
      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 focus-within:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:focus-within:border-slate-500">
        {createElement(icon, { className: "h-4 w-4 shrink-0 text-slate-400" })}
        {children}
        {trailing}
      </div>
    </label>
  );
}

function SparklesIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
      <path d="M12 2l1.7 5.3L19 9l-5.3 1.7L12 16l-1.7-5.3L5 9l5.3-1.7L12 2zm7 10l.9 2.7L22 16l-2.1.3L19 19l-.9-2.7L16 16l2.1-.3L19 13zm-14 1l1.1 3.4L10 18l-3.9.6L5 22l-1.1-3.4L0 18l3.9-.6L5 13z" />
    </svg>
  );
}
