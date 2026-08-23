export interface TeamStat {
  team: string;
  points: number;
  picks: number;
}

export interface OutcomeStat {
  outcome: 'ff' | 'uf' | 'uu';
  points: number;
  picks: number;
}

export interface SpreadStat {
  // bucket label (e.g., "0‑1", "1‑4", "4‑8", "8+" or raw spread value as string)
  bucket: string;
  points: number;
  picks: number;
}
