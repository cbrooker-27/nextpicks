import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import client from "./lib/db";
import { signInSchema } from "./lib/zod";
// Your own logic for dealing with plaintext password strings; be careful!
import { saltAndHashPassword } from "@/utils/password";
import { getUserFromDb } from "@/utils/db";

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { jwt: true },
  adapter: MongoDBAdapter(client),
  providers: [
    Google({ allowDangerousEmailAccountLinking: true }),
    Credentials({
      credentials: { username: {}, password: {} },
      authorize: async (credentials) => {
        try {
          let user = null;

          const { username, password } = await signInSchema.parseAsync(
            credentials
          );
          // logic to salt and hash password
          const pwHash = saltAndHashPassword(password);

          // logic to verify if the user exists
          user = await getUserFromDb(username, pwHash);

          if (!user) {
            // No user found, so this is their first attempt to login
            // Optionally, this is also the place you could do a user registration
            throw new Error("Invalid credentials.");
          }

          // return user object with their profile data
          return user;
        } catch (error) {
          if (error instanceof ZodError) {
            // Return `null` to indicate that the credentials are invalid
            return null;
          }
        }
      },
    }),
  ],
});
