"use server";

import { ObjectId } from "mongodb";
import { auth } from "../../auth";
import { connectToDatabase } from "../utils/db";

function isAdmin(email: string | null | undefined) {
  // Keep administrator identity server-side; the client must never be trusted for this decision.
  const administrators = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  return Boolean(email && administrators.includes(email.toLowerCase()));
}

export async function updateActiveSeason({ season, selectedUserIds }: { season: number; selectedUserIds: string[] }) {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) {
    throw new Error("You are not authorized to manage active seasons.");
  }

  if (!Number.isInteger(season) || season < 1900 || season > 2200) {
    throw new Error("Season must be a valid year.");
  }

  if (!Array.isArray(selectedUserIds)) {
    throw new Error("Selected users must be an array.");
  }

  const userIds = selectedUserIds.map((id) => {
    if (!ObjectId.isValid(id)) {
      throw new Error("One or more selected users are invalid.");
    }
    return new ObjectId(id);
  });

  const client = await connectToDatabase();
  const database = client.db(process.env.MONGODB_DB || "picks");
  const users = database.collection("users");

  try {
    const result = await client.withSession(async (session) => {
      let modifiedCount = 0;

      // Add the season to checked users and remove it from every unchecked user atomically.
      await session.withTransaction(async () => {
        const selected = await users.updateMany(
          { _id: { $in: userIds } },
          [{ $set: { activeSeasons: { $setUnion: [{ $ifNull: ["$activeSeasons", []] }, [season]] } } }],
          { session },
        );

        const unselected = await users.updateMany(
          { _id: { $nin: userIds } },
          [
            {
              $set: {
                activeSeasons: {
                  $filter: {
                    input: { $ifNull: ["$activeSeasons", []] },
                    as: "activeSeason",
                    cond: { $ne: ["$$activeSeason", season] },
                  },
                },
              },
            },
          ],
          { session },
        );

        modifiedCount = selected.modifiedCount + unselected.modifiedCount;
      });

      return modifiedCount;
    });

    return { modifiedCount: result };
  } finally {
    await client.close();
  }
}