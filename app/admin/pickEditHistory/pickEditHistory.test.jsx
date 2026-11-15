import { fireEvent, render, screen } from "@testing-library/react";
import PickEditHistory from "./pickEditHistory";
import { getPickEditHistory } from "@/app/serverActions/pickEditHistory";

jest.mock("@/app/serverActions/pickEditHistory", () => ({
  getPickEditHistory: jest.fn(),
}));

const initialData = {
  events: [
    {
      id: "event-1",
      userId: "Alice",
      gameId: "123",
      season: 2026,
      week: 4,
      previousChoice: "ff",
      newChoice: "uu",
      changedAt: "2026-10-01T12:00:00.000Z",
    },
  ],
  totalEvents: 26,
  distinctPicks: 4,
  players: ["Alice", "Bob"],
  page: 1,
  pageSize: 25,
};

describe("PickEditHistory", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows event details and summary counts", () => {
    render(<PickEditHistory initialData={initialData} />);

    expect(screen.getByText("Pick changes")).toBeInTheDocument();
    expect(screen.getByText("26")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Favorite covers")).toBeInTheDocument();
    expect(screen.getByText("Underdog wins")).toBeInTheDocument();
  });

  it("applies season and week filters and paginates results", async () => {
    getPickEditHistory.mockResolvedValue({ ...initialData, page: 1 });
    render(<PickEditHistory initialData={initialData} />);

    fireEvent.change(screen.getByLabelText("Season"), { target: { value: "2026" } });
    fireEvent.change(screen.getByLabelText("Week"), { target: { value: "4" } });
    fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));

    expect(getPickEditHistory).toHaveBeenCalledWith({ season: 2026, week: 4, page: 1 });
    expect(await screen.findByText("Page 1 of 2")).toBeInTheDocument();

    getPickEditHistory.mockResolvedValue({ ...initialData, page: 2 });
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(getPickEditHistory).toHaveBeenLastCalledWith({ season: 2026, week: 4, page: 2 });
    expect(await screen.findByText("Page 2 of 2")).toBeInTheDocument();
  });
});
