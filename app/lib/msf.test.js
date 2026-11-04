import {
  getGamesForWeekFromMsf,
  getTeamStatisticsFromMsf,
  getTeamStatisticsFromMsfWithStatus,
  getThisWeeksGamesFromMsf,
} from "./msf";
import * as dbUtils from "@/app/utils/db";

jest.mock("@/app/utils/db", () => ({
  getCurrentWeek: jest.fn(),
}));

jest.mock("@/app/lib/msfTeamStatsMetrics", () => ({
  recordTeamStatsRequest: jest.fn().mockResolvedValue(undefined),
}));

global.fetch = jest.fn();

describe("msf.js", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetAllMocks();
    process.env = {
      ...originalEnv,
      MYSPORTSFEED_BASE_URL: "https://api.mysportsfeeds.com/v2.1/pull/nfl/",
      MYSPORTSFEED_CREDS: "testuser:testpass",
    };
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
          venue: { name: "AT&T Stadium" },
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
        { abbreviation: "DAL", name: "Cowboys" },
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
    const info = jest.spyOn(console, "info").mockImplementation(() => {});
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

    expect(info).toHaveBeenCalledTimes(2);
    expect(JSON.parse(info.mock.calls[0][0])).toMatchObject({
      event: "msf_team_stats_request",
      season: 2025,
      status: "started",
    });
    expect(JSON.parse(info.mock.calls[1][0])).toMatchObject({
      event: "msf_team_stats_request",
      status: "success",
      httpStatus: 200,
      teamCount: 1,
    });
    info.mockRestore();
  });

  it("logs team statistics request timeouts explicitly", async () => {
    const info = jest.spyOn(console, "info").mockImplementation(() => {});
    const error = jest.spyOn(console, "error").mockImplementation(() => {});
    fetch.mockImplementationOnce((_url, options) => new Promise((_resolve, reject) => {
      options.signal.addEventListener("abort", () => reject(new Error("aborted")));
    }));
    process.env.MSF_TIMEOUT_MS = "1";

    await expect(getTeamStatisticsFromMsfWithStatus({ season: 2025 })).resolves.toMatchObject({
      data: [],
      source: "unavailable",
    });

    expect(JSON.parse(info.mock.calls[0][0])).toMatchObject({
      event: "msf_team_stats_request",
      status: "started",
    });
    expect(error).toHaveBeenCalledTimes(1);
    expect(JSON.parse(error.mock.calls[0][0])).toMatchObject({
      event: "msf_team_stats_request",
      status: "timeout",
      error: { name: "TimeoutError" },
    });
    info.mockRestore();
    error.mockRestore();
  });

  it("logs HTTP errors with their status code", async () => {
    const error = jest.spyOn(console, "error").mockImplementation(() => {});
    fetch.mockResolvedValueOnce({ status: 503, ok: false });

    await expect(getTeamStatisticsFromMsfWithStatus({ season: 2025 })).resolves.toMatchObject({
      data: [],
      source: "unavailable",
    });

    expect(error).toHaveBeenCalledTimes(1);
    expect(JSON.parse(error.mock.calls[0][0])).toMatchObject({
      event: "msf_team_stats_request",
      status: "error",
      httpStatus: 503,
      error: { name: "MsfHttpError", message: "MSF request failed with status 503" },
    });
    error.mockRestore();
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
  });

  it("returns no games when the MSF request fails", async () => {
    fetch.mockRejectedValueOnce(new Error("MSF unavailable"));

    await expect(getGamesForWeekFromMsf({ season: 2025, week: 1 })).resolves.toEqual([]);
  });
});
