import { act, fireEvent, render, screen } from "@testing-library/react";
import AddGamesForm from "./addGamesForm";
import { addGames } from "@/app/utils/db";

jest.mock("@/app/utils/db", () => ({
  addGames: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("../../components/games/addGameTile", () => function MockAddGameTile({ game, spreadUpdated, index }) {
  return (
    <div>
      <input
        aria-label="Spread"
        type="number"
        value={game.spread == null ? "" : game.spread - 0.5}
        onChange={(event) => spreadUpdated(index, event)}
      />
    </div>
  );
});

describe("AddGamesForm", () => {
  it("rounds down the MSF spread before adding the internal half point", async () => {
    const game = {
      _id: 42,
      away: { name: "Eagles" },
      home: { name: "Cowboys" },
    };
    addGames.mockResolvedValue(undefined);
    render(
      <AddGamesForm
        games={[game]}
        teamDetails={[]}
        gameSpreads={{ "42": { spread: 3.9, awayFavorite: true, source: "BetOnline" } }}
      />,
    );

    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Spread")).toBeInTheDocument();
    expect(screen.getByText("Away")).toBeInTheDocument();
    expect(screen.getByLabelText("Spread")).toHaveValue(3);
    await act(async () => fireEvent.click(screen.getByRole("button", { name: /Add Games/ })));
    expect(addGames).toHaveBeenCalledWith([
      expect.objectContaining({ _id: 42, spread: 3.5, awayFavorite: true }),
    ]);
  });

  it("stores spreads below two points as zero", async () => {
    const game = {
      _id: 43,
      away: { name: "Team A" },
      home: { name: "Team B" },
    };
    addGames.mockResolvedValue(undefined);
    render(
      <AddGamesForm
        games={[game]}
        teamDetails={[]}
        gameSpreads={{ "43": { spread: 1.5, awayFavorite: true } }}
      />,
    );

    expect(screen.getByLabelText("Spread")).toHaveValue(0);
    await act(async () => fireEvent.click(screen.getByRole("button", { name: /Add Games/ })));
    expect(addGames).toHaveBeenCalledWith([
      expect.objectContaining({ _id: 43, spread: 0.5, awayFavorite: true }),
    ]);
  });

  it("rounds down manually entered spreads before adding the internal half point", async () => {
    const game = {
      _id: 44,
      away: { name: "Team A" },
      home: { name: "Team B" },
    };
    addGames.mockResolvedValue(undefined);
    render(<AddGamesForm games={[game]} teamDetails={[]} gameSpreads={{}} />);

    fireEvent.change(screen.getByLabelText("Spread"), { target: { value: "4.9" } });
    expect(screen.getByLabelText("Spread")).toHaveValue(4);
    await act(async () => fireEvent.click(screen.getByRole("button", { name: /Add Games/ })));
    expect(addGames).toHaveBeenCalledWith([
      expect.objectContaining({ _id: 44, spread: 4.5 }),
    ]);
  });
});
