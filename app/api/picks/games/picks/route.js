import { getPickableGames } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request){
const games = await getPickableGames(1);
return NextResponse.json(
  { games: games },
  { status: 200 }
);
}
