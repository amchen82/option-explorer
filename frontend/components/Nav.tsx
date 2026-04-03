"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Session } from "next-auth";
import { getSession, signIn, signOut } from "next-auth/react";

type AppSession = Session & {
  apiToken?: string;
};

export default function Nav() {
  const [session, setSession] = useState<AppSession | null>(null);

  useEffect(() => {
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
    <nav className="sticky top-0 z-10 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-sm font-semibold tracking-[0.3em] text-slate-100">
            OPTIONSIQ
          </Link>
          {session && (
            <div className="hidden items-center gap-4 text-sm text-slate-400 sm:flex">
              <Link href="/" className="transition hover:text-slate-100">
                Dashboard
              </Link>
              <span className="text-slate-600">|</span>
              <span>Portfolio workspace</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {session ? (
            <>
              <span className="hidden text-sm text-slate-400 md:inline">
                {session.user?.email}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:border-white/20 hover:bg-white/10"
              >
                Sign out
              </button>
            </>
          ) : (
            <button
              onClick={() => signIn(undefined, { callbackUrl: "/" })}
              className="rounded-full bg-cyan-500 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-cyan-400"
            >
              Sign in
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
