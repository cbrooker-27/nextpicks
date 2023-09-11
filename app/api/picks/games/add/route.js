import { NextResponse } from "next/server";
import { addGames } from "@/lib/db";


export async function POST(request) {
    const games = await request.json();
    addGames(games);
    return NextResponse.json({message: "Games added successfully"}, { status: 201 });
  }