import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

/**
 * Auth is deliberately kept behind NextAuth's provider abstraction.
 * Today: a single CredentialsProvider (email + password).
 * Future (per architecture doc, "Future Features"): add an LDAP/Entra ID
 * provider alongside this one without touching the rest of the app —
 * everything downstream only depends on the NextAuth session shape.
 */
export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // TEMPORARY DEBUG LOGGING — remove once login is confirmed working.
        console.log("[authorize] raw credentials received:", {
          email: JSON.stringify(credentials?.email),
          password: JSON.stringify(credentials?.password),
        });

        if (!credentials?.email || !credentials?.password) {
          console.log("[authorize] missing email or password field");
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
          include: {
            roles: {
              include: {
                role: { include: { permissions: { include: { permission: true } } } },
              },
            },
          },
        });

        if (!user || !user.isActive || user.deletedAt) {
          console.log("[authorize] user lookup failed or inactive:", { found: !!user });
          return null;
        }

        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        console.log("[authorize] bcrypt.compare result:", valid);
        if (!valid) return null;

        const roles = user.roles.map((ur) => ur.role.name);
        const permissions = Array.from(
          new Set(
            user.roles.flatMap((ur) => ur.role.permissions.map((rp) => rp.permission.code))
          )
        );

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          roles,
          permissions,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.roles = (user as unknown as { roles: string[] }).roles;
        token.permissions = (user as unknown as { permissions: string[] }).permissions;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as unknown as { roles: string[] }).roles =
          (token.roles as string[]) ?? [];
        (session.user as unknown as { permissions: string[] }).permissions =
          (token.permissions as string[]) ?? [];
        (session.user as unknown as { id: string }).id = token.sub as string;
      }
      return session;
    },
  },
};
