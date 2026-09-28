import { act, render, screen, waitFor } from "@testing-library/react";
import MakePicks from "./makePicks";
import { useSession } from "next-auth/react";
import { getCurrentWeek, getThisWeeksPickedGames, getAllGames } from "@/app/utils/db";
import { getTeamStatisticsFromMsfWithStatus } from "@/app/lib/msf";

jest.mock("next-auth/react", () => ({
  useSession: jest.fn(),
  signIn: jest.fn(),
}));

jest.mock("@/app/utils/db", () => ({
  getCurrentWeek: jest.fn(),
  getThisWeeksPickedGames: jest.fn(),
  getAllGames: jest.fn(),
}));

jest.mock("@/app/lib/msf.js", () => ({
  getTeamStatisticsFromMsfWithStatus: jest.fn(),
}));

jest.mock(
  "./makePicksForm",
  () =>
    function MockMakePicksForm({ games }) {
      return <div data-testid="make-picks-form">Form for {games.length} games</div>;
    },
);

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

describe("MakePicks incremental loading", () => {
  let weekRequest;
  let picksRequest;
  let teamRequest;
  let seasonRequest;

  beforeEach(() => {
    jest.clearAllMocks();
    weekRequest = deferred();
    picksRequest = deferred();
    teamRequest = deferred();
    seasonRequest = deferred();
    useSession.mockReturnValue({ data: { user: { name: "TestUser" } }, status: "authenticated" });
    getCurrentWeek.mockReturnValue(weekRequest.promise);
    getThisWeeksPickedGames.mockReturnValue(picksRequest.promise);
    getTeamStatisticsFromMsfWithStatus.mockReturnValue(teamRequest.promise);
    getAllGames.mockReturnValue(seasonRequest.promise);
  });

  it("shows picks before standings resolve and reports the external failure", async () => {
    render(<MakePicks />);

    expect(screen.getByText("Get team records from MySportsFeeds")).toBeInTheDocument();
    await act(async () => {
      picksRequest.resolve(
        JSON.stringify([
          {
            _id: "game-1",
            userChoices: [],
          },
        ]),
      );
    });

    expect(await screen.findByTestId("make-picks-form")).toHaveTextContent("Form for 1 games");
    expect(screen.getByText("Get team records from MySportsFeeds").parentElement).toHaveTextContent("Loading");

    await act(async () => {
      weekRequest.resolve({ week: 3, season: 2026 });
    });
    await waitFor(() => expect(getTeamStatisticsFromMsfWithStatus).toHaveBeenCalledWith({ week: 3, season: 2026 }));

    await act(async () => {
      teamRequest.resolve({ data: [], source: "unavailable" });
      seasonRequest.resolve([]);
    });

    expect(await screen.findByRole("button", { name: /3 of 4 calls succeeded/ })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(screen.getByText("Get team records from MySportsFeeds").parentElement).toHaveTextContent("Failed");
    expect(screen.getByTestId("make-picks-form")).toBeInTheDocument();
  });
});
