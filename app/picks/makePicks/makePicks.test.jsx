import { act, render, screen, waitFor } from "@testing-library/react";
import MakePicks from "./makePicks";
import { useSession } from "next-auth/react";
import { getCurrentWeek, getThisWeeksPickedGames, getAllGames, getLatestTeamRecordSnapshot } from "@/app/utils/db";

jest.mock("next-auth/react", () => ({
  useSession: jest.fn(),
  signIn: jest.fn(),
}));

jest.mock("@/app/utils/db", () => ({
  getCurrentWeek: jest.fn(),
  getThisWeeksPickedGames: jest.fn(),
  getAllGames: jest.fn(),
  getLatestTeamRecordSnapshot: jest.fn(),
}));

jest.mock(
  "./makePicksForm",
  () =>
    function MockMakePicksForm({ games, teamDetails }) {
      return (
        <div data-testid="make-picks-form" data-team-count={teamDetails.length}>
          Form for {games.length} games
        </div>
      );
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
  let teamRecordsRequest;
  let seasonRequest;

  beforeEach(() => {
    jest.clearAllMocks();
    weekRequest = deferred();
    picksRequest = deferred();
    teamRecordsRequest = deferred();
    seasonRequest = deferred();
    useSession.mockReturnValue({ data: { user: { name: "TestUser" } }, status: "authenticated" });
    getCurrentWeek.mockReturnValue(weekRequest.promise);
    getThisWeeksPickedGames.mockReturnValue(picksRequest.promise);
    getLatestTeamRecordSnapshot.mockReturnValue(teamRecordsRequest.promise);
    getAllGames.mockReturnValue(seasonRequest.promise);
  });

  it("keeps picks usable when this season has no local team-record snapshot", async () => {
    render(<MakePicks />);

    expect(screen.getByText("Load local team-record snapshot")).toBeInTheDocument();
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
    expect(screen.getByText("Load local team-record snapshot").parentElement).toHaveTextContent("Loading");

    await act(async () => {
      weekRequest.resolve({ week: 3, season: 2026 });
    });
    await waitFor(() => expect(getLatestTeamRecordSnapshot).toHaveBeenCalledWith(2026));

    await act(async () => {
      teamRecordsRequest.resolve(null);
      seasonRequest.resolve([]);
    });

    expect(await screen.findByRole("button", { name: /3 of 4 calls succeeded/ })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(screen.getByText("Load local team-record snapshot").parentElement).toHaveTextContent("Failed");
    expect(screen.getByRole("status")).toHaveTextContent("Picks can still be submitted");
    expect(screen.getByTestId("make-picks-form")).toBeInTheDocument();
  });

  it("passes the local snapshot teams into pick entry", async () => {
    getCurrentWeek.mockResolvedValue({ week: 3, season: 2026 });
    getThisWeeksPickedGames.mockResolvedValue(JSON.stringify([{ _id: "game-1", userChoices: [] }]));
    getLatestTeamRecordSnapshot.mockResolvedValue({ teams: [{ _id: 1, wins: 1 }] });
    getAllGames.mockResolvedValue([]);

    render(<MakePicks />);

    await waitFor(() => expect(getLatestTeamRecordSnapshot).toHaveBeenCalledWith(2026));
    expect(await screen.findByTestId("make-picks-form")).toHaveAttribute("data-team-count", "1");
  });
});
