"use server";
import { signIn, signOut } from "@/auth";

export async function googleSignIn() {
  return await signIn(
    "google",
    { redirect: true, redirectTo: "/" },
    { prompt: "select_account" }
  );
}
export async function credsSignIn(formData) {
  return await signIn(
    "credentials",
    { redirect: true, redirectTo: "/" },
    formData
  );
}
export async function siteSignOut() {
  await signOut({ redirectTo: "/login", redirect: true });
}
