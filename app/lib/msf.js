"use server";
import { randomUUID } from "node:crypto";
import { after } from "next/server";
import { getCurrentWeek } from "@/app/utils/db";
import { recordMsfRequest, recordPendingMsfRequest } from "@/app/lib/msfTeamStatsMetrics";

const MAX_MSF_TIMEOUT_MS = 7000;
const MAX_MSF_DIAGNOSTIC_TIMEOUT_MS = 50000;

function findTeam(team) {
  return team.abbreviation === this;
}

export async function getThisWeeksGamesFromMsf() {
  const currentWeek = await getCurrentWeek();
  return await getGamesForWeekFromMsf(currentWeek);
}

function getMSFHeaders() {
  const headers = new Headers();
  headers.append("Authorization", "Basic " + Buffer.from("" + process.env.MYSPORTSFEED_CREDS).toString("base64"));
  return headers;
}

function getMsfTimeoutMs() {
  const configuredTimeoutMs = Number(process.env.MSF_TIMEOUT_MS);
  if (!Number.isFinite(configuredTimeoutMs) || configuredTimeoutMs <= 0) {
    return MAX_MSF_TIMEOUT_MS;
  }
  return Math.min(configuredTimeoutMs, MAX_MSF_TIMEOUT_MS);
}

function getMsfDiagnosticTimeoutMs() {
  const configuredTimeoutMs = Number(process.env.MSF_DIAGNOSTIC_TIMEOUT_MS);
  if (!Number.isFinite(configuredTimeoutMs) || configuredTimeoutMs <= 0) {
    return MAX_MSF_DIAGNOSTIC_TIMEOUT_MS;
  }
  return Math.min(configuredTimeoutMs, MAX_MSF_DIAGNOSTIC_TIMEOUT_MS);
}

async function fetchFromMsf(url, headers, timeoutMs = getMsfTimeoutMs()) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  let response;

  try {
    response = await fetch(url, { method: "GET", headers, signal: controller.signal });
    if (!response.ok) {
      const error = new Error(`MSF request failed with status ${response.status}`);
      error.name = "MsfHttpError";
      error.status = response.status;
      if (typeof response.text === "function") {
        try {
          error.responseBody = (await response.text()).slice(0, 2000);
        } catch (bodyError) {
          error.responseBodyReadError =
            bodyError instanceof Error ? bodyError.message : String(bodyError);
        }
      }
      throw error;
    }
    let data;
    try {
      data = await response.json();
    } catch (error) {
      if (error instanceof Error) error.status = response.status;
      throw error;
    }
    return { response, data };
  } catch (error) {
    if (controller.signal.aborted) {
      const timeoutError = new Error(`MSF request timed out after ${timeoutMs}ms`, { cause: error });
      timeoutError.name = "TimeoutError";
      if (response) timeoutError.status = response.status;
      throw timeoutError;
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function logMsfRequest({
  requestType,
  week,
  startedAt,
  status,
  httpStatus,
  error,
  resultCount,
  requestId,
  persistImmediately = true,
}) {
  const durationMs = Date.now() - startedAt;
  const logContext = {
    event: `msf_${requestType}_request`,
    season: week.season,
    week: week.week,
    ...(requestId ? { requestId } : {}),
  };
  if (status === "success") {
    console.info(
      JSON.stringify({
        ...logContext,
        status,
        durationMs,
        httpStatus,
        resultCount,
      }),
    );
  } else {
    const errorName = error instanceof Error ? error.name : typeof error;
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(
      JSON.stringify({
        ...logContext,
        status,
        durationMs,
        httpStatus,
        responseBody: error?.responseBody,
        error: {
          name: errorName,
          message: errorMessage,
          ...(error?.responseBodyReadError ? { responseBodyReadError: error.responseBodyReadError } : {}),
        },
      }),
    );
  }
  const metric = {
    requestId,
    requestType,
    status,
    season: week.season,
    week: week.week,
    durationMs,
    httpStatus,
    resultCount,
    responseBody: error?.responseBody,
    responseBodyReadError: error?.responseBodyReadError,
    error:
      status === "success"
        ? undefined
        : {
            name: error instanceof Error ? error.name : typeof error,
            message: error instanceof Error ? error.message : String(error),
          },
  };
  if (persistImmediately) {
    await recordMsfRequest(metric);
  } else {
    after(() => recordMsfRequest(metric));
  }
}

async function resolveTeamStatsRequest({ week, startedAt, requestId, outcome, persistImmediately = false }) {
  if (outcome.error) {
    const error = outcome.error;
    const status = error instanceof Error && error.name === "TimeoutError" ? "timeout" : "error";
    await logMsfRequest({
      requestType: "team_stats",
      week,
      startedAt,
      status,
      httpStatus: error instanceof Error ? error.status : undefined,
      error,
      requestId,
      persistImmediately,
    });
    return { data: [], source: "unavailable" };
  }

  let httpStatus;
  try {
    const { response, data: resJson } = outcome.result;
    httpStatus = response.status;
    const simpleTeams = resJson.teams.map((team) => ({
      _id: team.team.id,
      wins: team.stats.standings.wins,
      losses: team.stats.standings.losses,
      ties: team.stats.standings.ties,
      pointsFor: team.stats.standings.pointsFor,
      pointsAgainst: team.stats.standings.pointsAgainst,
    }));
    await logMsfRequest({
      requestType: "team_stats",
      week,
      startedAt,
      status: "success",
      httpStatus: response.status,
      resultCount: simpleTeams.length,
      requestId,
      persistImmediately,
    });
    return { data: simpleTeams, source: "live" };
  } catch (error) {
    const status = error instanceof Error && error.name === "TimeoutError" ? "timeout" : "error";
    await logMsfRequest({
      requestType: "team_stats",
      week,
      startedAt,
      status,
      httpStatus: error instanceof Error ? error.status ?? httpStatus : httpStatus,
      error,
      requestId,
      persistImmediately,
    });
    return { data: [], source: "unavailable" };
  }
}

export async function getGamesForWeekFromMsfWithStatus(week) {
  const startedAt = Date.now();
  const timeoutMs = getMsfTimeoutMs();
  console.info(
    JSON.stringify({
      event: "msf_games_request",
      season: week.season,
      week: week.week,
      timeoutMs,
      status: "started",
    }),
  );
  try {
    const msfUrl =
      "" +
      process.env.MYSPORTSFEED_BASE_URL +
      week.season +
      "-" +
      (week.season + 1) +
      "-regular" +
      // "current" + doesn't work in the offseason
      "/week/" +
      week.week +
      "/games.json";
    const headers = getMSFHeaders();
    if (process.env.DEV_MODE === "true") {
      console.log(`[EXTERNAL_CALL] URL: ${msfUrl} | Data: GET (none)`);
    }
    const result = await fetchFromMsf(msfUrl, headers);
    const response = result.response;
    const resJson = result.data;
    if (process.env.DEV_MODE === "true") {
      console.log(`[EXTERNAL_CALL] Return Code: ${response.status}`);
    }
    const games = resJson.games;
    const teams = resJson.references.teamReferences;
    const simpleGames = games.map((game) => {
      return {
        _id: game.schedule.id,
        week: game.schedule.week,
        startTime: game.schedule.startTime,
        away: teams.find(findTeam, game.schedule.awayTeam.abbreviation),
        home: teams.find(findTeam, game.schedule.homeTeam.abbreviation),
        location: game.schedule.venue.name,
        venueId: game.schedule.venue.id,
        venueAllegiance: game.schedule.venueAllegiance,
        homeScore: game.score.homeScoreTotal,
        awayScore: game.score.awayScoreTotal,
        playedStatus: game.schedule.playedStatus,
        currentQuarter: game.score.currentQuarter,
        timeRemaining: game.score.currentQuarterSecondsRemaining,
        intermission: game.score.currentIntermission,
      };
    });
    simpleGames.sort((a, b) => a._id - b._id);
    await logMsfRequest({
      requestType: "games",
      week,
      startedAt,
      status: "success",
      httpStatus: response.status,
      resultCount: simpleGames.length,
      persistImmediately: false,
    });
    return { data: simpleGames, source: "live" };
  } catch (error) {
    console.error("Error fetching games from MSF:", error);
    const status = error instanceof Error && error.name === "TimeoutError" ? "timeout" : "error";
    await logMsfRequest({
      requestType: "games",
      week,
      startedAt,
      status,
      httpStatus: error instanceof Error ? error.status : undefined,
      error,
      persistImmediately: false,
    });
    return { data: [], source: "unavailable" };
  }
}

export async function getGamesForWeekFromMsf(week) {
  const result = await getGamesForWeekFromMsfWithStatus(week);
  return result.data;
}

export async function getTeamStatisticsFromMsfWithStatus(week) {
  const startedAt = Date.now();
  const timeoutMs = getMsfTimeoutMs();
  const diagnosticTimeoutMs = getMsfDiagnosticTimeoutMs();
  const logContext = {
    event: "msf_team_stats_request",
    season: week.season,
    week: week.week,
    timeoutMs,
    diagnosticTimeoutMs,
  };
  console.info(JSON.stringify({ ...logContext, status: "started" }));
  try {
    const msfUrl = `${process.env.MYSPORTSFEED_BASE_URL}${week.season}-${
      week.season + 1
    }-regular/standings.json?stats=W,L,T,PF,PA`;
    const headers = getMSFHeaders();
    if (process.env.DEV_MODE === "true") {
      console.log(`[EXTERNAL_CALL] URL: ${msfUrl} | Data: GET (none)`);
    }
    const requestId = randomUUID();
    const requestPromise = fetchFromMsf(msfUrl, headers, diagnosticTimeoutMs).then(
      (result) => ({ result }),
      (error) => ({ error }),
    );
    let responseTimer;
    const outcome = await Promise.race([
      requestPromise,
      new Promise((resolve) => {
        responseTimer = setTimeout(() => resolve({ pending: true }), timeoutMs);
      }),
    ]);
    clearTimeout(responseTimer);

    if (!outcome.pending) {
      return await resolveTeamStatsRequest({ week, startedAt, outcome });
    }

    after(async () => {
      await recordPendingMsfRequest({
        requestId,
        requestType: "team_stats",
        season: week.season,
        week: week.week,
        timeoutMs: diagnosticTimeoutMs,
      });
      console.warn(
        JSON.stringify({
          ...logContext,
          status: "pending",
          message: "MSF response exceeded the page wait; continuing in the background.",
          requestId,
        }),
      );
      const finalOutcome = await requestPromise;
      await resolveTeamStatsRequest({
        week,
        startedAt,
        requestId,
        outcome: finalOutcome,
        persistImmediately: true,
      });
    });
    return { data: [], source: "unavailable", pending: true };
  } catch (error) {
    const status = error instanceof Error && error.name === "TimeoutError" ? "timeout" : "error";
    await logMsfRequest({
      requestType: "team_stats",
      week,
      startedAt,
      status,
      httpStatus: error instanceof Error ? error.status : undefined,
      error,
    });
    return { data: [], source: "unavailable" };
  }
}

export async function getTeamStatisticsFromMsf(week) {
  const result = await getTeamStatisticsFromMsfWithStatus(week);
  return result.data;
}

function getNumericLine(line) {
  if (line === null || line === undefined || line === "") {
    return null;
  }
  const value = typeof line === "number" ? line : Number(line);
  return Number.isFinite(value) ? value : null;
}

function getGameSpread(gameLines) {
  let latestSpread = null;

  for (const gameLine of gameLines) {
    for (const source of gameLine.lines || []) {
      for (const lineEntry of source.pointSpreads || []) {
        const pointSpread = lineEntry.pointSpread || lineEntry;
        if (pointSpread.gameSegment !== "FULL") {
          continue;
        }

        const awaySpread = getNumericLine(pointSpread.awaySpread ?? pointSpread.awayLine);
        const homeSpread = getNumericLine(pointSpread.homeSpread ?? pointSpread.homeLine);
        if (awaySpread === null && homeSpread === null) {
          continue;
        }

        let awayFavorite;
        if (awaySpread !== null && homeSpread !== null) {
          if (awaySpread === homeSpread) {
            continue;
          }
          awayFavorite = awaySpread < homeSpread;
        } else if (awaySpread !== null) {
          if (awaySpread === 0) {
            continue;
          }
          awayFavorite = awaySpread < 0;
        } else {
          if (homeSpread === 0) {
            continue;
          }
          awayFavorite = homeSpread > 0;
        }

        const asOfTime = Date.parse(lineEntry.asOfTime || pointSpread.asOfTime);
        if (!Number.isFinite(asOfTime)) {
          continue;
        }
        if (latestSpread && asOfTime <= latestSpread.asOfTime) {
          continue;
        }

        latestSpread = {
          spread: Math.max(Math.abs(awaySpread || 0), Math.abs(homeSpread || 0)),
          awayFavorite,
          source: source.source?.name || source.source?.abbreviation || null,
          asOfTime,
        };
      }
    }
  }

  if (!latestSpread) {
    return null;
  }

  const { asOfTime, ...spread } = latestSpread;
  return spread;
}

export async function getGameSpreadsFromMsfWithStatus(week) {
  const startedAt = Date.now();
  const timeoutMs = getMsfTimeoutMs();
  console.info(
    JSON.stringify({
      event: "msf_odds_request",
      season: week.season,
      week: week.week,
      timeoutMs,
      status: "started",
    }),
  );

  try {
    const msfUrl = `${process.env.MYSPORTSFEED_BASE_URL}${week.season}-${
      week.season + 1
    }-regular/week/${week.week}/odds_gamelines.json?force=true`;
    const headers = getMSFHeaders();
    if (process.env.DEV_MODE === "true") {
      console.log(`[EXTERNAL_CALL] URL: ${msfUrl} | Data: GET (none)`);
    }

    const result = await fetchFromMsf(msfUrl, headers);
    const spreadsByGameId = {};
    for (const gameLine of result.data.gameLines || []) {
      const gameId = gameLine.game?.id;
      if (gameId === undefined || gameId === null) {
        continue;
      }
      const spread = getGameSpread([gameLine]);
      if (spread) {
        spreadsByGameId[String(gameId)] = spread;
      }
    }

    await logMsfRequest({
      requestType: "odds",
      week,
      startedAt,
      status: "success",
      httpStatus: result.response.status,
      resultCount: Object.keys(spreadsByGameId).length,
    });
    return { data: spreadsByGameId, source: "live" };
  } catch (error) {
    const status = error instanceof Error && error.name === "TimeoutError" ? "timeout" : "error";
    await logMsfRequest({
      requestType: "odds",
      week,
      startedAt,
      status,
      httpStatus: error instanceof Error ? error.status : undefined,
      error,
    });
    return { data: {}, source: "unavailable" };
  }
}

export async function getGameSpreadsFromMsf(week) {
  const result = await getGameSpreadsFromMsfWithStatus(week);
  return result.data;
}
