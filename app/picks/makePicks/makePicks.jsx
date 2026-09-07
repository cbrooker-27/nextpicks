"use client";
import { getPickableGames, getCurrentWeek, getThisWeeksPickedGames, getAllGames } from "@/app/utils/db";

import MakePicksForm from "./makePicksForm";
import { useSession, signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import { getTeamStatisticsFromMsf } from "@/app/lib/msf.js";
import { SeasonStatisticsProvider } from "@/app/context/SeasonStatistics";

export default function MakePicks() {
  const { data: session, status } = useSession();
  // const [week, setWeek] = useState(null);
  const [games, setGames] = useState([]);
  const [teamDetails, setTeamDetails] = useState(null);
  const [seasonData, setSeasonData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Redirect to sign in if not authenticated
  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user) {
      signIn(null, { redirectTo: "/picks/makePicks" });
      return;
    }
    async function loadData() {
      const w = await getCurrentWeek();
      const thisWeeksPicksString = await getThisWeeksPickedGames();
      if (thisWeeksPicksString) {
        const thisWeeksPicks = JSON.parse(thisWeeksPicksString);
        thisWeeksPicks.forEach((game) => {
          game.userChoice = game.userChoices?.find((choice) => choice.userId === session.user.name)?.choice;
        });
        setGames(thisWeeksPicks);
      }
      const td = await getTeamStatisticsFromMsf(w);
      const sd = await getAllGames(w.season);
      // setWeek(w);
      setTeamDetails(td);
      setSeasonData(sd);
      setLoading(false);
    }
    loadData();
  }, [session, status]);

  if (status === "loading" || loading) {
    return <p>Loading...</p>;
  }

  return games.length > 0 ? (
    <SeasonStatisticsProvider value={{ seasonData }}>
      <MakePicksForm games={games} teamDetails={teamDetails} />
    </SeasonStatisticsProvider>
  ) : (
    <div>No games found</div>
  );
}
