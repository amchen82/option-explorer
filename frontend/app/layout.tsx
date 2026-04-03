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
      <body className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.14),_transparent_34%),linear-gradient(180deg,_#07101d_0%,_#02060d_100%)] text-[var(--text-primary)] antialiased">
        <Nav />
        <main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl px-6 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
