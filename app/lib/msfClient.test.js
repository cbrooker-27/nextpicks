import { getMsfFeed } from "./msfClient";

describe("MSF feed client", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    jest.useRealTimers();
    global.fetch = originalFetch;
  });

  it("requests feed data through independent GET endpoints", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [], source: "live" }),
    });

    await Promise.all([
      getMsfFeed("games", { season: 2026, week: 10 }),
      getMsfFeed("team-stats", { season: 2026, week: 10 }),
    ]);

    expect(global.fetch).toHaveBeenNthCalledWith(
      1,
      "/api/msf/games?season=2026&week=10",
      expect.objectContaining({ cache: "no-store", signal: expect.any(AbortSignal) }),
    );
    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      "/api/msf/team-stats?season=2026&week=10",
      expect.objectContaining({ cache: "no-store", signal: expect.any(AbortSignal) }),
    );
  });

  it("rejects a feed request after the page timeout", async () => {
    jest.useFakeTimers();
    let requestSignal;
    global.fetch = jest.fn((_url, { signal }) => {
      requestSignal = signal;
      return new Promise(() => {});
    });

    const request = getMsfFeed("team-stats", { season: 2026, week: 10 });
    const assertion = expect(request).rejects.toThrow("timed out after 9000ms");
    await jest.advanceTimersByTimeAsync(9000);
    await assertion;
    expect(requestSignal.aborted).toBe(true);
  });
});
