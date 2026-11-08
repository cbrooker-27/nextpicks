export function spyOnConsole(method, shouldFilter) {
  const original = console[method].bind(console);
  return jest.spyOn(console, method).mockImplementation((...args) => {
    if (!shouldFilter(...args)) {
      original(...args);
    }
  });
}

export function isMsfRequestLog(message) {
  if (typeof message !== "string") return false;

  try {
    const log = JSON.parse(message);
    return typeof log.event === "string" && log.event.startsWith("msf_") && log.event.endsWith("_request");
  } catch {
    return false;
  }
}
