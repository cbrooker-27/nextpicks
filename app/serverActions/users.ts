import { getGamesForWeekFromMsf } from "@/app/lib/msf";
import { getPickedGames, getThisYearsActiveUsers, getAllPickedGames } from "@/app/utils/db";

export async function getUserStatsForStandings(week,includeCurrentWeek) {
  const activeUsers = JSON.parse(await getThisYearsActiveUsers());

  activeUsers.forEach((user) => {
    user.totalPoints = 0;
    user.points = [];
    user.points[0] = 0;
  });

  const allPickedGames = JSON.parse(await getAllPickedGames(week.season));
  let gamesWithScores = [];

  for (let i = 1; i <= week.week; i++) {
    //const pickedGames = JSON.parse(await getPickedGames({ week: i, season: week.season }));
    if (includeCurrentWeek && i === week.week) {
        //this means we can run into live scores, we don't have thosein our db, so get them from msf
        gamesWithScores = await getGamesForWeekFromMsf({ week: "" + i, season: "" + week.season });
    }

    activeUsers.forEach((user) => {
      user["week" + i] = 0;
      user["weekLive" + i] = 0;
      user["possiblePoints" + i] = 0;
    });

    allPickedGames.filter((game) => game.week === i).map((game) => {
        if (includeCurrentWeek && i === week.week) {
            const gameData = gamesWithScores.find((g) => g._id === game._id);
            game.awayScore = gameData.awayScore;
            game.homeScore = gameData.homeScore;
            game.playedStatus = gameData.playedStatus;
        }
      let gamePoints = [];
      const favScore = game.awayFavorite ? game.awayScore : game.homeScore;
      const undScore = game.awayFavorite ? game.homeScore : game.awayScore;
      if (favScore - game.spread > undScore) {
        gamePoints["ff"] = 2;
        gamePoints["uf"] = 1;
        gamePoints["uu"] = 0;
      } else if (favScore - game.spread < undScore && favScore > undScore) {
        gamePoints["ff"] = 1;
        gamePoints["uf"] = 2;
        gamePoints["uu"] = 1;
      } else if (favScore - game.spread < undScore && favScore === undScore) {
        gamePoints["ff"] = 0;
        gamePoints["uf"] = 1;
        gamePoints["uu"] = 1;
      } else {
        gamePoints["ff"] = 0;
        gamePoints["uf"] = 1;
        gamePoints["uu"] = 2;
      }
      activeUsers.forEach((user) => {
        const userChoice = game.userChoices.find((choice) => choice.userId === user.name);

        if (game.playedStatus.startsWith("COMPLETED")) {
          user["week" + i] += gamePoints[userChoice?.choice] || 0;
          user.totalPoints += gamePoints[userChoice?.choice] || 0;
          user["possiblePoints"+i] += 2;
        } else if (game.playedStatus === "LIVE") {
          user["weekLive" + i] += gamePoints[userChoice?.choice] || 0;
          //console.log("Game in progress, no points awarded yet...should not get here");
        }
      });
    });
  }
  activeUsers.sort((a, b) => b.totalPoints - a.totalPoints);
  return activeUsers;
}