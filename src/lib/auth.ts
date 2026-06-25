import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, _request) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await db.user.findUnique({
          where: { email: credentials.email as string },
          select: {
            id: true,
            name: true,
            email: true,
            password: true,
            role: true,
            avatar: true,
            isActive: true,
            defaultBranchId: true,
          },
        });

        if (!user || !user.password || !user.isActive) return null;

        const passwordMatch = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!passwordMatch) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role as string,
          image: user.avatar,
          defaultBranchId: user.defaultBranchId,
        };
      },
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google" && profile?.email) {
        const existing = await db.user.findUnique({ where: { email: profile.email } });
        if (!existing) {
          const created = await db.user.create({
            data: {
              email: profile.email,
              name: (profile.name as string) || profile.email.split("@")[0],
              role: "SISWA",
              avatar: (profile.image as string) || null,
              isActive: true,
              emailVerified: new Date(),
            },
            select: { id: true, role: true, defaultBranchId: true },
          });
          user.id = created.id;
          user.role = created.role;
          user.defaultBranchId = created.defaultBranchId;
        } else {
          user.id = existing.id;
          user.role = existing.role;
          user.defaultBranchId = existing.defaultBranchId;
          if (!existing.name || !existing.avatar) {
            await db.user.update({
              where: { id: existing.id },
              data: {
                name: existing.name || ((profile.name as string) || profile.email.split("@")[0]),
                avatar: existing.avatar || ((profile.image as string) || null),
                emailVerified: existing.emailVerified || new Date(),
              },
            });
          }
        }
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
        token.defaultBranchId = user.defaultBranchId;
      }
      if (trigger === "update" && session?.defaultBranchId) {
        token.defaultBranchId = session.defaultBranchId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.defaultBranchId = token.defaultBranchId as string | null;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: { strategy: "jwt" },
  trustHost: true,
});
