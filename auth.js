import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import client from "./app/lib/db";
import { signInSchema } from "./app/lib/zod";
// Your own logic for dealing with plaintext password strings; be careful!
import { saltAndHashPassword } from "@/app/utils/password";
import { getUserFromDb, getUserFromDbWithEmail, updateUser } from "@/app/utils/db";
import { logInfo, logWarn } from "@/app/lib/logger";
import { ZodError } from "zod";

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  adapter: MongoDBAdapter(client),
  callbacks: {
    async signIn(props) {
      let user = props.user;
      if (props.account.provider !== "credentials") {
        user = await getUserFromDbWithEmail(props.user.email);
        if (!user) {
          logWarn("auth.login.denied", {
            provider: props.account?.provider || "unknown",
            reason: "user_not_found",
          });
          return false;
        }

        if (!user.image) {
          user.image = props.user.image;
        }
      }

      user.lastSignIn = new Date();
      await updateUser(user);

      logInfo("auth.login.succeeded", {
        provider: props.account?.provider || "unknown",
        userId: user.id || String(user._id),
      });
      return true;
    },
  },
  providers: [
    Google({
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: { prompt: "select_account" },
      },
    }),
    Credentials({
      credentials: { username: {}, password: { type: "password" } },
      authorize: async (credentials) => {
        try {
          let user = null;

          const { username, password } = await signInSchema.parseAsync(credentials);
          // logic to salt and hash password
          const pwHash = await saltAndHashPassword(password);

          // logic to verify if the user exists
          user = await getUserFromDb(username, pwHash);

          if (!user) {
            logWarn("auth.login.denied", { provider: "credentials", reason: "invalid_credentials" });
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
