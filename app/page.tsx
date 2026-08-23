import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.06),_transparent_38%),linear-gradient(to_bottom,_#ffffff,_#f8fafc)] px-6 py-24 text-center">
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
        Blind Stock Draft
      </p>
      <h1 className="mt-4 max-w-2xl text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl">
        Draft a portfolio without seeing a single price.
      </h1>
      <p className="mt-4 max-w-xl text-base text-slate-500">
        Pick one stock per sector across 8 sectors using nothing but your own
        judgment, then find out how your picks would have performed over all
        of 2022.
      </p>
      <Link
        href="/draft"
        className="mt-8 inline-flex h-11 items-center justify-center rounded-full bg-slate-950 px-8 text-sm font-medium text-white transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
      >
        Start the draft
      </Link>
    </div>
  );
}
