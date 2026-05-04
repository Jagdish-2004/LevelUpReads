import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { MongoClient } from "mongodb";
import connectToDatabase from "@/backend/lib/db";
import { User } from "@/backend/models/User";

const client = new MongoClient(process.env.MONGODB_URI || "mongodb://localhost:27017/levelupreads");
const db = client.db();

export const auth = betterAuth({
  database: mongodbAdapter(db),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }, 
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "reader",
        input: true, 
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          try {
            await connectToDatabase();
            await User.findOneAndUpdate(
              { email: user.email },
              {
                $setOnInsert: {
                  name: user.name,
                  email: user.email,
                  emailVerified: user.emailVerified ?? false,
                  image: user.image ?? "",
                  role: "reader",
                  xp: 0,
                  booksRead: 0,
                },
              },
              { upsert: true, returnDocument: "after" }
            );
          } catch (err) {
            console.error("[Auth Hook] Failed to sync user to Mongoose:", err);
          }
        },
      },
    },
  },
  plugins: [nextCookies()], 
});