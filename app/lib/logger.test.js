import { logDebug, logInfo } from "./logger";

describe("application logger", () => {
  const originalLogLevel = process.env.LOG_LEVEL;

  afterEach(() => {
    if (originalLogLevel === undefined) delete process.env.LOG_LEVEL;
    else process.env.LOG_LEVEL = originalLogLevel;
    jest.restoreAllMocks();
  });

  it("writes structured info events", () => {
    const info = jest.spyOn(console, "info").mockImplementation(() => {});
    process.env.LOG_LEVEL = "info";

    logInfo("picks.saved", { pickCount: 2 });

    expect(JSON.parse(info.mock.calls[0][0])).toMatchObject({
      level: "info",
      event: "picks.saved",
      pickCount: 2,
    });
  });

  it("omits debug events unless debug logging is enabled", () => {
    const debug = jest.spyOn(console, "debug").mockImplementation(() => {});
    process.env.LOG_LEVEL = "info";

    logDebug("msf_games_request", { status: "started" });

    expect(debug).not.toHaveBeenCalled();
  });
});
