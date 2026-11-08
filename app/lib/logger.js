const levels = { debug: 10, info: 20, warn: 30, error: 40 };

function minimumLevel() {
  const configuredLevel = process.env.LOG_LEVEL?.toLowerCase();
  if (configuredLevel && levels[configuredLevel] !== undefined) return configuredLevel;
  if (process.env.NODE_ENV === "test") return "error";
  return process.env.DEV_MODE === "true" ? "debug" : "info";
}

export function isDebugEnabled() {
  return levels.debug >= levels[minimumLevel()];
}

function writeLog(level, event, details = {}) {
  if (levels[level] < levels[minimumLevel()]) return;

  const entry = {
    timestamp: new Date().toISOString(),
    level,
    event,
    ...details,
  };
  console[level](JSON.stringify(entry));
}

export function logDebug(event, details) {
  writeLog("debug", event, details);
}

export function logInfo(event, details) {
  writeLog("info", event, details);
}

export function logWarn(event, details) {
  writeLog("warn", event, details);
}

export function logError(event, error, details = {}) {
  writeLog("error", event, {
    ...details,
    error: {
      name: error instanceof Error ? error.name : typeof error,
      message: error instanceof Error ? error.message : String(error),
      ...(error?.code ? { code: error.code } : {}),
    },
  });
}
