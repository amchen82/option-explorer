"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Session } from "next-auth";
import { getSession, signIn, signOut } from "next-auth/react";
import { authEnabled } from "@/lib/auth";

type AppSession = Session & {
  apiToken?: string;
};

export default function Nav() {
  const [session, setSession] = useState<AppSession | null>(null);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const saved = (localStorage.getItem("theme") as "dark" | "light") ?? "dark";
    setTheme(saved);
    document.documentElement.setAttribute("data-theme", saved);
  }, []);

  useEffect(() => {
    if (!authEnabled) {
      setSession(null);
      return;
    }

    let active = true;

    getSession().then((nextSession) => {
      if (active) {
        setSession((nextSession as AppSession | null) ?? null);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.setAttribute("data-theme", next);
  }

  return (
    <nav className="sticky top-0 z-10 bg-[var(--tv-surface)]">
      <div className="mx-auto flex h-10 w-full max-w-[1360px] items-center justify-between px-4 xl:px-5">
        <div className="flex items-center gap-5">
          <Link href="/" className="flex items-center gap-2 text-[13px] font-bold tracking-[0.2em] text-[var(--text-primary)]">
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <rect x="1" y="1" width="16" height="16" rx="2.5" stroke="var(--text-accent)" strokeWidth="1.25" />
              <polyline points="3.5,13 6.5,8.5 9.5,11 12,7.5 14.5,5" stroke="var(--text-accent)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            OPTIONSIQ
          </Link>
          {authEnabled && session && (
            <div className="hidden items-center gap-4 sm:flex">
              <Link href="/" className="text-[11px] uppercase tracking-[0.16em] text-[var(--text-tertiary)] transition hover:text-[var(--text-primary)]">
                Dashboard
              </Link>
              <span className="text-[var(--tv-border)]">·</span>
              <span className="text-[11px] uppercase tracking-[0.16em] text-[var(--text-secondary)]">Portfolio workspace</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className="tv-chip flex h-7 w-7 items-center justify-center rounded text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
          >
            {theme === "dark" ? (
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.4" />
                <path d="M8 1.5v1M8 13.5v1M1.5 8h1M13.5 8h1M3.4 3.4l.7.7M11.9 11.9l.7.7M3.4 12.6l.7-.7M11.9 4.1l.7-.7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M13.5 10A6 6 0 016 2.5a6 6 0 000 11A6 6 0 0013.5 10z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
              </svg>
            )}
          </button>

          {!authEnabled ? (
            <span className="tv-chip rounded px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
              Public mode
            </span>
          ) : session ? (
            <>
              <span className="hidden text-[12px] text-[var(--text-secondary)] md:inline">
                {session.user?.email}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="tv-chip rounded px-2.5 py-1 text-[12px] text-[var(--text-primary)] transition hover:bg-[var(--tv-surface-3)]"
              >
                Sign out
              </button>
            </>
          ) : (
            <button
              onClick={() => signIn(undefined, { callbackUrl: "/" })}
              className="rounded bg-[var(--text-accent)] px-3 py-1 text-[12px] font-medium text-white transition hover:opacity-90"
            >
              Sign in
            </button>
          )}
        </div>
      </div>
      <div className="h-px bg-gradient-to-r from-[#00b4d8] via-[#00d2a0] to-[#ffa502]" />
    </nav>
  );
}
