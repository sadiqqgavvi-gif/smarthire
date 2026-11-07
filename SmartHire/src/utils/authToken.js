// Fallback storage for the access token.
// The backend sets httpOnly cookies, but when the frontend and backend run on different
// domains some browsers (Safari, Brave, Chrome incognito) block those third-party cookies.
// Keeping the short-lived access token here lets requests send it as a Bearer header instead.
const STORAGE_KEY = "smarthire-access-token";

export const getAccessToken = () => {
  try {
    return window.localStorage.getItem(STORAGE_KEY) || "";
  } catch {
    return "";
  }
};

export const setAccessToken = (token) => {
  try {
    if (token) {
      window.localStorage.setItem(STORAGE_KEY, token);
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Storage can be unavailable (private mode); cookies still work in that case.
  }
};

export const clearAccessToken = () => setAccessToken("");
