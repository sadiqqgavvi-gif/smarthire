const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const authFetch = async (url, options = {}, attemptRefresh = true) => {
  const response = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.headers || {}),
    },
  });

  if (response.status !== 401 || !attemptRefresh) {
    return response;
  }

  const refreshResponse = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
    method: "POST",
    credentials: "include",
  });

  if (!refreshResponse.ok) {
    return response;
  }

  return fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.headers || {}),
    },
  });
};

export const logoutUser = async () => {
  return authFetch(`${API_BASE_URL}/api/auth/logout`, { method: "POST" }, false);
};
