"use client";

import { createContext, useContext } from "react";

export const SeasonStatisticsContext = createContext(null);

/**
 * SeasonStatisticsProvider
 * - value: object containing season/team stats (e.g. { teamDetails })
 * - children: React nodes to receive the context
 */
export function SeasonStatisticsProvider({ children, value }) {
  return <SeasonStatisticsContext.Provider value={value}>{children}</SeasonStatisticsContext.Provider>;
}

/**
 * useSeasonStatistics
 * - hook to consume the SeasonStatisticsContext
 */
export function useSeasonStatistics() {
  const ctx = useContext(SeasonStatisticsContext);
  if (!ctx) {
    // Helpful warning when hook is used outside the provider
    console.warn("useSeasonStatistics must be used within a SeasonStatisticsProvider");
  }
  return ctx;
}
