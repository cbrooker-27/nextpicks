import {
  Alert,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { auth } from "../../../auth";
import { isAdminEmail } from "@/app/lib/admin";
import { getTeamStatsMetrics } from "@/app/lib/msfTeamStatsMetrics";
import styles from "./msfDiagnostics.module.css";

const numberFormatter = new Intl.NumberFormat();
const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "medium",
});

export default async function MsfDiagnostics() {
  const session = await auth();
  if (!isAdminEmail(session?.user?.email)) {
    return <p>You are not authorized to view MSF diagnostics.</p>;
  }

  const metrics = await getTeamStatsMetrics();
  const failures = [...(metrics?.recentFailures || [])].reverse();
  const recentRequests = [...(metrics?.recentRequests || [])].reverse();
  const requestCount = metrics?.requestCount || 0;
  const averageDurationMs = requestCount ? Math.round(metrics.totalDurationMs / requestCount) : 0;

  return (
    <Box className={styles.root}>
      <Typography variant="h4" component="h1" className={styles.title}>
        MSF Request Diagnostics
      </Typography>
      <Typography color="text.secondary" className={styles.description}>
        Production request totals are stored in MongoDB. Individual MSF failures are retained here up to the most recent 50.
      </Typography>

      <Box className={styles.metrics}>
        <Metric label="Completed requests" value={requestCount} />
        <Metric label="Successful" value={metrics?.successCount || 0} />
        <Metric label="Timeouts" value={metrics?.timeoutCount || 0} />
        <Metric label="Other errors" value={metrics?.errorCount || 0} />
        <Metric label="Average duration" value={`${numberFormatter.format(averageDurationMs)} ms`} />
      </Box>

      <Typography variant="h5" component="h2" className={styles.sectionTitle}>
        Recent slow requests
      </Typography>
      <Typography color="text.secondary" className={styles.sectionDescription}>
        Pending requests have not recorded a final response yet. Refresh this page after a short wait to see whether
        MySportsFeeds returned a status and error body.
      </Typography>
      {recentRequests.length === 0 ? (
        <Alert severity="info" className={styles.sectionBottom}>
          No team-record requests have exceeded the page wait yet.
        </Alert>
      ) : (
        <TableContainer component={Paper} variant="outlined" className={styles.sectionBottom}>
          <Table size="small" aria-label="Recent slow MSF team-record requests">
            <TableHead>
              <TableRow>
                <TableCell>Started</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Season / week</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>HTTP</TableCell>
                <TableCell>Result details</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recentRequests.map((request) => (
                <TableRow key={request.requestId}>
                  <TableCell>{dateFormatter.format(new Date(request.at))}</TableCell>
                  <TableCell>{request.status}</TableCell>
                  <TableCell>{`${request.season} / ${request.week}`}</TableCell>
                  <TableCell>
                    {request.durationMs === undefined
                      ? "In flight"
                      : `${numberFormatter.format(request.durationMs)} ms`}
                  </TableCell>
                  <TableCell>{request.httpStatus || "—"}</TableCell>
                  <TableCell>
                    {request.errorName ? `${request.errorName}: ${request.message}` : ""}
                    {request.resultCount !== undefined ? `${request.resultCount} teams returned` : ""}
                    {request.responseBody && <pre className={styles.responseBody}>{request.responseBody}</pre>}
                    {request.responseBodyReadError &&
                      `Response body read error: ${request.responseBodyReadError}`}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Typography variant="h5" component="h2" className={styles.sectionTitle}>
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
                  <TableCell>
                    {`${failure.errorName}: ${failure.message}`}
                    {failure.responseBody && <pre className={styles.responseBody}>{failure.responseBody}</pre>}
                    {failure.responseBodyReadError &&
                      `Response body read error: ${failure.responseBodyReadError}`}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      <Typography variant="body2" color="text.secondary" className={styles.lastRequest}>
        Last request: {metrics?.lastRequestAt ? dateFormatter.format(new Date(metrics.lastRequestAt)) : "No requests yet"}
      </Typography>
    </Box>
  );
}

function Metric({ label, value }) {
  return (
    <Paper variant="outlined" className={styles.metric}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h5" component="p">
        {typeof value === "number" ? numberFormatter.format(value) : value}
      </Typography>
    </Paper>
  );
}
