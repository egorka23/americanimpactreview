import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import Apple from "next-auth/providers/apple";
import { compare, hash } from "bcryptjs";
import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const googleClientId =
  process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID;
const googleClientSecret =
  process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET;

const appleClientId =
  process.env.AUTH_APPLE_ID || process.env.APPLE_CLIENT_ID;
const appleClientSecret =
  process.env.AUTH_APPLE_SECRET || process.env.APPLE_CLIENT_SECRET;

const oauthProviders = [
  ...(googleClientId && googleClientSecret
    ? [Google({ clientId: googleClientId, clientSecret: googleClientSecret })]
    : []),
  ...(appleClientId && appleClientSecret
    ? [Apple({ clientId: appleClientId, clientSecret: appleClientSecret })]
    : []),
];

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    ...oauthProviders,
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = credentials.email as string;
        const password = credentials.password as string;

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email.toLowerCase()))
          .limit(1);

        if (!user) return null;
        if (user.status === "suspended") return null;

        const isValid = await compare(password, user.password);
        if (!isValid) return null;

        await db
          .update(users)
          .set({ lastLogin: new Date() })
          .where(eq(users.id, user.id));

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (!account || account.provider === "credentials") return true;

      const email = user.email?.toLowerCase();
      if (!email) return false;

      const [existing] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existing) {
        if (existing.status === "suspended") return false;

        const updates: Record<string, unknown> = {
          lastLogin: new Date(),
        };
        if (!existing.name && user.name) {
          updates.name = user.name.trim();
        }
        if (Object.keys(updates).length > 0) {
          await db.update(users).set(updates).where(eq(users.id, existing.id));
        }
        return true;
      }

      const randomPassword = randomBytes(32).toString("hex");
      const hashedPassword = await hash(randomPassword, 12);
      await db.insert(users).values({
        email,
        password: hashedPassword,
        name: user.name?.trim() || email.split("@")[0],
        affiliation: null,
        orcid: null,
        lastLogin: new Date(),
      });

      return true;
    },
    async jwt({ token, user }) {
      if (user?.email) {
        const email = user.email.toLowerCase();
        const [dbUser] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (dbUser) {
          token.id = dbUser.id;
          token.name = dbUser.name;
          token.email = dbUser.email;
          token.affiliation = dbUser.affiliation ?? null;
          token.orcid = dbUser.orcid ?? null;
        }
      }
      if (user && !token.id) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        session.user.name = (token.name as string) ?? session.user.name;
        session.user.email = (token.email as string) ?? session.user.email;
        session.user.affiliation = (token.affiliation as string | null) ?? null;
        session.user.orcid = (token.orcid as string | null) ?? null;
      }
      return session;
    },
  },
});
