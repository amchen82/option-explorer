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

  return (
    <nav className="sticky top-0 z-10 border-b border-[var(--tv-border)] bg-[rgba(11,14,17,0.94)] backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-[1360px] items-center justify-between px-5 xl:px-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-sm font-semibold tracking-[0.24em] text-[var(--text-primary)]">
            OPTIONSIQ
          </Link>
          {authEnabled && session && (
            <div className="hidden items-center gap-4 text-xs uppercase tracking-[0.18em] text-[var(--text-tertiary)] sm:flex">
              <Link href="/" className="transition hover:text-[var(--text-primary)]">
                Dashboard
              </Link>
              <span className="text-[var(--tv-border)]">|</span>
              <span>Portfolio workspace</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {!authEnabled ? (
            <span className="tv-chip rounded-md px-3 py-1.5 text-xs uppercase tracking-[0.14em] text-[var(--text-secondary)]">
              Public mode
            </span>
          ) : session ? (
            <>
              <span className="hidden text-sm text-[var(--text-secondary)] md:inline">
                {session.user?.email}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="tv-chip rounded-md px-3 py-1.5 text-sm text-[var(--text-primary)] transition hover:bg-[var(--tv-surface-3)]"
              >
                Sign out
              </button>
            </>
          ) : (
            <button
              onClick={() => signIn(undefined, { callbackUrl: "/" })}
              className="rounded-md bg-[var(--text-accent)] px-3 py-1.5 text-sm font-medium text-white transition hover:bg-[#6b9eff]"
            >
              Sign in
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
