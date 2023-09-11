import { connectToDatabase } from "@/lib/db";
import NextAuth from "next-auth";
import { verifyPassword } from "@/lib/auth";

import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions = {
  session: {jwt:true},
  providers: [
    CredentialsProvider({
      async authorize(credentials) {
        const client = await connectToDatabase();
        const usersCollection=client.db().collection("users");
        const user = await usersCollection.findOne({ name: credentials.name });
        if (!user) {
          console.log('bad user')
          client.close();
          throw new Error("Invalid User Specified");
        }

        const isValid = await verifyPassword(
          credentials.password,
          user.password
        );

        if (!isValid) {
          console.log('bad password')
          client.close();
          throw new Error("Could not log you in!");
        }
        client.close();
        return {
          name: user.name
        };

        
      }
    })
  ]
};

export default NextAuth(authOptions);