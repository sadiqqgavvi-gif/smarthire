// Turns an axios/fetch error into a message a user can act on.
export const getAuthErrorMessage = (err, fallback = "Something went wrong") => {
  const status = err?.response?.status;
  const data = err?.response?.data || {};
  const code = data?.error?.code || data?.code || "";
  const apiMessage = data?.error?.message || data?.message;

  if (code === "DATABASE_UNAVAILABLE" || status === 503) {
    return "Our server can't reach the database right now. Please try again in a minute.";
  }

  if (code === "RATE_LIMITED" || status === 429) {
    return apiMessage || "Too many attempts. Please wait a moment and try again.";
  }

  if (code === "CORS_BLOCKED") {
    return "This website is not allowed to talk to the server yet (CORS). Please contact the admin.";
  }

  if (!err?.response && (err?.code === "ERR_NETWORK" || err?.message === "Network Error")) {
    return "Cannot reach the SmartHire server. Check your internet connection and try again.";
  }

  return apiMessage || err?.message || fallback;
};
