// Keeps a finished session's results when saving fails because the login expired, so
// the user can sign in again and have them saved instead of losing the whole session.
const STORAGE_KEY = "smarthire-pending-session";
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

export const SESSION_EXPIRED_NOTICE =
  "Your login expired before the session was saved. Log in again and your results will be saved to your dashboard.";

export const stashPendingSession = (payload) => {
  try {
    window.sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ payload, stashedAt: Date.now() })
    );
  } catch {
    // Storage can be unavailable (private mode); the results are lost in that case.
  }
};

// Returns the stashed payload once and removes it, so it is never saved twice.
export const takePendingSession = () => {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    window.sessionStorage.removeItem(STORAGE_KEY);

    const { payload, stashedAt } = JSON.parse(raw);
    if (!payload || Date.now() - Number(stashedAt) > MAX_AGE_MS) return null;
    return payload;
  } catch {
    return null;
  }
};

// Login page state for a protected action whose login expired: continue on the
// dashboard (where the stashed results are saved) and explain why login is needed.
export const expiredSaveLoginState = {
  from: { pathname: "/dashboard" },
  notice: SESSION_EXPIRED_NOTICE,
};
