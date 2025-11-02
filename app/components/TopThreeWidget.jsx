"use client";

import React, { useMemo } from "react";
import { Card, CardContent, Typography, Avatar, Box } from "@mui/material";

/**
 * TopThreeWidget
 * Props:
 * - userStats: array of user stat objects (contains name, image, and fields like weekN)
 * - week: current week object { week: number, season: number }
 *
 * Displays the top 3 users from the previous week with medal decorations.
 */
export default function TopThreeWidget({ userStats = [], week }) {
  const lastWeekNum = week?.week ? week.week - 1 : null;

  // compute competition-style ranks (ties get same rank, next rank skips accordingly)
  const topRanks = useMemo(() => {
    if (!lastWeekNum) return [];
    const arr = (userStats || []).map((u) => ({
      name: u.name,
      image: u.image || null,
      points: Number(u["week" + lastWeekNum] || 0),
    }));

    arr.sort((a, b) => b.points - a.points);

    // assign competition ranks
    let prevPoints = null;
    let prevRank = 0;
    const ranked = arr.map((u, idx) => {
      if (u.points === prevPoints) {
        // same rank as previous
        return { ...u, rank: prevRank };
      }
      const rank = idx + 1;
      prevPoints = u.points;
      prevRank = rank;
      return { ...u, rank };
    });

    // keep everyone with rank <= 3 (this handles ties)
    return ranked.filter((u) => u.rank <= 3);
  }, [userStats, lastWeekNum]);

  const medalStyle = (pos) => {
    switch (pos) {
      case 0:
        return { border: "3px solid #D4AF37" }; // gold
      case 1:
        return { border: "3px solid #C0C0C0" }; // silver
      case 2:
        return { border: "3px solid #CD7F32" }; // bronze
      default:
        return {};
    }
  };

  const medalEmoji = (rank) => (rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉");

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Top 3 — Week {lastWeekNum ?? "-"}
        </Typography>

        {topRanks.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No data for last week yet.
          </Typography>
        ) : (
          <Box sx={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 2 }}>
            {/* render columns for rank 2, 1, 3 so first place is centered */}
            {[2, 1, 3].map((rankSlot) => {
              const usersForRank = topRanks.filter((u) => u.rank === rankSlot);
              return (
                <Box key={rankSlot} sx={{ width: 160, textAlign: "center" }}>
                  {usersForRank.length === 0 ? (
                    <Box sx={{ height: rankSlot === 1 ? 140 : 110 }} />
                  ) : (
                    usersForRank.map((u) => {
                      const isFirst = u.rank === 1;
                      const avatarSize = isFirst ? 110 : 78;
                      return (
                        <Box key={u.name} sx={{ mb: 1 }}>
                          <Box sx={{ position: "relative", display: "inline-block" }}>
                            <Avatar
                              alt={u.name}
                              src={u.image}
                              sx={{
                                width: avatarSize,
                                height: avatarSize,
                                margin: "0 auto",
                                ...medalStyle(u.rank - 1),
                              }}
                            />
                            <Box
                              sx={{
                                position: "absolute",
                                right: -8,
                                top: -8,
                                width: isFirst ? 44 : 36,
                                height: isFirst ? 44 : 36,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                bgcolor: "transparent",
                                fontSize: isFirst ? 28 : 22,
                              }}
                              aria-hidden
                            >
                              {medalEmoji(u.rank)}
                            </Box>
                          </Box>
                          <Typography variant="subtitle1" sx={{ mt: 1 }}>
                            {u.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {u.points} pt{u.points === 1 ? "" : "s"}
                          </Typography>
                        </Box>
                      );
                    })
                  )}
                </Box>
              );
            })}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
