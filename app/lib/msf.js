"use server";
import { getCurrentWeek } from "@/app/utils/db";

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

async function fetchFromMsf(url, headers) {
  const controller = new AbortController();
  const timeoutMs = Number(process.env.MSF_TIMEOUT_MS) || 10000;
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { method: "GET", headers, signal: controller.signal });
    if (!response.ok) {
      throw new Error(`MSF request failed with status ${response.status}`);
    }
    const data = await response.json();
    return { response, data };
  } finally {
    clearTimeout(timeout);
  }
}

export async function getGamesForWeekFromMsfWithStatus(week) {
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
  // console.log("msfURL:" + msfUrl);
  const headers = getMSFHeaders();
  if (process.env.DEV_MODE === "true") {
    console.log(`[EXTERNAL_CALL] URL: ${msfUrl} | Data: GET (none)`);
  }
  let response;
  try {
    const result = await fetchFromMsf(msfUrl, headers);
    response = result.response;
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
        homeScore: game.score.homeScoreTotal,
        awayScore: game.score.awayScoreTotal,
        playedStatus: game.schedule.playedStatus,
        currentQuarter: game.score.currentQuarter,
        timeRemaining: game.score.currentQuarterSecondsRemaining,
        intermission: game.score.currentIntermission,
      };
    });
    simpleGames.sort((a, b) => a._id - b._id);
    return { data: simpleGames, source: "live" };
  } catch (error) {
    console.error("Error fetching games from MSF:", error);
    return { data: [], source: "unavailable" };
  }
}

export async function getGamesForWeekFromMsf(week) {
  const result = await getGamesForWeekFromMsfWithStatus(week);
  return result.data;
}

export async function getTeamStatisticsFromMsfWithStatus(week) {
  const msfUrl = `${process.env.MYSPORTSFEED_BASE_URL}${week.season}-${
    week.season + 1
  }-regular/standings.json?stats=W,L,T,PF,PA`;
  console.log("msfURL:" + msfUrl);
  const headers = getMSFHeaders();
  if (process.env.DEV_MODE === "true") {
    console.log(`[EXTERNAL_CALL] URL: ${msfUrl} | Data: GET (none)`);
  }
  try {
    const result = await fetchFromMsf(msfUrl, headers);
    const response = result.response;
    const resJson = result.data;
    if (process.env.DEV_MODE === "true") {
      console.log(`[EXTERNAL_CALL] Return Code: ${response.status}`);
    }
    const teams = resJson.teams;
    const simpleTeams = teams.map((team) => {
      return {
        _id: team.team.id,
        wins: team.stats.standings.wins,
        losses: team.stats.standings.losses,
        ties: team.stats.standings.ties,
        pointsFor: team.stats.standings.pointsFor,
        pointsAgainst: team.stats.standings.pointsAgainst,
      };
    });
    return { data: simpleTeams, source: "live" };
  } catch (error) {
    console.error("Error fetching team statistics from MSF:", error);
    return { data: [], source: "unavailable" };
  }
}

export async function getTeamStatisticsFromMsf(week) {
  const result = await getTeamStatisticsFromMsfWithStatus(week);
  return result.data;
}
