import { AuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import { User } from "@/utils/db";
import { connectDB } from "@/utils/db";

// Extend the Session type to include our custom properties
declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

export const authOptions: AuthOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID || "",
      clientSecret: process.env.GITHUB_SECRET || "",
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
      }
      return session;
    },
    async signIn({ user }) {
      if (user) {
        await connectDB();
        const existingUser = await User.findOne({ email: user.email });
        if (!existingUser) {
          await User.create({
            email: user.email,
            name: user.name,
            imageUrl: user.image,
            socials: [],
            location: "",
            bio: "",
            followers: [],
            following: [],
            Achievements: [],
            Organizations: [],
          });
        } else {
          // Migration: Convert old number format to array format
          if (typeof existingUser.followers === "number") {
            existingUser.followers = [];
            existingUser.following = [];
            await existingUser.save();
          }
        }
      }
      return true;
    },
  },
  pages: {
    signIn: "/auth",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
