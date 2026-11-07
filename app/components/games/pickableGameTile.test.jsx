import { render, screen, fireEvent } from "@testing-library/react";
import PickableGameTile from "./pickableGameTile";
import React from "react";

jest.mock("@/app/context/SeasonStatistics", () => ({
  useSeasonStatistics: () => ({ seasonData: [] }),
}));

const mockGame = {
  startTime: "2099-09-07T13:00:00.000Z",
  awayFavorite: true,
  spread: 3.5,
  location: "Test Stadium",
  away: { id: 1, name: "Eagles", teamColoursHex: ["#000000", "#ffffff"], officialLogoImageSrc: "/eagles.png" },
  home: { id: 2, name: "Cowboys", teamColoursHex: ["#000000", "#ffffff"], officialLogoImageSrc: "/cowboys.png" },
};

const mockTeamDetails = [
  { _id: 1, name: "Eagles", teamColoursHex: ["#000000", "#ffffff"], officialLogoImageSrc: "/eagles.png" },
  { _id: 2, name: "Cowboys", teamColoursHex: ["#000000", "#ffffff"], officialLogoImageSrc: "/cowboys.png" },
];

describe("PickableGameTile", () => {
  it("renders teams and allows making a pick", () => {
    const choiceChangedMock = jest.fn();

    render(
      <PickableGameTile game={mockGame} index={0} choiceChanged={choiceChangedMock} teamDetails={mockTeamDetails} />,
    );

    expect(screen.getByText(/Eagles will win by more than 3.5/i)).toBeInTheDocument();

    const ffButton = screen.getByRole("button", { name: "ff" });
    fireEvent.click(ffButton);

    expect(choiceChangedMock).toHaveBeenCalledWith(0, "ff");
  });

  it("requires editing before changing an existing pick", () => {
    const choiceChangedMock = jest.fn();

    render(
      <PickableGameTile
        game={mockGame}
        index={0}
        choiceChanged={choiceChangedMock}
        teamDetails={mockTeamDetails}
        initialChoice="ff"
      />,
    );

    expect(screen.getByText("Submitted")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "uu" }));
    expect(choiceChangedMock).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /Edit pick/i }));
    fireEvent.click(screen.getByRole("button", { name: "uu" }));
    expect(choiceChangedMock).toHaveBeenCalledWith(0, "uu");
  });

  it("shows a started game as locked", () => {
    const startedGame = { ...mockGame, startTime: "2020-09-07T13:00:00.000Z" };

    render(
      <PickableGameTile
        game={startedGame}
        index={0}
        choiceChanged={jest.fn()}
        teamDetails={mockTeamDetails}
        initialChoice="ff"
      />,
    );

    expect(screen.getByText("Game started - pick locked")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "uu" })).toBeDisabled();
  });

  it("warns when the game venue differs from the home team's stadium", () => {
    const neutralSiteGame = {
      ...mockGame,
      venueId: 99,
      home: { ...mockGame.home, homeVenue: { id: 2, name: "Cowboys Stadium" } },
    };

    render(
      <PickableGameTile
        game={neutralSiteGame}
        index={0}
        choiceChanged={jest.fn()}
        teamDetails={mockTeamDetails}
      />,
    );

    expect(screen.getByRole("note")).toHaveTextContent("Neutral site game · Test Stadium");
  });

  it("does not warn when played at the home team's stadium", () => {
    const homeGame = {
      ...mockGame,
      venueId: 2,
      home: { ...mockGame.home, homeVenue: { id: 2, name: "Test Stadium" } },
    };

    render(
      <PickableGameTile game={homeGame} index={0} choiceChanged={jest.fn()} teamDetails={mockTeamDetails} />,
    );

    expect(screen.queryByText(/Neutral site game/)).not.toBeInTheDocument();
  });

  it("uses venue names for games without saved venue IDs", () => {
    const legacyGame = {
      ...mockGame,
      home: { ...mockGame.home, homeVenue: { name: "Cowboys Stadium" } },
    };

    render(
      <PickableGameTile game={legacyGame} index={0} choiceChanged={jest.fn()} teamDetails={mockTeamDetails} />,
    );

    expect(screen.getByRole("note")).toHaveTextContent("Neutral site game · Test Stadium");
  });
});
