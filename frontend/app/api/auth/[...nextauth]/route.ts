import NextAuth, { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";
import type { JWT } from "next-auth/jwt";
import type { Session } from "next-auth";

type AppJWT = JWT & {
  apiToken?: string;
};

type AppSession = Session & {
  apiToken?: string;
};

async function exchangeEmailForBackendToken(email?: string | null) {
  if (!email) {
    return undefined;
  }

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/test-token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  if (!res.ok) {
    throw new Error(`Backend auth exchange failed: ${res.status}`);
  }

  const data: { access_token?: string } = await res.json();
  return data.access_token;
}

const options: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
      authorization: { params: { scope: "read:user user:email" } },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      const appToken = token as AppJWT;

      if (!appToken.apiToken) {
        const email =
          token.email ??
          (profile as { email?: string | null } | undefined)?.email ??
          null;

        if (account && email) {
          try {
            appToken.apiToken = await exchangeEmailForBackendToken(email);
          } catch (error) {
            console.error("Failed to exchange OAuth session for backend token", error);
          }
        }
      }

      return appToken;
    },
    async session({ session, token }) {
      const appSession = session as AppSession;
      appSession.apiToken = (token as AppJWT).apiToken;
      return appSession;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(options);

export { handler as GET, handler as POST };
