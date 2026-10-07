import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import AdminOverridePicks from "./adminOverridePicks";
import { getAdminPickGames, getAdminPickOptions } from "@/app/serverActions/adminPicks";

jest.mock("@/app/serverActions/adminPicks", () => ({
  getAdminPickGames: jest.fn(),
  getAdminPickOptions: jest.fn(),
  saveAdminOverridePicks: jest.fn(),
}));

const mockGames = [
  {
    id: "picked-game",
    startTime: "2020-09-07T13:00:00.000Z",
    awayName: "Eagles",
    homeName: "Cowboys",
    favoriteName: "Eagles",
    underdogName: "Cowboys",
    spread: 3.5,
    choice: "ff",
    adminOverride: false,
  },
  {
    id: "unpicked-game",
    startTime: "2020-09-08T13:00:00.000Z",
    awayName: "Bills",
    homeName: "Jets",
    favoriteName: "Bills",
    underdogName: "Jets",
    spread: 2.5,
    choice: "",
    adminOverride: false,
  },
];

describe("AdminOverridePicks", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getAdminPickOptions.mockResolvedValue({ users: [{ name: "Alice" }], periods: [{ week: 2, season: 2026 }] });
    getAdminPickGames.mockResolvedValue(mockGames);
  });

  it("defaults to unpicked games and highlights a saved choice when picked games are shown", async () => {
    render(<AdminOverridePicks />);

    fireEvent.click(await screen.findByRole("button", { name: "Load locked games" }));
    expect(await screen.findByText("Bills at Jets")).toBeInTheDocument();
    expect(screen.queryByText("Eagles at Cowboys")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("switch", { name: "Show currently picked games (1)" }));

    expect(await screen.findByText("Eagles at Cowboys")).toBeInTheDocument();
    expect(screen.getByText("Current pick: Eagles by more than 3.5")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "favorite covers" })[0]).toHaveAttribute("aria-pressed", "true");
  });
});