const log = (level, event, payload = {}) => {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    event,
    ...payload,
  };

  const line = JSON.stringify(entry);

  if (level === "error") {
    console.error(line);
    return;
  }

  if (level === "warn") {
    console.warn(line);
    return;
  }

  console.log(line);
};

export const logInfo = (event, payload) => log("info", event, payload);
export const logWarn = (event, payload) => log("warn", event, payload);
export const logError = (event, payload) => log("error", event, payload);

