"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Avatar,
  Typography,
  Box,
  Paper,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Skeleton,
} from "@mui/material";
import { Close, SmartToy, EmojiEvents } from "@mui/icons-material";
import { getUserStatsForStandings } from "@/app/serverActions/users";
import { getCurrentWeek } from "@/app/utils/db";

export default function ProfileModal({ open, onClose, user }) {
  const [userStats, setUserStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [weekData, setWeekData] = useState(null);

  useEffect(() => {
    if (!open || !user) return;

    async function fetchUserStats() {
      try {
        setIsLoading(true);
        const currentWeek = await getCurrentWeek();
        setWeekData(currentWeek);

        // Get stats up to current week
        const stats = await getUserStatsForStandings(currentWeek, false);
        const userStat = stats.find((u) => u.name === user.name);
        // Store all stats for ranking calculations
        if (userStat) {
          userStat._allStats = stats;
        }
        setUserStats(userStat);
      } catch (error) {
        console.error("Error fetching user stats:", error);
      } finally {
        setIsLoading(false);
      }
    }

    void fetchUserStats();
  }, [open, user]);

  if (!user) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pr: 1 }}>
        <Typography>User Profile</Typography>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {isLoading ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <Skeleton variant="circular" width={150} height={150} sx={{ mb: 2 }} />
              <Skeleton variant="text" width="50%" height={40} />
              <Skeleton variant="text" width="70%" height={30} sx={{ mt: 1 }} />
            </Box>
            <Skeleton variant="rectangular" height={100} />
            <Skeleton variant="rectangular" height={200} />
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Header Section */}
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
              <Box sx={{ position: "relative", display: "inline-block", mb: 2 }}>
                <Avatar
                  src={user.image}
                  alt={user.name}
                  sx={{
                    width: 150,
                    height: 150,
                    border: "4px solid",
                    borderColor: "primary.main",
                  }}
                />
                {user.npc && (
                  <Box
                    sx={{
                      position: "absolute",
                      bottom: 0,
                      right: 0,
                      bgcolor: "secondary.main",
                      borderRadius: "50%",
                      p: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "2px solid white",
                    }}
                  >
                    <SmartToy sx={{ fontSize: 28, color: "white" }} />
                  </Box>
                )}
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography variant="h4" sx={{ fontWeight: 600 }}>
                  {user.name}
                </Typography>
                {user.npc && <SmartToy sx={{ fontSize: 24, color: "secondary.main" }} />}
              </Box>

              {user.bio && (
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2, maxWidth: "90%" }}>
                  {user.bio}
                </Typography>
              )}
            </Box>

            {/* Stats Grid */}
            {userStats &&
              (() => {
                // Calculate overall position with tie handling
                const allStats = userStats._allStats || [];
                const allPoints = allStats.map((u) => u.totalPoints).sort((a, b) => b - a);
                // const uniquePoints = Array.from(new Set(allPoints)).sort((a, b) => b - a);
                const overallPositionIndex = allPoints.indexOf(userStats.totalPoints);
                const overallPosition = overallPositionIndex + 1;
                const tiedUsers = allStats.filter((u) => u.totalPoints === userStats.totalPoints).length;
                const positionDisplay = tiedUsers > 1 ? `T#${overallPosition}` : `#${overallPosition}`;

                // Calculate first place finishes
                let firstPlaceCount = 0;
                for (let week = 1; week < weekData.week; week++) {
                  const weekKey = `week${week}`;
                  const userWeekPoints = userStats[weekKey] || 0;
                  const uniqueWeekPoints = Array.from(new Set(allStats.map((u) => u[weekKey] || 0))).sort(
                    (a, b) => b - a
                  );
                  const weekPositionIndex = uniqueWeekPoints.indexOf(userWeekPoints);
                  if (weekPositionIndex === 0) {
                    firstPlaceCount++;
                  }
                }

                return (
                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 2 }}>
                    <Paper sx={{ p: 2, textAlign: "center", bgcolor: "primary.light", color: "primary.contrastText" }}>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        Total Points This Year
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        {userStats.totalPoints}
                      </Typography>
                    </Paper>
                    <Paper
                      sx={{ p: 2, textAlign: "center", bgcolor: "secondary.light", color: "secondary.contrastText" }}
                    >
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        Overall Position
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 600 }}>
                        {positionDisplay}
                      </Typography>
                    </Paper>
                    <Paper sx={{ p: 2, textAlign: "center", bgcolor: "#FFD700", color: "#333" }}>
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1, mb: 1 }}>
                        <EmojiEvents sx={{ fontSize: 24 }} />
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          Weekly Wins
                        </Typography>
                      </Box>
                      <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        {firstPlaceCount}
                      </Typography>
                    </Paper>
                  </Box>
                );
              })()}

            {/* Weekly Points Table */}
            {userStats && weekData && (
              <Box>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Weekly Points
                </Typography>
                <TableContainer component={Paper}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: "primary.main" }}>
                      <TableRow>
                        <TableCell sx={{ color: "white", fontWeight: 600 }}>Week</TableCell>
                        <TableCell align="center" sx={{ color: "white", fontWeight: 600 }}>
                          Points Earned
                        </TableCell>
                        <TableCell align="center" sx={{ color: "white", fontWeight: 600 }}>
                          Place
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Array.from({ length: weekData.week - 1 }, (_, i) => i + 1).map((week) => {
                        // Calculate the user's position for this week with tie handling
                        const allStats = [...(userStats._allStats || [])];
                        const weekKey = `week${week}`;
                        const userPoints = userStats[weekKey] || 0;

                        // Get all unique point values for this week, sorted descending
                        const sortedPoints = allStats.map((u) => u[weekKey] || 0).sort((a, b) => b - a);

                        // Find the user's position based on unique point values
                        const userPositionIndex = sortedPoints.indexOf(userPoints);
                        const userPosition = userPositionIndex + 1;

                        // Count how many users are tied at this position
                        const tiedUsers = allStats.filter((u) => (u[weekKey] || 0) === userPoints).length;
                        const positionDisplay = tiedUsers > 1 ? `T#${userPosition}` : `#${userPosition}`;

                        return (
                          <TableRow key={week} sx={{ "&:hover": { bgcolor: "action.hover" } }}>
                            <TableCell sx={{ fontWeight: 500 }}>Week {week}</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 600 }}>
                              {userPoints}
                            </TableCell>
                            <TableCell align="center" sx={{ fontWeight: 600 }}>
                              {positionDisplay}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {user.email && (
              <Box sx={{ pt: 2, borderTop: "1px solid", borderColor: "divider" }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Email:</strong> {user.email}
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}
