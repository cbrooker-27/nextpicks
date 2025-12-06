"use client";

import { useState } from "react";
import { Card, CardContent, Typography, Avatar, Box, Switch, FormControlLabel } from "@mui/material";

export default function LeaderBoard({ userStats = [] }) {
  const [includeNpc, setIncludeNpc] = useState(true);

  // compute competition-style top ranks by totalPoints
  const getTop3 = () => {
    let arr = (userStats || []).map((u) => ({
      name: u.name,
      image: u.image || null,
      points: Number(u.totalPoints || 0),
      npc: !!u.npc,
    }));

    if (!includeNpc) {
      arr = arr.filter((u) => !u.npc);
    }

    arr.sort((a, b) => b.points - a.points);

    let prevPoints = null;
    let prevRank = 0;
    const ranked = arr.map((u, idx) => {
      if (u.points === prevPoints) {
        return { ...u, rank: prevRank };
      }
      const rank = idx + 1;
      prevPoints = u.points;
      prevRank = rank;
      return { ...u, rank };
    });

    return ranked.filter((u) => u.rank <= 3);
  };
  const topRanks = getTop3();

  const medalStyle = (pos) => {
    switch (pos) {
      case 0:
        return { border: "3px solid #eec951ff" }; // gold
      case 1:
        return { border: "3px solid #a3a3a3ff" }; // silver
      case 2:
        return { border: "3px solid #8d5822ff" }; // bronze
      default:
        return {};
    }
  };

  const medalEmoji = (rank) => (rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉");

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="h6" sx={{ mb: 0 }}>
            Season Leaders
          </Typography>
          <FormControlLabel
            control={<Switch checked={includeNpc} onChange={(e) => setIncludeNpc(e.target.checked)} size="small" />}
            label="Include NPCs"
            sx={{ mb: 0 }}
          />
        </Box>

        {topRanks.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Leaderboard will populate once points are available...
          </Typography>
        ) : (
          <Box sx={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 2, flexWrap: "wrap" }}>
            {[2, 1, 3].map((rankSlot) => {
              const usersForRank = topRanks.filter((u) => u.rank === rankSlot);
              if (usersForRank.length === 0) {
                return null;
              }
              return (
                <Box
                  key={rankSlot}
                  sx={{
                    textAlign: "center",
                    display: "flex",
                    flexDirection: "row",
                    flexWrap: "wrap",
                    alignItems: "center",
                  }}
                >
                  {usersForRank.map((u) => {
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
                  })}
                </Box>
              );
            })}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
