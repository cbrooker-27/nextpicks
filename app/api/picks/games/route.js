import { NextResponse } from "next/server";
import { getThisWeeksGames } from "@/lib/msf";


export async function GET(request) {
  //get week number from request?
  //console.log(request)
  //const requestData = await request.json();
  //console.log(requestData)
  const simpleGames = await getThisWeeksGames();
  //console.log(simpleGames)
  
  return NextResponse.json(simpleGames, { status: 200 });
}

/*
export async function POST(request) {
  const games = await request.json();
  addGames(games);
  return NextResponse.json({message: "Games added successfully"}, { status: 201 });
}*/