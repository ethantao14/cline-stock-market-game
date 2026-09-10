import Link from "next/link";

export default function Home() {
  return (
    <div
      className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center"
      style={{ backgroundImage: "var(--page-bg)" }}
    >
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
        Blind Stock Draft
      </p>
      <h1 className="mt-4 max-w-2xl text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
        Draft blind. Get judged by twenty real market years.
      </h1>
      <p className="mt-4 max-w-xl text-base text-muted-foreground">
        Before the draft, the game secretly assigns one stock to each of the 8
        sectors for every year from 1996 to 2015. Each round reveals one year:
        spend a sector on it, hold that pick for 10 years, and find out how the
        average percent change across your 8 picks plays out.
      </p>
      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
        <Link
          href="/draft"
          className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-8 text-sm font-medium text-primary-foreground outline-none transition-colors hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring"
        >
          Start the draft
        </Link>
        <Link
          href="/draft?mode=informed"
          className="inline-flex h-11 items-center justify-center rounded-full border border-border bg-secondary px-8 text-sm font-medium text-secondary-foreground outline-none transition-colors hover:bg-secondary/90 focus-visible:ring-2 focus-visible:ring-ring"
        >
          Start an informed draft
        </Link>
      </div>
      <p className="mt-3 max-w-md text-xs text-muted-foreground">
        Informed mode shows each stock&apos;s starting price, but the assigned year — and the outcome — still stays unpredictable.
      </p>
    </div>
  );
}
