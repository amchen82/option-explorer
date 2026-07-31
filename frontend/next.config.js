/**
 * Two build modes share one codebase.
 *
 * Web (default): unchanged from before — server rendering, API routes, and the
 * NextAuth handler all work as they always have.
 *
 * Mobile (MOBILE_BUILD=1): a static export that Capacitor packages into the iOS
 * and Android apps. Next refuses to static-export a project containing a route
 * handler, so `app/api/auth/[...nextauth]/route.server.ts` is excluded from the
 * mobile build via pageExtensions. The web build lists "server.ts" as a page
 * extension and therefore still registers it; the mobile build never sees it.
 * The mobile app has no need for NextAuth, since the ideas flow is public.
 */
const isMobileBuild = process.env.MOBILE_BUILD === "1";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  ...(isMobileBuild
    ? {
        output: "export",
        distDir: ".next-mobile",
        images: { unoptimized: true },
        pageExtensions: ["ts", "tsx"],
      }
    : {
        pageExtensions: ["server.ts", "server.tsx", "ts", "tsx"],
      }),
};

module.exports = nextConfig;
