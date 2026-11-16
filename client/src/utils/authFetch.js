import { API_BASE_URL } from "./apiBaseUrl";
import { clearAccessToken, getAccessToken, setAccessToken } from "./authToken";

let refreshInFlight = null;
let lastRefreshFailureAt = 0;
const REFRESH_RETRY_COOLDOWN_MS = 10 * 1000;

const AUTH_PATHS_TO_SKIP_REFRESH = new Set([
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/refresh",
  "/api/auth/logout",
]);

const AUTH_ERROR_CODES_TO_SKIP_REFRESH = new Set([
  "AUTH_TOKEN_MISSING",
  "REFRESH_TOKEN_MISSING",
]);

const getPathname = (url) => {
  try {
    return new URL(url, window.location.origin).pathname;
  } catch {
    return "";
  }
};

const shouldAttemptRefresh = (url, attemptRefresh) => {
  if (!attemptRefresh) return false;
  if (Date.now() - lastRefreshFailureAt < REFRESH_RETRY_COOLDOWN_MS) return false;
  return !AUTH_PATHS_TO_SKIP_REFRESH.has(getPathname(url));
};

const getAuthErrorCode = async (response) => {
  try {
    const body = await response.clone().json();
    return body?.error?.code || body?.code || "";
  } catch {
    return "";
  }
};

const refreshSession = async () => {
  if (!refreshInFlight) {
    refreshInFlight = fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: "POST",
      credentials: "include",
    }).catch(() => null).finally(() => {
      refreshInFlight = null;
    });
  }

  const refreshResponse = await refreshInFlight;

  if (!refreshResponse?.ok) {
    lastRefreshFailureAt = Date.now();
    clearAccessToken();
    return false;
  }

  try {
    const body = await refreshResponse.clone().json();
    if (body?.accessToken) setAccessToken(body.accessToken);
  } catch {
    // Body is optional; cookies were refreshed anyway.
  }

  return true;
};

const buildHeaders = (headers = {}) => {
  const token = getAccessToken();
  const hasAuthHeader = Object.keys(headers).some(
    (key) => key.toLowerCase() === "authorization"
  );

  return token && !hasAuthHeader
    ? { ...headers, Authorization: `Bearer ${token}` }
    : { ...headers };
};

export const authFetch = async (url, options = {}, attemptRefresh = true) => {
  const response = await fetch(url, {
    ...options,
    credentials: "include",
    headers: buildHeaders(options.headers),
  });

  if (response.status !== 401 || !shouldAttemptRefresh(url, attemptRefresh)) {
    return response;
  }

  const authErrorCode = await getAuthErrorCode(response);
  if (AUTH_ERROR_CODES_TO_SKIP_REFRESH.has(authErrorCode)) {
    return response;
  }

  const refreshSucceeded = await refreshSession();
  if (!refreshSucceeded) {
    return response;
  }

  return fetch(url, {
    ...options,
    credentials: "include",
    headers: buildHeaders(options.headers),
  });
};

export const logoutUser = async () => {
  try {
    return await authFetch(
      `${API_BASE_URL}/api/auth/logout`,
      { method: "POST" },
      false
    );
  } finally {
    lastRefreshFailureAt = 0;
    clearAccessToken();
  }
};
