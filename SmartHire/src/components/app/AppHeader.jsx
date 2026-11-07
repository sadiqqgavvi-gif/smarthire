import { LayoutDashboard } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import ThemeToggle from "../ThemeToggle";

// Top bar shared by the signed-in app pages (configure, practice, mock interview, dashboard).
export default function AppHeader({ children = null }) {
  const { pathname } = useLocation();
  const onDashboard = pathname.startsWith("/dashboard");

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
          <img src="/smarthire-logo.svg" alt="" className="h-8 w-8" />
          <span>SmartHire</span>
        </Link>

        <div className="flex items-center gap-2">
          {!onDashboard ? (
            <Link
              to="/dashboard"
              className="inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
          ) : null}
          <ThemeToggle />
          {children}
        </div>
      </div>
    </header>
  );
}
