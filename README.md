# Cline Stock Market Game

A blind stock-drafting game where you pick one stock per sector across 8 rounds, score each round against a randomly assigned real historical market year, and see a 10-year portfolio value chart and your rank among 2,000 simulated random drafts.

**[Try the live demo](https://stock-market-draft.vercel.app)**. Runs entirely in the browser with no sign-up.

![Animated walkthrough of a full stock draft from picks to results](docs/screenshots/draft-to-results-flow.gif)

<table>
  <tr>
    <td width="33%"><img src="docs/screenshots/draft-board-mid-draft.png" alt="Draft board with 3 of 8 stock picks made" width="100%"></td>
    <td width="33%"><img src="docs/screenshots/results-portfolio-and-monte-carlo-charts.png" alt="Results showing a portfolio index chart and the distribution of 2,000 simulated random drafts" width="100%"></td>
    <td width="33%"><img src="docs/screenshots/theme-picker-ocean-theme.png" alt="Results page in the Ocean theme with the color theme picker open" width="100%"></td>
  </tr>
</table>

Draft eight stocks across eight sectors, then see how each pick performed over
10 years of historical prices. Choose blind or informed mode and compare your
equally weighted portfolio with 2,000 simulated random drafts.

Built as a project at [Cline](https://cline.bot).

## How it works

1. **Draft:** At game start, a season is drawn with one stock per sector for
   every year from 1996 to 2015. Each of the 8 rounds gets a random year from
   that range, with replacement, so years can repeat. The full 8-sector board
   for that year is shown, and you pick one stock from any unused sector.
   Used sectors stay visible but greyed out, showing what they would have
   offered that round.
2. **Simulate:** Each pick is held for 10 years starting in January of its
   round year, using monthly closing prices. Every pick has equal weight,
   so total return is the average return across all 8 picks.
3. **Results:** See total return and a "Portfolio Index Over Time" chart,
   an equal-weight index starting at 100 and tracked through year 10. Your
   percentile rank compares your return with 2,000 simulated random drafts
   using your exact round years and spending sectors in a random order.
   The "Distribution of Random Drafts" histogram marks your result. Results
   also show your best and worst pick and a per-position breakdown with
   opening price, closing price, and return. Use "Copy Results" to copy them.

## How to Play

1. Open the [live demo](https://stock-market-draft.vercel.app) or run the app
   locally using the Getting Started instructions below.
2. Choose "Start the draft" for blind mode, which shows only ticker and
   company name. Choose "Start an informed draft" to also see each stock's
   price in January of that round's year. The outcome is unknown in both modes.
3. Draft across 8 rounds and 8 sectors: Technology, Healthcare, Financials,
   Energy, Consumer Discretionary, Consumer Staples, Industrials, and Utilities.
   Each round, click a stock from an unused sector, then click
   "Confirm Draft Pick" or press Enter. You use each sector once.
4. After your eighth pick, review the charts, percentile rank, and individual
   returns on the results page. Use "Copy Results" to copy your results.
5. During the draft, "Reset Draft" starts over. On the results page, "Play again"
   returns to the home page. The theme picker in the top right corner offers
   light and dark modes plus color palettes.

## Tech Stack

- Next.js (App Router), React, and TypeScript.
- Tailwind CSS and shadcn/ui.
- Recharts for charts.
- Vitest and Testing Library for tests.
- Every page is prerendered as static content, with no backend, database,
  API keys, or environment variables at runtime.
- Monthly closing prices from [Twelve Data](https://twelvedata.com/), fetched
  once and committed as one JSON file per ticker in `data/historical/`.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Run checks with `npm test`, `npm run lint`, and `npm run typecheck`.
CI runs lint, typecheck, and tests on Node 24.

Use `npm run build` to build the app and `npm start` to run the production
build.

## Historical Data Setup

Monthly closing prices from January 1996 through December 2025 for 139 tickers
are already committed to `data/historical/`. No API key is needed to run the
app. Follow these steps to refresh the data.

### Prerequisites

Get a free API key from [Twelve Data](https://twelvedata.com/).

### Steps

1. Create `.env.local` in the repository root with:

   ```dotenv
   TWELVE_DATA_API_KEY=your_api_key_here
   ```

   If `.env.local` does not exist, the fetch script prompts for the key.
2. Fetch the historical prices:

   ```bash
   npm run fetch-historical
   ```

   The files are saved to `data/historical/`, one JSON file per ticker.
3. Regenerate the static import index:

   ```bash
   npm run generate-historical-index
   ```

   This regenerates `data/historical-index.ts`, which statically imports every
   `data/historical/*.json` file.

### Data Format

Each file contains monthly closing prices. For example,
`data/historical/AAPL.json`:

```json
[
  { "date": "1996-01-01", "close": 0.24665201 },
  { "date": "1996-02-01", "close": 0.245536 }
]
```
