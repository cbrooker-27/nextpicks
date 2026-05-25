"use client";
import { getSpreadOutcomeCounts } from "../../utils/db.ts";
import SpreadGrid from "./SpreadGrid";
import SpreadChart from "./SpreadChart";
import { useState, useEffect } from "react";

export default function Page() {
  const [stats, setStats] = useState([]);
  const [season, setSeason] = useState(2025);
  const total = stats.reduce((s, c) => s + (c.total || 0), 0);
  useEffect(() => {
    getSpreadOutcomeCounts(season).then((stats) => setStats(stats));
  }, [season]);

  return (
    <div>
      <h1>Analytics</h1>
      {season ? <p>Season: {season}</p> : null}
      <p>Total completed games used in analysis: {total}</p>
      {stats.length === 0 ? (
        <p>No completed loaded yet.</p>
      ) : (
        <div style={{ marginTop: 8 }}>
          <SpreadChart stats={stats} />
          <SpreadGrid stats={stats} />
        </div>
      )}
    </div>
  );
}
