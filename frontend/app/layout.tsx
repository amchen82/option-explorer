import type { Metadata } from "next";
import type { ReactNode } from "react";
import NativeChrome from "@/components/NativeChrome";
import Nav from "@/components/Nav";
import "./globals.css";

const title = "Option Ideas — Understand an Options Trade Before You Make One";
const description =
  "Turn any ticker's market data and option chain into comparable options strategy ideas, each with " +
  "plain-language reasoning, max profit/loss, and probability of profit. No broker connection, no sign-in.";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.option-ideas.com"),
  title,
  description,
  openGraph: {
    title,
    description,
    url: "/",
    siteName: "Option Ideas",
    images: ["/screenshots/ideas.png"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/screenshots/ideas.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[var(--tv-bg)] text-[var(--text-primary)] antialiased">
        <NativeChrome />
        <Nav />
        <main className="mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-[1360px] px-4 py-4 xl:px-5">
          {children}
        </main>
      </body>
    </html>
  );
}
