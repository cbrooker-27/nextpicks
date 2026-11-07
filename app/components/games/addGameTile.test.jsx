import { fireEvent, render, screen } from "@testing-library/react";
import AddGameTile from "./addGameTile";

describe("AddGameTile", () => {
  it("renders a compact matchup row and exposes the favorite toggle", () => {
    const game = {
      _id: 42,
      spread: 3.5,
      awayFavorite: true,
      home: {
        name: "Cowboys",
        city: "Dallas",
        officialLogoImageSrc: "/cowboys.png",
        teamColoursHex: ["#003594", "#869397"],
      },
      away: {
        name: "Eagles",
        city: "Philadelphia",
        officialLogoImageSrc: "/eagles.png",
        teamColoursHex: ["#004C54", "#A5ACAF"],
      },
    };
    const favoriteUpdated = jest.fn();

    render(
      <AddGameTile
        game={game}
        index={0}
        spreadUpdated={jest.fn()}
        favoriteUpdated={favoriteUpdated}
      />,
    );

    expect(screen.getByText("Dallas")).toBeInTheDocument();
    expect(screen.getByText("Cowboys")).toBeInTheDocument();
    expect(screen.getByText("Philadelphia")).toBeInTheDocument();
    expect(screen.getByText("Eagles")).toBeInTheDocument();
    expect(screen.getByRole("spinbutton", { name: "Cowboys versus Eagles spread" })).toHaveValue(3);

    fireEvent.click(screen.getByRole("switch", { name: "Philadelphia Eagles favored" }));
    expect(favoriteUpdated).toHaveBeenCalledWith(0, false);
  });
});
