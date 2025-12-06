"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, Typography, Avatar, Box, Switch, FormControlLabel, Chip } from "@mui/material";
import { useSession } from "next-auth/react";

export default function LeaderBoard({ userStats = [] }) {
  const [includeNpc, setIncludeNpc] = useState(true);

  const { data: session } = useSession();

  // compute competition-style ranks by totalPoints (pure computation, no reassign outside function)
  const { rankedAll, topRanks } = useMemo(() => {
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

    const ranked = [];
    let prevPoints = null;
    let prevRank = 0;
    for (let i = 0; i < arr.length; i++) {
      const u = arr[i];
      let rank;
      if (u.points === prevPoints) {
        rank = prevRank;
      } else {
        rank = i + 1;
        prevPoints = u.points;
        prevRank = rank;
      }
      ranked.push({ ...u, rank });
    }

    return { rankedAll: ranked, topRanks: ranked.filter((u) => u.rank <= 3) };
  }, [userStats, includeNpc]);

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
        {/* show logged-in user's position if they're not in the top ranks */}
        {session?.user?.name &&
          rankedAll &&
          !topRanks.some((u) => u.name === session.user.name) &&
          (() => {
            const me = rankedAll.find((u) => u.name === session.user.name);
            if (!me) return null;
            const tiedUsers = rankedAll.filter((u) => u.points === me.points).length;
            const posDisplay = tiedUsers > 1 ? `T#${me.rank}` : `#${me.rank}`;
            return (
              <Box sx={{ mt: 2, textAlign: "center" }}>
                <Typography variant="subtitle2">You</Typography>
                <Chip
                  label={`${posDisplay} ${me.points} pts 😢`}
                  avatar={
                    <Avatar
                      alt={me.name}
                      src={me.image}
                      sx={{
                        border: "2px solid transparent",
                        boxSizing: "border-box",
                      }}
                    >
                      {me.name.substring(0, 1)}
                    </Avatar>
                  }
                />
                {/* <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1, mt: 1 }}>
                  <Typography variant="h6">{posDisplay}</Typography>
                  <Typography variant="h6">{me.points} pts</Typography>
                  <Typography variant="h5">{"😢"}</Typography>
                </Box> */}
              </Box>
            );
          })()}
      </CardContent>
    </Card>
  );
}
