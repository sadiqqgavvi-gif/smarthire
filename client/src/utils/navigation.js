import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

// React Router stores the position in this tab's in-app history as `idx`. When it is 0 the
// page was opened directly (new tab, bookmark, shared link), so navigate(-1) would leave the
// site or do nothing; go to a sensible page inside the app instead.
export const canGoBackInApp = () => (window.history.state?.idx ?? 0) > 0;

export const useGoBack = (fallback = "/") => {
  const navigate = useNavigate();
  return useCallback(() => {
    if (canGoBackInApp()) navigate(-1);
    else navigate(fallback, { replace: true });
  }, [navigate, fallback]);
};

// Where to send someone after they sign in: the protected page they were trying to open.
export const getRedirectAfterLogin = (state) => {
  const from = state?.from;
  if (!from?.pathname || from.pathname === "/login" || from.pathname === "/signup") return "/";
  return `${from.pathname}${from.search || ""}${from.hash || ""}`;
};
