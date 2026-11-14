import { render } from "@testing-library/react";
import StandingsLineChart from "./StandingsLineChart";
import { LineChart } from "@mui/x-charts/LineChart";

jest.mock("@mui/x-charts/LineChart", () => ({
  LineChart: jest.fn(() => null),
}));

describe("StandingsLineChart", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("uses numeric weekly points with matching week labels", () => {
    render(
      <StandingsLineChart
        maxWeek={3}
        userStats={[
          { name: "Alpha", totalPoints: 7, week1: 2, week2: 5, week3: 0 },
          { name: "Beta", totalPoints: 4, week1: 1, week2: 1, week3: 2 },
        ]}
      />,
    );

    const chartProps = LineChart.mock.calls[0][0];
    expect(chartProps.series).toEqual([
      expect.objectContaining({ label: "Alpha", data: [2, 5, 0] }),
      expect.objectContaining({ label: "Beta", data: [1, 1, 2] }),
    ]);
    expect(chartProps.xAxis).toEqual([{ scaleType: "point", data: ["W1", "W2", "W3"] }]);
  });

  it("limits the chart to the top users and configured completed weeks", () => {
    render(
      <StandingsLineChart
        maxWeek={1}
        maxSeries={1}
        userStats={[
          { name: "Lower", totalPoints: 2, week1: 2 },
          { name: "Top", totalPoints: 5, week1: 5 },
        ]}
      />,
    );

    const chartProps = LineChart.mock.calls[0][0];
    expect(chartProps.series).toEqual([expect.objectContaining({ label: "Top", data: [5] })]);
    expect(chartProps.xAxis[0].data).toEqual(["W1"]);
  });
});
