const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1"]);

const trimTrailingSlash = (value) => value.replace(/\/+$/, "");

const resolveApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  const browserHost = window.location.hostname;

  if (!envUrl) {
    if (import.meta.env.PROD) {
      // A deployed build without VITE_API_URL would quietly call port 5000 on its own host.
      console.error(
        "VITE_API_URL is not set for this build, so API requests will fail. " +
          "Add it in the hosting provider's environment variables and redeploy."
      );
    }
    return `${window.location.protocol}//${browserHost}:5000`;
  }

  try {
    const parsed = new URL(envUrl);

    // Keep localhost and 127.0.0.1 aligned to avoid cross-site cookie issues in dev.
    if (
      LOCAL_HOSTS.has(parsed.hostname) &&
      LOCAL_HOSTS.has(browserHost) &&
      parsed.hostname !== browserHost
    ) {
      parsed.hostname = browserHost;
    }

    return trimTrailingSlash(parsed.toString());
  } catch {
    return trimTrailingSlash(envUrl);
  }
};

export const API_BASE_URL = resolveApiBaseUrl();
