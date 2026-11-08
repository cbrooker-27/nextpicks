import { connectToDatabase } from "@/app/utils/db";
import { saltAndHashPassword } from "@/app/utils/password";
import { NextResponse } from "next/server";
import { logInfo } from "@/app/lib/logger";

export async function POST(request) {
  const requestData = await request.json();

  const userName = requestData.name;
  const userPwd = await saltAndHashPassword(requestData.password);
  const client = await connectToDatabase();
  const db = client.db("picks");
  await db.collection("users").insertOne({ name: userName, password: userPwd });
  await client.close();
  logInfo("auth.account.created", { provider: "credentials" });
  return NextResponse.json({ message: "User Added" }, { status: 201 });
}
