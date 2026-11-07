import { Alert, Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import { auth } from "../../../auth";
import { isAdminEmail } from "@/app/lib/admin";
import { getTeamStatsMetrics } from "@/app/lib/msfTeamStatsMetrics";

const numberFormatter = new Intl.NumberFormat();
const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "medium",
});

export default async function MsfDiagnosticsPage() {
  const session = await auth();
  if (!isAdminEmail(session?.user?.email)) {
    return <p>You are not authorized to view MSF diagnostics.</p>;
  }

  const metrics = await getTeamStatsMetrics();
  const failures = [...(metrics?.recentFailures || [])].reverse();
  const requestCount = metrics?.requestCount || 0;
  const averageDurationMs = requestCount ? Math.round(metrics.totalDurationMs / requestCount) : 0;

  return (
    <Box sx={{ maxWidth: 1100, mx: "auto", p: { xs: 2, sm: 4 } }}>
      <Typography variant="h4" component="h1" sx={{ mb: 1 }}>
        MSF Request Diagnostics
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Production request totals are stored in MongoDB. Individual MSF failures are retained here up to the most recent 50.
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: 2,
          mb: 4,
        }}
      >
        <Metric label="Completed requests" value={requestCount} />
        <Metric label="Successful" value={metrics?.successCount || 0} />
        <Metric label="Timeouts" value={metrics?.timeoutCount || 0} />
        <Metric label="Other errors" value={metrics?.errorCount || 0} />
        <Metric label="Average duration" value={`${numberFormatter.format(averageDurationMs)} ms`} />
      </Box>

      <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
        Recent failures
      </Typography>
      {failures.length === 0 ? (
        <Alert severity="success">No MSF request failures have been recorded.</Alert>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small" aria-label="Recent MSF team-record failures">
            <TableHead>
              <TableRow>
                <TableCell>Time</TableCell>
                <TableCell>Request</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Season</TableCell>
                <TableCell>Week</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>HTTP</TableCell>
                <TableCell>Error</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {failures.map((failure, index) => (
                <TableRow key={`${failure.at}-${index}`}>
                  <TableCell>{dateFormatter.format(new Date(failure.at))}</TableCell>
                  <TableCell>
                    {failure.requestType === "games"
                      ? "Games"
                      : failure.requestType === "odds"
                        ? "Odds"
                        : "Team statistics"}
                  </TableCell>
                  <TableCell>{failure.status}</TableCell>
                  <TableCell>{failure.season}</TableCell>
                  <TableCell>{failure.week ?? "—"}</TableCell>
                  <TableCell>{numberFormatter.format(failure.durationMs)} ms</TableCell>
                  <TableCell>{failure.httpStatus || "—"}</TableCell>
                  <TableCell>{`${failure.errorName}: ${failure.message}`}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        Last request: {metrics?.lastRequestAt ? dateFormatter.format(new Date(metrics.lastRequestAt)) : "No requests yet"}
      </Typography>
    </Box>
  );
}

function Metric({ label, value }) {
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h5" component="p">
        {typeof value === "number" ? numberFormatter.format(value) : value}
      </Typography>
    </Paper>
  );
}
