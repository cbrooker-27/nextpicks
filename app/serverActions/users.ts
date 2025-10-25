import { getGamesForWeekFromMsf } from "@/app/lib/msf";
import { getPickedGames, getThisYearsActiveUsers } from "@/app/utils/db";

export async function getUserStatsForStandings(week) {
  const activeUsers = JSON.parse(await getThisYearsActiveUsers());

  activeUsers.forEach((user) => {
    user.totalPoints = 0;
    user.points = [];
    user.points[0] = 0;
  });

  for (let i = 1; i <= week.week; i++) {
    const pickedGames = JSON.parse(await getPickedGames({ week: i, season: week.season }));
    const gamesWithScores = await getGamesForWeekFromMsf({ week: "" + i, season: "" + week.season });

    activeUsers.forEach((user) => {
      user["week" + i] = 0;
      user["weekLive" + i] = 0;
      user["possiblePoints" + i] = 0;
    });

    pickedGames.map((game) => {
      const gameData = gamesWithScores.find((g) => g._id === game._id);
      let gamePoints = [];
      const favScore = game.awayFavorite ? gameData.awayScore : gameData.homeScore;
      const undScore = game.awayFavorite ? gameData.homeScore : gameData.awayScore;
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

        if (gameData.playedStatus.startsWith("COMPLETED")) {
          user["week" + i] += gamePoints[userChoice?.choice] || 0;
          user.totalPoints += gamePoints[userChoice?.choice] || 0;
          user["possiblePoints"+i] += 2;
        } else if (gameData.playedStatus === "LIVE") {
          user["weekLive" + i] += gamePoints[userChoice?.choice] || 0;
          //console.log("Game in progress, no points awarded yet...should not get here");
        }
      });
    });
  }
  activeUsers.sort((a, b) => b.totalPoints - a.totalPoints);
  return activeUsers;
}