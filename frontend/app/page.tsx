export default function HomePage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_36%),linear-gradient(180deg,_#08111f_0%,_#030712_100%)] text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-5xl items-center px-6 py-16">
        <section className="max-w-2xl rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-cyan-950/20 backdrop-blur">
          <p className="mb-3 text-xs uppercase tracking-[0.35em] text-cyan-300">
            Options Strategy Tool
          </p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Portfolio options strategy scaffold.
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-300">
            The backend health check and frontend shell are in place so later tasks can add
            authentication, portfolios, market data, and strategy recommendations.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 text-sm">
            <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-cyan-200">
              FastAPI backend
            </span>
            <span className="rounded-full border border-slate-500/30 bg-slate-800/60 px-4 py-2 text-slate-200">
              Next.js 14 frontend
            </span>
            <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-emerald-200">
              Docker Compose ready
            </span>
          </div>
        </section>
      </div>
    </main>
  );
}
