function findTeam(team) {
  return team.abbreviation === this;
}

export async function getThisWeeksGames() {
  return await getGamesForWeek(12);
}

export function getMSFHeaders() {
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
    "2023-2024" +
    "-regular/week/" +
    week +
    "/games.json";
  const headers = getMSFHeaders();
  const response = await fetch(msfUrl, { method: "GET", headers: headers });
  const resJson = await response.json();
  const games = resJson.games;
  const teams = resJson.references.teamReferences;
  const simpleGames = games.map((game) => {
    console.log(game)
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
