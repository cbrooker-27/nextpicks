"use client";

import { DataGrid } from "@mui/x-data-grid";
import { Box } from "@mui/material";

export default function SpreadGrid({ stats = [] }) {
  const rows = stats.map((r, idx) => ({
    id: idx,
    spread: String(r.spread),
    total: r.total || 0,
    ff: r.ff || 0,
    uf: r.uf || 0,
    uu: r.uu || 0,
    favPct: r.total ? (r.favBetter / r.total) * 100 : null,
    favHomeTotal: r.favHome?.total || 0,
    favHomeFF: r.favHome?.ff || 0,
    favHomeUF: r.favHome?.uf || 0,
    favHomeUU: r.favHome?.uu || 0,
    favAwayTotal: r.favAway?.total || 0,
    favAwayFF: r.favAway?.ff || 0,
    favAwayUF: r.favAway?.uf || 0,
    favAwayUU: r.favAway?.uu || 0,
  }));

  const columns = [
    { field: "spread", headerName: "Spread", width: 110 },
    { field: "favHomeTotal", headerName: "Fav Home Total", type: "number", width: 100 },
    { field: "favHomeFF", headerName: "Fav Home FF", type: "number", width: 130 },
    { field: "favHomeUF", headerName: "Fav Home UF", type: "number", width: 130 },
    { field: "favHomeUU", headerName: "Fav Home UU", type: "number", width: 130 },
    { field: "favAwayTotal", headerName: "Fav Away Total", type: "number", width: 100 },
    { field: "favAwayFF", headerName: "Fav Away FF", type: "number", width: 130 },
    { field: "favAwayUF", headerName: "Fav Away UF", type: "number", width: 130 },
    { field: "favAwayUU", headerName: "Fav Away UU", type: "number", width: 130 },
  ];

  return (
    <Box sx={{ height: 600, width: "100%" }}>
      <DataGrid
        rows={rows}
        columns={columns}
        pageSizeOptions={[10, 25, 50]}
        initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
        disableRowSelectionOnClick
        density="compact"
      />
    </Box>
  );
}
