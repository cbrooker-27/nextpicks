import { connectToDatabase } from "@/app/utils/db";
import { saltAndHashPassword } from "@/app/utils/password";
import { NextResponse } from "next/server";

export async function POST(request) {
  const requestData = await request.json();
  //console.log("request body:"+requestData.name)

  const userName = requestData.name;
  const userPwd = await saltAndHashPassword(requestData.password);
  const client = await connectToDatabase();
  const db = client.db("picks");
  const insertResult = await db.collection("users").insertOne({ name: userName, password: userPwd });
  client.close();
  return NextResponse.json({ message: "User Added" }, { status: 201 });
}
