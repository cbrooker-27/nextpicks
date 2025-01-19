"use server";
import { getCurrentWeek } from "@/utils/db";

function findTeam(team) {
  return team.abbreviation === this;
}

export async function getThisWeeksGames() {
  const currentWeek = await getCurrentWeek();
  return await getGamesForWeek(currentWeek);
}

function getMSFHeaders() {
  const headers = new Headers();
  headers.append(
    "Authorization",
    "Basic " +
      Buffer.from("" + process.env.MYSPORTSFEED_CREDS).toString("base64")
  );
  return headers;
}

export async function getGamesForWeek(week) {
  const msfUrl =
    "" +
    process.env.MYSPORTSFEED_BASE_URL +
    week.season +
    "-" +
    (week.season + 1) +
    "-regular/week/" +
    week.week +
    "/games.json";
  console.log("msfURL:" + msfUrl);
  const headers = getMSFHeaders();
  const response = await fetch(msfUrl, { method: "GET", headers: headers });
  const resJson = await response.json();
  const games = resJson.games;
  const teams = resJson.references.teamReferences;
  const simpleGames = games.map((game) => {
    console.log(game);
    return {
      _id: game.schedule.id,
      week: game.schedule.week,
      startTime: game.schedule.startTime,
      away: teams.find(findTeam, game.schedule.awayTeam.abbreviation),
      home: teams.find(findTeam, game.schedule.homeTeam.abbreviation),
      location: game.schedule.venue.name,
    };
  });
  return simpleGames;
}
