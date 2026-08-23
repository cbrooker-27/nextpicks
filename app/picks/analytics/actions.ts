// app/analytics/actions.ts
'use server';

import {auth} from '@/auth.js';
import {
  getAllPickedGames,
  getAllUserChoices,
  getCurrentWeek,
} from '@/app/utils/db';
import { TeamStat, OutcomeStat, SpreadStat } from '@/app/lib/analytics/types';
import { bucketLabel, DEFAULT_BUCKETS } from '@/app/lib/analytics/bucketConfig';

/** Ensure a valid session, otherwise throw for the caller to handle */
async function requireSession() {
  const session = await auth();
  if (!session) throw new Error('Unauthenticated');
  return session;
}

/** Helper: compute points for a single user choice against a game */
function pointsForChoice(game: any, choice: string): number {
  const favScore = game.awayFavorite ? game.awayScore : game.homeScore;
  const undScore = game.awayFavorite ? game.homeScore : game.awayScore;
  if (favScore - game.spread > undScore) return { ff: 2, uf: 1, uu: 0 }[choice];
  if (favScore - game.spread < undScore && favScore > undScore) return { ff: 1, uf: 2, uu: 1 }[choice];
  if (favScore - game.spread < undScore && favScore === undScore) return { ff: 0, uf: 1, uu: 1 }[choice];
  return { ff: 0, uf: 1, uu: 2 }[choice];
}

/** 1️⃣ Team‑wise statistics */
export async function getTeamStats(): Promise<TeamStat[]> {
  await requireSession();
  const week = await getCurrentWeek();
  const gamesJson = await getAllPickedGames(week.season);
  const games = JSON.parse(gamesJson);
  const userChoices = await getAllUserChoices();

  const stats = new Map<string, { points: number; picks: number }>();

  for (const game of games) {
    const choice = userChoices.find((c) => c.gameId === game._id);
    if (!choice) continue;
    const pts = pointsForChoice(game, choice.choice);
    const teams = [game.homeTeam, game.awayTeam];
    for (const t of teams) {
      const rec = stats.get(t) ?? { points: 0, picks: 0 };
      rec.points += pts;
      rec.picks += 1;
      stats.set(t, rec);
    }
  }

  return Array.from(stats.entries()).map(([team, { points, picks }]) => ({
    team,
    points,
    picks,
  }));
}

/** 2️⃣ Outcome‑wise statistics */
export async function getOutcomeStats(): Promise<OutcomeStat[]> {
  await requireSession();
  const week = await getCurrentWeek();
  const gamesJson = await getAllPickedGames(week.season);
  const games = JSON.parse(gamesJson);
  const userChoices = await getAllUserChoices();

  const agg: Record<'ff' | 'uf' | 'uu', { points: number; picks: number }> = {
    ff: { points: 0, picks: 0 },
    uf: { points: 0, picks: 0 },
    uu: { points: 0, picks: 0 },
  };

  for (const game of games) {
    const choice = userChoices.find((c) => c.gameId === game._id);
    if (!choice) continue;
    const outcome = choice.choice as 'ff' | 'uf' | 'uu';
    const pts = pointsForChoice(game, outcome);
    agg[outcome].points += pts;
    agg[outcome].picks += 1;
  }

  return (Object.entries(agg) as [keyof typeof agg, typeof agg[keyof typeof agg]][]).map(
    ([outcome, { points, picks }]) => ({
      outcome,
      points,
      picks,
    })
  );
}

/** 3️⃣ Spread statistics – mode can be 'summarized' (bucketed) or 'individual' (raw spread) */
export async function getSpreadStats(
  mode: 'summarized' | 'individual' = 'summarized'
): Promise<SpreadStat[]> {
  await requireSession();
  const week = await getCurrentWeek();
  const gamesJson = await getAllPickedGames(week.season);
  const games = JSON.parse(gamesJson);
  const userChoices = await getAllUserChoices();

  const bucketMap = new Map<string, { points: number; picks: number }>();

  for (const game of games) {
    const choice = userChoices.find((c) => c.gameId === game._id);
    if (!choice) continue;
    const pts = pointsForChoice(game, choice.choice);
    const spreadVal = Number(game.spread);
    const key = mode === 'summarized' ? bucketLabel(spreadVal) : String(spreadVal);
    const rec = bucketMap.get(key) ?? { points: 0, picks: 0 };
    rec.points += pts;
    rec.picks += 1;
    bucketMap.set(key, rec);
  }

  // Sort keys – natural order for summarized buckets, numeric for individual
  const sorted = Array.from(bucketMap.entries()).sort(([a], [b]) => {
    if (mode === 'individual') return Number(a) - Number(b);
    const order = DEFAULT_BUCKETS.map((b) => b.label);
    return order.indexOf(a) - order.indexOf(b);
  });

  return sorted.map(([bucket, { points, picks }]) => ({
    bucket,
    points,
    picks,
  }));
}
