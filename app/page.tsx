import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.06),_transparent_38%),linear-gradient(to_bottom,_#ffffff,_#f8fafc)] px-6 py-24 text-center dark:bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.12),_transparent_38%),linear-gradient(to_bottom,_#0f172a,_#101a2b)]">
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
        Blind Stock Draft
      </p>
      <h1 className="mt-4 max-w-2xl text-4xl font-semibold tracking-tight text-slate-950 dark:text-slate-100 md:text-5xl">
        Draft blind. Get judged by random market years.
      </h1>
      <p className="mt-4 max-w-xl text-base text-slate-500 dark:text-slate-400">
        Pick one stock per sector across 8 rounds, with each pick assigned a
        random year from 2019–2022. The same stock can crush it in one year
        and flop in another.
      </p>
      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
        <Link
          href="/draft"
          className="inline-flex h-11 items-center justify-center rounded-full bg-slate-950 px-8 text-sm font-medium text-white transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300 dark:focus-visible:ring-slate-600"
        >
          Start the draft
        </Link>
        <Link
          href="/draft?mode=informed"
          className="inline-flex h-11 items-center justify-center rounded-full border border-slate-300 bg-white px-8 text-sm font-medium text-slate-900 transition-colors hover:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-600 dark:focus-visible:ring-slate-600"
        >
          Start an informed draft
        </Link>
      </div>
      <p className="mt-3 max-w-md text-xs text-slate-400 dark:text-slate-500">
        Informed mode shows each stock&apos;s starting price, but the assigned year — and the outcome — still stays unpredictable.
      </p>
    </div>
  );
}
