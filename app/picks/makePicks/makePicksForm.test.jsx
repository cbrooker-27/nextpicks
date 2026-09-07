import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import MakePicksForm from "./makePicksForm";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { addUserChoices } from "@/app/utils/db";
import React from "react";

jest.mock("next-auth/react", () => ({
  useSession: jest.fn(),
  signIn: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("@/app/utils/db", () => ({
  addUserChoices: jest.fn(),
}));

jest.mock("@/app/context/SeasonStatistics", () => ({
  useSeasonStatistics: () => ({ seasonData: [] }),
}));

describe("MakePicksForm", () => {
  const mockGames = [
    {
      _id: "game1",
      startTime: "2099-09-07T13:00:00.000Z",
      awayFavorite: true,
      spread: 3.5,
      location: "Test Stadium",
      away: { id: 1, name: "Eagles", teamColoursHex: ["#000000", "#ffffff"], officialLogoImageSrc: "/eagles.png" },
      home: { id: 2, name: "Cowboys", teamColoursHex: ["#000000", "#ffffff"], officialLogoImageSrc: "/cowboys.png" },
    },
  ];

  const mockTeamDetails = [
    { _id: 1, name: "Eagles", teamColoursHex: ["#000000", "#ffffff"], officialLogoImageSrc: "/eagles.png" },
    { _id: 2, name: "Cowboys", teamColoursHex: ["#000000", "#ffffff"], officialLogoImageSrc: "/cowboys.png" },
  ];

  const mockRouter = { push: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    useRouter.mockReturnValue(mockRouter);
  });

  it("shows loading state initially", () => {
    useSession.mockReturnValue({ status: "loading" });
    render(<MakePicksForm games={mockGames} teamDetails={mockTeamDetails} />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("calls signIn if unauthenticated", () => {
    useSession.mockReturnValue({ status: "unauthenticated" });
    render(<MakePicksForm games={mockGames} teamDetails={mockTeamDetails} />);
    expect(signIn).toHaveBeenCalledTimes(1);
  });

  it("renders games and allows submission when all picks are made", async () => {
    useSession.mockReturnValue({
      status: "authenticated",
      data: { user: { name: "TestUser" } },
    });

    render(<MakePicksForm games={mockGames} teamDetails={mockTeamDetails} />);

    expect(screen.getByText("Make Your Picks")).toBeInTheDocument();

    // Submit button should not be visible initially
    expect(screen.queryByText("Submit Picks")).not.toBeInTheDocument();

    // Make a pick
    const ffButton = screen.getByRole("button", { name: "ff" });
    fireEvent.click(ffButton);

    // Submit button should appear
    const submitButton = await screen.findByRole("button", { name: "Submit Picks" });
    expect(submitButton).toBeInTheDocument();

    // Submit the form
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(addUserChoices).toHaveBeenCalledTimes(1);
      expect(addUserChoices).toHaveBeenCalledWith([
        expect.objectContaining({
          gameId: "game1",
          userId: "TestUser",
          choice: "ff",
        }),
      ]);
      expect(mockRouter.push).toHaveBeenCalledWith("/picks/view");
    });
  });

  it("does not allow submission until every future game has a pick", async () => {
    useSession.mockReturnValue({
      status: "authenticated",
      data: { user: { name: "TestUser" } },
    });

    const secondGame = {
      ...mockGames[0],
      _id: "game2",
      away: mockGames[0].home,
      home: mockGames[0].away,
    };
    render(<MakePicksForm games={[mockGames[0], secondGame]} teamDetails={mockTeamDetails} />);

    fireEvent.click(screen.getAllByRole("button", { name: "ff" })[0]);
    expect(screen.queryByRole("button", { name: "Submit Picks" })).not.toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: "ff" })[1]);
    expect(await screen.findByRole("button", { name: "Submit Picks" })).toBeInTheDocument();
  });
});
