export function getMsfWeek(request) {
  const { searchParams } = new URL(request.url);
  const rawSeason = searchParams.get("season");
  const rawWeek = searchParams.get("week");
  const season = Number(rawSeason);
  const week = Number(rawWeek);

  if (
    rawSeason === null ||
    rawWeek === null ||
    !Number.isInteger(season) ||
    season < 1 ||
    !Number.isInteger(week) ||
    week < 1 ||
    week > 22
  ) {
    return null;
  }

  return { season, week };
}
