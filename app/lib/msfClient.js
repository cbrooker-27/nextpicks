const MSF_PAGE_TIMEOUT_MS = 9000;

export async function getMsfFeed(feed, week) {
  if (feed !== "games" && feed !== "team-stats") {
    throw new Error(`Unsupported MSF feed: ${feed}`);
  }

  const controller = new AbortController();
  let timeout;
  const query = new URLSearchParams({
    season: String(week.season),
    week: String(week.week),
  });

  try {
    const request = (async () => {
      const response = await fetch(`/api/msf/${feed}?${query}`, {
        cache: "no-store",
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error(`MSF ${feed} request failed with status ${response.status}`);
      }
      return response.json();
    })();
    const timeoutRequest = new Promise((_, reject) => {
      timeout = setTimeout(() => {
        controller.abort();
        reject(new Error(`MSF ${feed} request timed out after ${MSF_PAGE_TIMEOUT_MS}ms`));
      }, MSF_PAGE_TIMEOUT_MS);
    });

    return await Promise.race([request, timeoutRequest]);
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error(`MSF ${feed} request timed out after ${MSF_PAGE_TIMEOUT_MS}ms`, { cause: error });
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
