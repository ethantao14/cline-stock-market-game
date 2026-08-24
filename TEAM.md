# TEAM.md — Internal Project Doc (NOT for public eyes)

> **Before this repo ever goes public: delete or move this file.** README.md is
> written to stay public-safe on its own — nothing in it depends on this file.
> Everything below (names, backstory, task-level detail) stays here specifically
> because it shouldn't be in the public README.

---

## 1. Background

**Project name: Cline Stock Market Game** (GitHub repo: `cline-stock-market-game`,
owner `ethantao14`). Matches the public README's title — no separate internal
name to track.

Built at Cline, assigned by Shawn Tau, built by Ethan and Kenny (intern).
Inspired by a demo Shawn showed of an NBA draft-and-simulate app: draft a team,
simulate a season, see how you did. This project is the same idea applied to
stock portfolios instead of NBA teams.

## 2. What We're Building

A user drafts a stock portfolio by picking one stock per sector, across 8
sectors, without seeing any price or fundamental data during the pick — a blind
draft, on purpose, so the user relies on their own outside knowledge. Once the
draft is complete, the app simulates how that portfolio would have performed
over a fixed real historical period (all of 2022) and shows the result.

## 3. Decisions Made, and Why

| Decision | Choice | Reasoning |
|---|---|---|
| Sectors / rounds | 8 | Closer to real-world sector diversification than a short 5-round draft |
| Stock choices per round | 15-20 (the full curated sector list) | Every curated ticker is shown, not a subset — more variety, harder/more interesting decisions |
| Draft visibility | Blind (no price/fundamentals shown) | The whole point of v1 — user relies on outside knowledge, not app-provided data. "Informed mode" is a v2 idea. |
| Budget | $10,000 starting, user allocates per pick | Round number, easy to reason about in percentage terms later |
| Leftover / overspend rule | Leftover budget wasted; running out ends the draft early (remaining rounds skipped) | Confirmed intentional — rewards conviction sizing, not perfect budgeting |
| Pick sizing basis | Pure conviction (no data to size against, since the draft is blind) | Confirmed intentional design, not an oversight |
| Simulation period | Fixed for everyone: all of 2022 | 2022 had huge sector dispersion (energy up 50%+, growth tech down sharply) — good/bad picks will look dramatically different on the results screen, which is what makes results fun to look at |
| Results screen v1 scope | Total portfolio return only | Chart of value over time, best/worst pick, and S&P 500 comparison are v2 — get the core number right first |
| Data source | Twelve Data, not Alpha Vantage | Alpha Vantage's free tier has shrunk to ~25 requests/day in 2026; Twelve Data offers ~800/day, much more headroom for two people iterating |
| Data storage | No database (confirmed by Shawn). Fetch once, commit static JSON to the repo. | Avoids the whole database question entirely, and avoids a runtime-caching bug: if this ever deploys somewhere serverless (e.g. Vercel), writing a file to disk at runtime doesn't persist between requests. Committing the JSON up front sidesteps that. |
| Stock lists per sector | Hand-curated static lists (~15-20 tickers/sector), not pulled live from the API | Avoids burning API calls on something that barely changes, and the draft still works if the API is briefly down |
| Repo visibility | Private for now, made public later once polished | Lets us keep internal names/process detail (this file) committed without it being publicly visible; flip to public once ready and delete this file |
| Work split model | By feature (vertical slice), not frontend/backend | Frontend/backend splits tend to leave one person blocked waiting on the other's API. Feature slices let both people build and demo independently, with only a shared contract to agree on up front. |

## 4. Work Split

### Ethan — Draft & Portfolio Builder

**Owns:** the sector-by-sector draft flow, budget/portfolio state, roster and
spend validation.

- **Route:** `app/draft/page.tsx` — a single client component page driving the
  8-round flow via local state, rather than 8 separate dynamic routes. Simpler
  to reason about for a strictly linear flow.
- **Components (shadcn-based):**
  - `SectorRoundCard` — shows the current sector and its full 15-20 stock options
  - `StockPickCard` / `StockOptionButton` — one clickable option per stock
  - `BudgetMeter` — remaining budget vs. $10,000, updates live
  - `DraftProgressIndicator` — which of the 8 rounds you're on
  - `PortfolioSummarySidebar` — running list of picks made so far
- **State management:** React Context + `useReducer` for draft state (current
  round, remaining budget, picks made so far). Deliberately not pulling in a
  state library like Zustand/Redux for this — the state shape is small enough
  that Context + a reducer keeps dependencies minimal. Revisit only if the
  reducer logic actually gets unwieldy.
- **Sector/ticker data source:** reads the shared static ticker list (Section 5
  below) as a plain import — no fetch needed, it's bundled with the app.
- **Validation to implement:**
  - Spend on a single pick can't exceed remaining budget
  - Can't pick the same sector twice
  - If budget hits $0 before all 8 rounds are done, end the draft early rather
    than continuing to prompt for picks
- **Handoff to Kenny's side:** once the draft is complete, the finished
  portfolio (list of `{ ticker, dollarsAllocated }`) needs to reach the Results
  page. Since there's no database, **write it to `localStorage`** on draft
  completion — the Results page reads it back out on load. This keeps it fully
  client-side and avoids inventing a fake backend just to pass one object
  between two pages. Shape it according to the `Portfolio` type in `types.ts`
  (Section 5) so both sides agree on the exact fields.

### Kenny — Simulation Engine & Results

**Owns:** fetching + caching historical data, the performance calculation, the
results dashboard.

- **One-off fetch script:** `scripts/fetch-historical.ts` — not part of the
  running app. Reads the shared ticker list (Section 5), calls Twelve Data for
  each ticker's full 2022 daily closing prices, and writes
  `data/historical/{TICKER}.json`. Run once, commit the output, done — this
  script doesn't need to be polished, it's a throwaway build-time tool.
- **Historical data shape:** keep each JSON file minimal — an array of
  `{ date, close }` per ticker. No need for full OHLCV data; only closing price
  is needed for the return calculation, and unused fields are just clutter.
- **Simulation module:** `lib/simulate.ts` — a pure function taking a
  `Portfolio` and returning a `SimulationResult`. For each pick: look up the
  ticker's close price on the first trading day of 2022 (buy price) and the
  last trading day of 2022 (end price), compute
  `shares = dollarsAllocated / buyPrice`, then `endingValue = shares * endPrice`.
  Sum across all picks, plus any unspent/wasted budget contributing $0 return,
  to get the total portfolio return.
- **Route:** `app/results/page.tsx` — client component, reads the `Portfolio`
  back out of `localStorage` (see Ethan's handoff note above), runs it
  through `lib/simulate.ts`, and renders the result.
- **v1 results component:** a single `PortfolioReturnCard` showing total return
  % and starting vs. ending value. That's the whole v1 results screen.
- **v2 candidates (not v1):** a value-over-time chart, a best/worst pick
  callout, and an S&P 500 (SPY) comparison — the last one would need SPY's 2022
  data fetched and cached the same way as everything else.
- **Recommended chart library for v2:** [Recharts](https://recharts.org/) —
  lightweight, composable, and commonly paired with Tailwind/shadcn dashboards.
  No need to pull this in for v1 since v1 has no chart.

### Shared (agree on together, before splitting into branches)

- **`types.ts`** (suggested location: `lib/types.ts`) — defines `Sector`,
  `Stock`, `DraftPick`, `Portfolio`, `SimulationConfig`, `SimulationResult`.
  This is the contract both slices build against.
- **Ticker list** (suggested location: `data/sectors.ts`) — the ~15-20 tickers
  per sector, for all 8 sectors. Needed by Ethan's draft UI *and* Kenny's fetch
  script, so it has to be finalized before either of you branches off.
- **`localStorage` handoff convention** — documented above, but worth saying
  out loud to each other once so neither of you is surprised by it mid-build.

## 5. Shared Setup Checklist (do this before splitting into branches)

1. Scaffold the Next.js + TypeScript + Tailwind + shadcn project, with ESLint,
   Vitest, and the GitHub Actions CI file from the rules below wired up.
2. Finalize the ~15-20 tickers per sector, for all 8 sectors (`data/sectors.ts`).
3. Write `lib/types.ts` together.
4. Get a Twelve Data API key, write `scripts/fetch-historical.ts`.
5. Run the script once, commit the resulting `data/historical/*.json` files.
6. Merge all of the above to `main`. From here, branch off separately.

---

# Appendix: AI Assistant Rules for This Project

*Copy this section as-is into any AI coding assistant working on this repo
(Claude Code, etc.). Follow it exactly — it is not a style guide, it is a set of
hard requirements.*

## Design & Planning
1. Do not write implementation code for an undecided design question. If a
   mechanism, data shape, or architecture choice is not settled in this doc,
   stop and ask before writing code, rather than guessing and fixing it later.
2. Small bugfix commits within an existing PR are fine. Committing a wrong or
   unagreed design is not — revert or ask instead.
3. On a genuine design fork not covered by this doc: follow whatever the README
   documents first. If the README is silent, pick the standard, commonly-used
   solution in the Next.js/React ecosystem over a clever bespoke one.

## PR Structure & Workflow
4. One complete, working feature per PR. A PR must be a full vertical slice
   (UI + logic + API route, as relevant) that works end-to-end for its scope —
   never a partial "core vs. polish" split, and never a whole subsystem in one PR.
5. Merge (or explicitly-authorized self-merge) a PR before opening the next one
   via `gh pr create`. Never stack unmerged PRs on top of each other.
6. If a bug is found while reviewing an unmerged PR, fix it with more commits on
   that same branch. Do not open a separate follow-up PR for it.
7. All CI checks passing is a hard gate before merge — do not merge on the
   strength of local output alone.
8. PR titles and descriptions must be understandable standalone, with zero
   assumed context — write as if the reader has not seen this conversation.
9. Confirm with the user in chat before running `gh pr create` or `gh pr merge`.
   Everything local — commits, `git push` to a feature branch, running lint,
   typecheck, or tests — proceeds without asking first.
10. Ask before adding a PR reviewer.

## Toolchain (exact commands)
11. Language/runtime: **TypeScript** on **Node.js 24 (Active LTS)**, pinned
    explicitly in CI via `actions/setup-node@v4` with `node-version: "24"`.
12. Package manager: **npm**. Install with `npm install` locally, `npm ci` in CI
    (uses the lockfile exactly, does not update it).
13. Linter: **ESLint**, run as `npm run lint`. This is a hard gate, both before
    committing locally and as its own step in CI.
14. Type checking: `npm run typecheck` (runs `tsc --noEmit`). This is a separate
    gate from lint and must also pass before merge — TypeScript errors are not
    optional warnings.
15. Test runner: **Vitest**, run as `npm test` in CI with no extra flags beyond
    what's defined in `package.json`.
16. CI platform: **GitHub Actions**, single job on `ubuntu-latest`, triggered on
    push to `main` and on every pull request. Steps in order: checkout →
    `setup-node@v4` (Node 24) → `npm ci` → `npm run lint` → `npm run typecheck` →
    `npm test`.
17. Before merging any PR, run `gh pr checks <N> --watch` — do not rely on
    eyeballing the Actions tab. After a squash-merge to `main`, run
    `gh run list --branch main` / `gh run watch <run-id> --exit-status` to confirm
    the post-merge run on `main` itself also passes.
18. Independent AI review before every `gh pr create`: run
    `npx --yes @openai/codex exec review --base main -C <repo path>` yourself (use
    `--uncommitted` for working-tree diffs, `--commit <sha>` for a specific
    commit). Fix real findings before opening the PR. Cap any one review round at
    roughly 10 minutes wall-clock — past that, stop waiting and proceed without it.
19. Merge strategy caveat: if the repo only allows squash-merge, stacked branches
    will show false conflicts because `main`'s post-squash commit hash never
    matches the branch's. Check the repo's merge-strategy setting before relying
    on any branch-stacking workflow, and avoid stacking unmerged branches
    regardless, per rule 5.

## Code Style
20. Readable over clever. Clear naming, no clever one-liners, avoid unnecessary
    abstraction even when moving fast.
21. Comments capped at ~3 lines. A comment needing more than that is a signal the
    code needs restructuring or clearer naming, not a cue to write a longer
    comment.
22. Avoid `any` in TypeScript. If a type is genuinely unknown, use `unknown` and
    narrow it, rather than reaching for `any` to silence the compiler.
23. Commits can run a bit bigger during early/setup work but should never be a
    dumped diff. Size follows from PR scope, not the reverse.

## Reporting Habits
24. Report the diff line count (e.g. "+150/-21 across 4 files") in chat right
    before running `gh pr create`.
25. After merge, walk through the PR description line-by-line/bullet-by-bullet in
    plain language — not a prose summary of the PR as a whole.

## Collaboration Mechanics
26. No em dashes in written messages, commit messages, or PR descriptions.
27. Never add a `Co-Authored-By: Claude` trailer to commits.
28. Permission to proceed on one action does not carry over to later, similar
    actions — confirm each `gh pr create` / `gh pr merge` individually.
29. The app must be an actually functioning app, verified by running it and
    using the feature (not just lint/typecheck/test/build passing), both
    immediately before opening a PR and immediately after it merges to main.
    CI passing is necessary but not sufficient.
