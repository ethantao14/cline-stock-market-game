# Cline Stock Market Game

Draft a stock portfolio, sector by sector, without seeing any price or
performance data — then find out how it would have actually done over a real
historical period.

Built as a project at [Cline](https://cline.bot).

## How it works

1. **Draft** — Pick one stock from each of 8 sectors, one sector at a time.
   You won't see price, performance, or fundamentals while picking — just the
   company name and sector. Allocate your budget across picks as you go.
2. **Simulate** — Once your portfolio is complete, see how it would have
   performed over a fixed historical period, using real historical price data.
3. **Results** — See how your total portfolio return played out.

## Tech Stack

- [Next.js](https://nextjs.org/) (App Router) + React + TypeScript
- [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- Historical price data via [Twelve Data](https://twelvedata.com/), fetched once
  and bundled as static data — no live API calls at runtime, no database

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view it.

## Historical Data Setup

Stock price data for 2022 is pre-fetched and committed to `data/historical/`. To regenerate or update this data:

### Prerequisites
Get a free Twelve Data API key at https://twelvedata.com

### Steps
1. Create a `.env.local` file in the root with:
TWELVE_DATA_API_KEY=your_api_key_here

2. Run:
```bash
   npm run fetch-historical
```
3. The script will prompt for your API key if `.env.local` doesn't exist
4. Historical price files will be saved to `data/historical/`

### Data Format
Each file (e.g., `data/historical/AAPL.json`) contains daily closing prices for 2022:
```json
[
  { "date": "2022-01-03", "close": 150.43 },
  { "date": "2022-01-04", "close": 149.63 }
]
```

## Project Status

Early development.

## License

TBD.
