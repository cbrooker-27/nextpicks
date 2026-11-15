"use server";

import type { Filter } from "mongodb";
import { auth } from "../../auth";
import { isAdminEmail } from "../lib/admin";
import { ensurePickEditHistoryIndexes } from "../lib/pickEditHistory";
import type { PickEditHistoryEvent } from "../../types";
import { connectToDatabase } from "../utils/db";

const PAGE_SIZE = 25;

export interface PickEditHistoryFilters {
  season?: number;
  week?: number;
  userId?: string;
  page?: number;
}

function validateFilters(filters: unknown): asserts filters is PickEditHistoryFilters {
  if (!filters || typeof filters !== "object" || Array.isArray(filters)) {
    throw new Error("Pick-edit history filters are invalid.");
  }
  const parsedFilters = filters as PickEditHistoryFilters;
  if (
    parsedFilters.season !== undefined &&
    (!Number.isInteger(parsedFilters.season) || parsedFilters.season < 1900 || parsedFilters.season > 2200)
  ) {
    throw new Error("Season must be a valid year.");
  }
  if (
    parsedFilters.week !== undefined &&
    (!Number.isInteger(parsedFilters.week) || parsedFilters.week < 1 || parsedFilters.week > 30)
  ) {
    throw new Error("Week must be between 1 and 30.");
  }
  if (
    parsedFilters.userId !== undefined &&
    (typeof parsedFilters.userId !== "string" || parsedFilters.userId.length > 100)
  ) {
    throw new Error("Player filter is invalid.");
  }
  if (
    parsedFilters.page !== undefined &&
    (!Number.isSafeInteger(parsedFilters.page) ||
      parsedFilters.page < 1 ||
      parsedFilters.page > Math.floor(Number.MAX_SAFE_INTEGER / PAGE_SIZE))
  ) {
    throw new Error("Page must be a positive integer.");
  }
}

export async function getPickEditHistory(filters: PickEditHistoryFilters = {}) {
  const session = await auth();
  if (!isAdminEmail(session?.user?.email)) {
    throw new Error("You are not authorized to view pick-edit history.");
  }
  validateFilters(filters);

  const filter: Filter<PickEditHistoryEvent> = {};
  if (filters.season !== undefined) filter.season = filters.season;
  if (filters.week !== undefined) filter.week = filters.week;
  const userId = filters.userId?.trim();
  if (userId) filter.userId = userId;

  const page = filters.page || 1;
  const client = await connectToDatabase();
  try {
    const collection = client.db(process.env.MONGODB_DB || "picks").collection<PickEditHistoryEvent>("pickEditHistory");
    await ensurePickEditHistoryIndexes(collection);

    const [totalEvents, distinctPickResults, playerOptions, events] = await Promise.all([
      collection.countDocuments(filter),
      collection
        .aggregate<{ count: number }>([
          { $match: filter },
          { $group: { _id: { userId: "$userId", gameId: "$gameId" } } },
          { $count: "count" },
        ])
        .toArray(),
      collection.distinct("userId"),
      collection
        .find(filter)
        .sort({ changedAt: -1, _id: -1 })
        .skip((page - 1) * PAGE_SIZE)
        .limit(PAGE_SIZE)
        .toArray(),
    ]);

    return {
      events: events.map((event) => ({
        id: String(event._id),
        userId: event.userId,
        gameId: String(event.gameId),
        season: event.season,
        week: event.week,
        previousChoice: event.previousChoice,
        newChoice: event.newChoice,
        changedAt: new Date(event.changedAt).toISOString(),
      })),
      totalEvents,
      distinctPicks: distinctPickResults[0]?.count || 0,
      players: playerOptions.filter((player): player is string => typeof player === "string").sort(),
      page,
      pageSize: PAGE_SIZE,
    };
  } finally {
    await client.close();
  }
}
