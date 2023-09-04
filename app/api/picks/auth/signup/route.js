import { MongoClient } from "mongodb";
import { NextResponse } from "next/server";
import { hash, compare } from 'bcryptjs';

export async function hashPassword(password) {
  const hashedPassword = await hash(password, 12);
  return hashedPassword;
}
export async function POST(request) {
  const requestData = await request.json();
  //console.log("request body:"+requestData.name)
  
  const userName = requestData.name;
  const userPwd = await hashPassword(requestData.password);
  const client = await MongoClient.connect(
    `mongodb+srv://cbrooker27:${process.env.MONGODB_PWD}@nextpicksdb.vakyhkk.mongodb.net/?retryWrites=true&w=majority`
  );
  const db = client.db("picks");
  const insertResult = await db
    .collection("users")
    .insertOne({ name: userName, password: userPwd });
  client.close();
  return NextResponse.json({ message: "User Added" }, { status: 201 });
}
