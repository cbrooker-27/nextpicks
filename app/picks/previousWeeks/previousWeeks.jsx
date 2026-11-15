"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Alert,
  Chip,
  FormControlLabel,
  Paper,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { getUserStatsForStandings } from "@/app/serverActions/users";
import { getCurrentWeek } from "@/app/utils/db";
import styles from "./previousWeeks.module.css";

export default function PreviousWeeks() {
  const [week, setWeek] = useState(null);
  const [userStats, setUserStats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [includeNpc, setIncludeNpc] = useState(true);
  const [includeAdminPicks, setIncludeAdminPicks] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadScores() {
      try {
        const currentWeek = await getCurrentWeek();
        const stats = await getUserStatsForStandings(currentWeek, true);
        if (!isMounted) return;
        setWeek(currentWeek);
        setUserStats(stats);
      } catch (error) {
        console.error("Error loading previous-week scores:", error);
        if (isMounted) setLoadError("Unable to load previous-week scores right now.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void loadScores();
    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return <Typography role="status">Loading previous-week scores...</Typography>;
  }

  if (loadError) {
    return <Alert severity="error">{loadError}</Alert>;
  }

  if (!week) {
    return <Alert severity="error">Current week information is unavailable.</Alert>;
  }

  const weeks = Array.from({ length: week.week }, (_, index) => index + 1);
  const visibleUsers = userStats.filter((user) => includeNpc || !user.npc);
  const hasAdminPicks = userStats.some((user) => user.hasAdminPicks);
  const currentWeekInProgress = userStats.some((user) => user[`weekInProgress${week.week}`]);

  return (
    <main>
      <Typography variant="h4" component="h1" gutterBottom>
        Previous Weeks
      </Typography>
      <div className={styles.controls}>
        <FormControlLabel
          control={<Switch checked={includeNpc} onChange={(event) => setIncludeNpc(event.target.checked)} />}
          label="Include NPCs"
        />
        {hasAdminPicks && (
          <FormControlLabel
            control={
              <Switch
                checked={includeAdminPicks}
                onChange={(event) => setIncludeAdminPicks(event.target.checked)}
              />
            }
            label="Show points from admin picks"
          />
        )}
      </div>
      <TableContainer component={Paper} className={styles.tableContainer}>
        <Table className={styles.table}>
          <TableHead>
            <TableRow>
              <TableCell component="th" scope="col" className={styles.weekHeader}>
                Week
              </TableCell>
              {visibleUsers.map((user) => (
                <TableCell key={user.name} component="th" scope="col" align="center">
                  {user.name}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {weeks.map((weekNumber) => (
              <TableRow key={weekNumber} className={weekNumber === week.week ? styles.currentWeekRow : undefined}>
                <TableCell component="th" scope="row" className={styles.weekHeader}>
                  <Link href={`/picks/view?week=${weekNumber}&season=${week.season}`} className={styles.weekLink}>
                    Week {weekNumber}
                  </Link>
                  {weekNumber === week.week && currentWeekInProgress && (
                    <Chip className={styles.progressChip} label="In progress" size="small" />
                  )}
                </TableCell>
                {visibleUsers.map((user) => (
                  <TableCell key={user.name} align="center">
                    {(user[`week${weekNumber}`] || 0) -
                      (includeAdminPicks ? 0 : user[`adminPointsWeek${weekNumber}`] || 0)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </main>
  );
}
