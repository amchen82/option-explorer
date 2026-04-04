import type { Metadata } from "next";
import type { ReactNode } from "react";
import Nav from "@/components/Nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "Options Strategy Tool",
  description: "Portfolio options strategy tooling with OAuth sign-in and backend integration.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[var(--tv-bg)] text-[var(--text-primary)] antialiased">
        <Nav />
        <main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-[1360px] px-5 py-6 xl:px-6">
          {children}
        </main>
      </body>
    </html>
  );
}
