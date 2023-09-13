import { NextResponse } from "next/server";
import { addGames } from "@/lib/db";
import { getThisWeeksGames } from "@/lib/msf";

export async function GET(request) {
  const simpleGames = await getThisWeeksGames();
  return NextResponse.json(simpleGames, { status: 200 });
}

export async function POST(request) {
  const games = await request.json();
  addGames(games);
  return NextResponse.json(
    { message: "Games added successfully" },
    { status: 201 }
  );
}
