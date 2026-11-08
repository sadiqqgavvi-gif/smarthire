import { Loader2 } from "lucide-react";

// Shown while a lazily loaded page (or an auth check) is in progress.
export default function PageLoader({ label = "Loading..." }) {
  return (
    <div
      role="status"
      className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50 text-slate-500 dark:bg-slate-950 dark:text-slate-400"
    >
      <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
