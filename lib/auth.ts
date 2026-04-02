import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("LOGIN_DEBUG: Attempt for", credentials?.email);
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        if (!parsedCredentials.success) {
          console.log("LOGIN_DEBUG: Zod validation failed", parsedCredentials.error.errors);
          return null;
        }

        const { email, password } = parsedCredentials.data;
        const user = await prisma.user.findUnique({ where: { email } });
        
        if (!user) {
          console.log("LOGIN_DEBUG: User NOT found in DB search for:", email);
          return null;
        }

        console.log("LOGIN_DEBUG: User found! Hashing comparison starting...");
        const passwordsMatch = await bcrypt.compare(password, user.password);
        console.log("LOGIN_DEBUG: Passwords match result:", passwordsMatch);

        if (passwordsMatch) return user;
        return null;
      },



    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.role) {
        session.user.role = token.role as string;
      }
      if (token?.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
