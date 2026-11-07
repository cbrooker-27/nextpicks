import { connectToDatabase } from "@/app/utils/db";

const METRICS_ID = "msf_team_stats";
const RECENT_FAILURE_LIMIT = 50;

export async function recordMsfRequest({ requestType, status, season, week, durationMs, httpStatus, error }) {
  const completedAt = new Date();
  const countField =
    status === "success" ? "successCount" : status === "timeout" ? "timeoutCount" : "errorCount";
  const update = {
    $inc: {
      requestCount: 1,
      totalDurationMs: durationMs,
      [countField]: 1,
    },
    $set: {
      lastRequestAt: completedAt,
      lastStatus: status,
    },
  };

  if (status === "success") {
    update.$set.lastSuccessAt = completedAt;
  } else {
    update.$set.lastFailureAt = completedAt;
    update.$push = {
      recentFailures: {
        $each: [
          {
            at: completedAt,
            requestType,
            season,
            ...(week === undefined ? {} : { week }),
            status,
            durationMs,
            httpStatus,
            errorName: error?.name || "UnknownError",
            message: error?.message || "Unknown MSF request failure",
          },
        ],
        $slice: -RECENT_FAILURE_LIMIT,
      },
    };
  }

  try {
    const client = await connectToDatabase();
    try {
      await client
        .db(process.env.MONGODB_DB || "picks")
        .collection("msfTeamStatsMetrics")
        .updateOne({ _id: METRICS_ID }, update, { upsert: true });
    } finally {
      await client.close();
    }
  } catch (persistenceError) {
    console.error("Unable to persist MSF request metrics:", persistenceError);
  }
}

export async function getTeamStatsMetrics() {
  const client = await connectToDatabase();
  try {
    return await client
      .db(process.env.MONGODB_DB || "picks")
      .collection("msfTeamStatsMetrics")
      .findOne({ _id: METRICS_ID });
  } finally {
    await client.close();
  }
}
