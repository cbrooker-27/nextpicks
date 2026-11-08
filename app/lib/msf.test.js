import {
  getGameSpreadsFromMsfWithStatus,
  getGamesForWeekFromMsf,
  getTeamStatisticsFromMsf,
  getTeamStatisticsFromMsfWithStatus,
  getThisWeeksGamesFromMsf,
} from "./msf";
import * as dbUtils from "@/app/utils/db";
import { recordMsfRequest } from "@/app/lib/msfTeamStatsMetrics";
import { after } from "next/server";
import { isMsfRequestLog, spyOnConsole } from "@/app/testUtils/console";

jest.mock("@/app/utils/db", () => ({
  getCurrentWeek: jest.fn(),
}));

jest.mock("@/app/lib/msfTeamStatsMetrics", () => ({
  recordMsfRequest: jest.fn().mockResolvedValue(undefined),
  recordPendingMsfRequest: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("next/server", () => ({
  after: jest.fn(),
}));

global.fetch = jest.fn();

describe("msf.js", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetAllMocks();
    after.mockReset();
    process.env = {
      ...originalEnv,
      MYSPORTSFEED_BASE_URL: "https://api.mysportsfeeds.com/v2.1/pull/nfl/",
      MYSPORTSFEED_CREDS: "testuser:testpass",
    };
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  const mockGamesResponse = {
    games: [
      {
        schedule: {
          id: 1,
          week: 1,
          startTime: "2025-09-07T13:00:00.000Z",
          awayTeam: { abbreviation: "PHI" },
          homeTeam: { abbreviation: "DAL" },
          venue: { id: 44, name: "AT&T Stadium" },
          venueAllegiance: "HOME",
          playedStatus: "COMPLETED",
        },
        score: {
          homeScoreTotal: 24,
          awayScoreTotal: 21,
          currentQuarter: 4,
          currentQuarterSecondsRemaining: 0,
          currentIntermission: 0,
        },
      },
    ],
    references: {
      teamReferences: [
        { abbreviation: "PHI", name: "Eagles" },
        { abbreviation: "DAL", name: "Cowboys", homeVenue: { id: 44, name: "AT&T Stadium" } },
      ],
    },
  };

  it("getGamesForWeekFromMsf formats games correctly", async () => {
    fetch.mockResolvedValueOnce({
      status: 200,
      ok: true,
      json: async () => mockGamesResponse,
    });

    const games = await getGamesForWeekFromMsf({ season: 2025, week: 1 });

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      "https://api.mysportsfeeds.com/v2.1/pull/nfl/2025-2026-regular/week/1/games.json",
      expect.objectContaining({ method: "GET" }),
    );

    expect(games).toHaveLength(1);
    expect(games[0]._id).toBe(1);
    expect(games[0].homeScore).toBe(24);
    expect(games[0].home.name).toBe("Cowboys");
    expect(games[0].venueId).toBe(44);
    expect(games[0].venueAllegiance).toBe("HOME");
    await after.mock.calls[0][0]();
    expect(recordMsfRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        requestType: "games",
        status: "success",
        season: 2025,
        week: 1,
        httpStatus: 200,
      }),
    );
  });

  it("getThisWeeksGamesFromMsf uses getCurrentWeek", async () => {
    dbUtils.getCurrentWeek.mockResolvedValueOnce({ season: 2025, week: 2 });
    fetch.mockResolvedValueOnce({
      status: 200,
      ok: true,
      json: async () => mockGamesResponse,
    });

    await getThisWeeksGamesFromMsf();
    expect(dbUtils.getCurrentWeek).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      "https://api.mysportsfeeds.com/v2.1/pull/nfl/2025-2026-regular/week/2/games.json",
      expect.any(Object),
    );
  });

  it("getTeamStatisticsFromMsf formats team stats correctly", async () => {
    fetch.mockResolvedValueOnce({
      status: 200,
      ok: true,
      json: async () => ({
        teams: [
          {
            team: { id: 10, abbreviation: "PHI" },
            stats: { standings: { wins: 10, losses: 2, ties: 0, pointsFor: 300, pointsAgainst: 200 } },
          },
        ],
      }),
    });

    const teams = await getTeamStatisticsFromMsf({ season: 2025 });

    expect(teams).toHaveLength(1);
    expect(teams[0]._id).toBe(10);
    expect(teams[0].wins).toBe(10);
  });

  it("logs each team statistics request and its successful result", async () => {
    process.env.LOG_LEVEL = "debug";
    const debug = spyOnConsole("debug", isMsfRequestLog);
    fetch.mockResolvedValueOnce({
      status: 200,
      ok: true,
      json: async () => ({
        teams: [
          {
            team: { id: 10 },
            stats: { standings: { wins: 10, losses: 2, ties: 0, pointsFor: 300, pointsAgainst: 200 } },
          },
        ],
      }),
    });

    await expect(getTeamStatisticsFromMsfWithStatus({ season: 2025 })).resolves.toMatchObject({
      source: "live",
      data: [{ _id: 10, wins: 10 }],
    });

    expect(debug).toHaveBeenCalledTimes(2);
    expect(JSON.parse(debug.mock.calls[0][0])).toMatchObject({
      event: "msf_team_stats_request",
      season: 2025,
      status: "started",
    });
    expect(JSON.parse(debug.mock.calls[1][0])).toMatchObject({
      event: "msf_team_stats_request",
      status: "success",
      httpStatus: 200,
      resultCount: 1,
    });
    debug.mockRestore();
  });

  it("does not wait for metric persistence before returning team stats", async () => {
    recordMsfRequest.mockImplementationOnce(() => new Promise(() => {}));
    fetch.mockResolvedValueOnce({
      status: 200,
      ok: true,
      json: async () => ({
        teams: [{ team: { id: 10 }, stats: { standings: { wins: 10 } } }],
      }),
    });

    await expect(getTeamStatisticsFromMsfWithStatus({ season: 2025, week: 4 })).resolves.toMatchObject({
      source: "live",
      data: [{ _id: 10, wins: 10 }],
    });

    expect(after).toHaveBeenCalledTimes(1);
    expect(recordMsfRequest).not.toHaveBeenCalled();
  });

  it("logs team statistics request timeouts explicitly", async () => {
    process.env.LOG_LEVEL = "debug";
    const debug = spyOnConsole("debug", isMsfRequestLog);
    jest.useFakeTimers();
    fetch.mockImplementationOnce((_url, options) => new Promise((_resolve, reject) => {
      options.signal.addEventListener("abort", () => reject(new Error("aborted")));
    }));
    process.env.MSF_TIMEOUT_MS = "1";
    process.env.MSF_DIAGNOSTIC_TIMEOUT_MS = "2";

    const request = getTeamStatisticsFromMsfWithStatus({ season: 2025, week: 4 });
    await jest.advanceTimersByTimeAsync(1);
    await expect(request).resolves.toMatchObject({
      data: [],
      source: "unavailable",
      pending: true,
    });

    expect(JSON.parse(debug.mock.calls[0][0])).toMatchObject({
      event: "msf_team_stats_request",
      status: "started",
    });
    expect(after).toHaveBeenCalledTimes(1);
    const backgroundWork = after.mock.calls[0][0]();
    await jest.advanceTimersByTimeAsync(1);
    await backgroundWork;

    expect(debug).toHaveBeenCalledTimes(3);
    expect(JSON.parse(debug.mock.calls[2][0])).toMatchObject({
      event: "msf_team_stats_request",
      status: "timeout",
      error: { name: "TimeoutError" },
    });
    expect(recordMsfRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        requestType: "team_stats",
        season: 2025,
        week: 4,
        status: "timeout",
        error: expect.objectContaining({ name: "TimeoutError" }),
      }),
    );
    debug.mockRestore();
  });

  it("caps the team statistics timeout below the Vercel function deadline", async () => {
    process.env.LOG_LEVEL = "debug";
    const debug = spyOnConsole("debug", isMsfRequestLog);
    process.env.MSF_TIMEOUT_MS = "30000";
    fetch.mockResolvedValueOnce({
      status: 200,
      ok: true,
      json: async () => ({ teams: [] }),
    });

    await getTeamStatisticsFromMsfWithStatus({ season: 2025, week: 4 });

    expect(JSON.parse(debug.mock.calls[0][0])).toMatchObject({
      event: "msf_team_stats_request",
      timeoutMs: 7000,
      status: "started",
    });
    debug.mockRestore();
  });

  it("returns after the page wait and records the eventual team statistics response", async () => {
    let resolveFetch;
    fetch.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        }),
    );
    process.env.MSF_TIMEOUT_MS = "1";

    await expect(getTeamStatisticsFromMsfWithStatus({ season: 2025, week: 4 })).resolves.toMatchObject({
      data: [],
      source: "unavailable",
      pending: true,
    });

    expect(after).toHaveBeenCalledTimes(1);
    expect(recordMsfRequest).not.toHaveBeenCalled();

    resolveFetch({
      status: 200,
      ok: true,
      json: async () => ({
        teams: [
          {
            team: { id: 10 },
            stats: { standings: { wins: 10, losses: 2, ties: 0, pointsFor: 300, pointsAgainst: 200 } },
          },
        ],
      }),
    });
    await after.mock.calls[0][0]();

    const { recordPendingMsfRequest } = require("@/app/lib/msfTeamStatsMetrics");
    expect(recordPendingMsfRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        requestType: "team_stats",
        season: 2025,
        week: 4,
        timeoutMs: 50000,
      }),
    );
    expect(recordMsfRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        requestType: "team_stats",
        season: 2025,
        week: 4,
        status: "success",
        httpStatus: 200,
        resultCount: 1,
        requestId: expect.any(String),
      }),
    );
  });

  it("captures the HTTP status and error body from a late team statistics response", async () => {
    let resolveFetch;
    fetch.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        }),
    );
    process.env.MSF_TIMEOUT_MS = "1";

    await getTeamStatisticsFromMsfWithStatus({ season: 2025, week: 4 });
    resolveFetch({
      status: 503,
      ok: false,
      text: async () => JSON.stringify({ errorCode: "UPSTREAM_BUSY" }),
    });
    await after.mock.calls[0][0]();

    expect(recordMsfRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        requestType: "team_stats",
        season: 2025,
        week: 4,
        status: "error",
        httpStatus: 503,
        responseBody: JSON.stringify({ errorCode: "UPSTREAM_BUSY" }),
        error: expect.objectContaining({ name: "MsfHttpError" }),
        requestId: expect.any(String),
      }),
    );
  });

  it("logs HTTP errors with their status code", async () => {
    process.env.LOG_LEVEL = "debug";
    const debug = spyOnConsole("debug", isMsfRequestLog);
    fetch.mockResolvedValueOnce({
      status: 503,
      ok: false,
      text: async () => JSON.stringify({ errorCode: "UPSTREAM_BUSY" }),
    });

    await expect(getTeamStatisticsFromMsfWithStatus({ season: 2025, week: 4 })).resolves.toMatchObject({
      data: [],
      source: "unavailable",
    });

    expect(debug).toHaveBeenCalledTimes(2);
    expect(JSON.parse(debug.mock.calls[1][0])).toMatchObject({
      event: "msf_team_stats_request",
      status: "error",
      httpStatus: 503,
      error: { name: "MsfHttpError", message: "MSF request failed with status 503" },
    });
    await after.mock.calls[0][0]();
    expect(recordMsfRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        requestType: "team_stats",
        status: "error",
        httpStatus: 503,
        responseBody: JSON.stringify({ errorCode: "UPSTREAM_BUSY" }),
      }),
    );
    debug.mockRestore();
  });

  it("uses the latest full-game spread to return each game's favorite and spread", async () => {
    fetch.mockResolvedValueOnce({
      status: 200,
      ok: true,
      json: async () => ({
        gameLines: [
          {
            game: { id: 21 },
            lines: [
              {
                source: { name: "BetOnline" },
                pointSpreads: [
                  {
                    asOfTime: "2025-09-01T10:00:00.000Z",
                    pointSpread: {
                      gameSegment: "FULL",
                      awaySpread: -2.5,
                      homeSpread: 2.5,
                      awayLine: { american: -110 },
                      homeLine: { american: -110 },
                    },
                  },
                  {
                    asOfTime: "2025-09-02T10:00:00.000Z",
                    pointSpread: {
                      gameSegment: "FIRST_HALF",
                      awaySpread: -4.5,
                      homeSpread: 4.5,
                    },
                  },
                  {
                    asOfTime: "2025-09-03T10:00:00.000Z",
                    pointSpread: {
                      gameSegment: "FULL",
                      awaySpread: -3.5,
                      homeSpread: 3.5,
                      awayLine: { american: -110 },
                      homeLine: { american: -110 },
                    },
                  },
                ],
              },
            ],
          },
        ],
      }),
    });

    await expect(getGameSpreadsFromMsfWithStatus({ season: 2025, week: 1 })).resolves.toMatchObject({
      source: "live",
      data: {
        "21": {
          spread: 3.5,
          awayFavorite: true,
          source: "BetOnline",
        },
      },
    });

    expect(fetch).toHaveBeenCalledWith(
      "https://api.mysportsfeeds.com/v2.1/pull/nfl/2025-2026-regular/week/1/odds_gamelines.json?force=true",
      expect.objectContaining({ method: "GET" }),
    );
    expect(recordMsfRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        requestType: "odds",
        status: "success",
        season: 2025,
        week: 1,
        httpStatus: 200,
      }),
    );
  });

  it("returns no spreads when the odds feed is unavailable", async () => {
    fetch.mockResolvedValueOnce({ status: 503, ok: false });

    await expect(getGameSpreadsFromMsfWithStatus({ season: 2025, week: 1 })).resolves.toMatchObject({
      data: {},
      source: "unavailable",
    });
    expect(recordMsfRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        requestType: "odds",
        status: "error",
        httpStatus: 503,
      }),
    );
  });

  it("returns no games when the MSF request is aborted", async () => {
    fetch.mockImplementationOnce((_url, options) => {
      options.signal.addEventListener("abort", () => {});
      return new Promise((_resolve, reject) => {
        options.signal.addEventListener("abort", () => reject(new Error("aborted")));
      });
    });

    process.env.MSF_TIMEOUT_MS = "1";

    await expect(getGamesForWeekFromMsf({ season: 2025, week: 1 })).resolves.toEqual([]);
    await after.mock.calls[0][0]();
    expect(recordMsfRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        requestType: "games",
        status: "timeout",
        season: 2025,
        week: 1,
        error: expect.objectContaining({ name: "TimeoutError" }),
      }),
    );
  });

  it("returns no games when the MSF request fails", async () => {
    fetch.mockRejectedValueOnce(new Error("MSF unavailable"));

    await expect(getGamesForWeekFromMsf({ season: 2025, week: 1 })).resolves.toEqual([]);
    await after.mock.calls[0][0]();
    expect(recordMsfRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        requestType: "games",
        status: "error",
        season: 2025,
        week: 1,
        error: expect.objectContaining({ message: "MSF unavailable" }),
      }),
    );
  });
});
