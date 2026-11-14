import type { Game, UserChoice } from "../../types";

type NpcUserId = "Homer" | "Jackie" | "Freddy" | "Underdog" | "Robbie" | "Sammy";

export function createNpcChoices(game: Game): UserChoice[] {
  if (game._id === undefined) {
    throw new Error("Cannot seed NPC picks for a game without an ID.");
  }

  const robbieChoices: UserChoice["choice"][] = game.spread === 0.5 ? ["ff", "uu"] : ["ff", "uf", "uu"];
  const choices: [NpcUserId, UserChoice["choice"]][] = [
    ["Homer", game.awayFavorite ? "uu" : "ff"],
    ["Jackie", game.awayFavorite ? "ff" : "uu"],
    ["Freddy", "ff"],
    ["Underdog", "uu"],
    ["Robbie", robbieChoices[Math.floor(Math.random() * robbieChoices.length)]],
    ["Sammy", "uf"],
  ];

  return choices
    .filter(([userId]) => !game.userChoices?.some((choice) => choice.userId === userId))
    .map(([userId, choice]) => ({
      gameId: game._id,
      userId,
      choice,
      selectionTime: new Date().toISOString(),
    }));
}
