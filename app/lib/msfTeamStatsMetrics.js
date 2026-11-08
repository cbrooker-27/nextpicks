import { connectToDatabase } from "@/app/utils/db";
import { logError } from "@/app/lib/logger";

const METRICS_ID = "msf_team_stats";
const RECENT_FAILURE_LIMIT = 50;

export async function recordPendingMsfRequest({ requestId, requestType, season, week, timeoutMs }) {
  const startedAt = new Date();
  const update = {
    $set: {
      lastRequestAt: startedAt,
      lastStatus: "pending",
    },
    $push: {
      recentRequests: {
        $each: [
          {
            requestId,
            at: startedAt,
            requestType,
            season,
            week,
            timeoutMs,
            status: "pending",
          },
        ],
        $slice: -RECENT_FAILURE_LIMIT,
      },
    },
  };

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
    logError("msf.pending_request_persist_failed", persistenceError);
  }
}

export async function recordMsfRequest({
  requestId,
  requestType,
  status,
  season,
  week,
  durationMs,
  httpStatus,
  resultCount,
  responseBody,
  responseBodyReadError,
  error,
}) {
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
  const options = { upsert: true };

  if (requestId) {
    const requestUpdate = {
      status,
      durationMs,
      completedAt,
    };
    if (httpStatus !== undefined) requestUpdate.httpStatus = httpStatus;
    if (resultCount !== undefined) requestUpdate.resultCount = resultCount;
    if (responseBody !== undefined) requestUpdate.responseBody = responseBody;
    if (responseBodyReadError !== undefined) requestUpdate.responseBodyReadError = responseBodyReadError;
    if (error?.name) requestUpdate.errorName = error.name;
    if (error?.message) requestUpdate.message = error.message;
    for (const [field, value] of Object.entries(requestUpdate)) {
      update.$set[`recentRequests.$[request].${field}`] = value;
    }
    options.arrayFilters = [{ "request.requestId": requestId }];
  }

  if (status === "success") {
    update.$set.lastSuccessAt = completedAt;
  } else {
    update.$set.lastFailureAt = completedAt;
    update.$push = {
      recentFailures: {
        $each: [
          {
            at: completedAt,
            ...(requestId ? { requestId } : {}),
            requestType,
            season,
            ...(week === undefined ? {} : { week }),
            status,
            durationMs,
            ...(httpStatus === undefined ? {} : { httpStatus }),
            ...(responseBody === undefined ? {} : { responseBody }),
            ...(responseBodyReadError === undefined ? {} : { responseBodyReadError }),
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
        .updateOne({ _id: METRICS_ID }, update, options);
    } finally {
      await client.close();
    }
  } catch (persistenceError) {
    logError("msf.request_metrics_persist_failed", persistenceError);
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
