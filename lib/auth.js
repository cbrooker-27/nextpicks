"use server";
import { signIn, signOut } from "@/auth";

export async function googleSignIn() {
  return await signIn("google", undefined, { prompt: "select_account" });
}
export async function credsSignIn(formData) {
  return await signIn("credentials", formData);
}
export async function siteSignOut() {
  return await signOut();
}
