import { access, mkdir, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

import dotenv from "dotenv";

import { STOCKS_BY_SECTOR } from "../data/sectors";

type HistoricalPrice = {
  date: string;
  close: number;
};

type TwelveDataValue = {
  datetime: string;
  close: string;
};

type TwelveDataResponse = {
  status?: string;
  message?: string;
  values?: TwelveDataValue[];
};

class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

const API_URL = "https://api.twelvedata.com/time_series";
const START_DATE = "2022-01-01";
const END_DATE = "2022-12-31";
const ENV_FILE = path.resolve(process.cwd(), ".env.local");
const OUTPUT_DIR = path.resolve(process.cwd(), "data/historical");
const REQUEST_DELAY_MS = 2_000;
const RATE_LIMIT_DELAY_MS = 5_000;
const MAX_429_RETRIES = 3;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function ensureEnvFile(): Promise<void> {
  try {
    await access(ENV_FILE, constants.F_OK);
    dotenv.config({ path: ENV_FILE });
    return;
  } catch {
    // .env.local does not exist yet
  }

  const rl = readline.createInterface({ input, output });

  try {
    const apiKey = (await rl.question("Enter your Twelve Data API key: ")).trim();

    if (!apiKey) {
      throw new Error("API key cannot be empty");
    }

    await writeFile(ENV_FILE, `TWELVE_DATA_API_KEY=${apiKey}\n`, "utf8");
    console.log("Created .env.local");
    dotenv.config({ path: ENV_FILE });
  } finally {
    rl.close();
  }
}

function getAllTickers(): string[] {
  return Object.values(STOCKS_BY_SECTOR)
    .flat()
    .map((stock) => stock.ticker);
}

function buildUrl(ticker: string, apiKey: string): string {
  const params = new URLSearchParams({
    symbol: ticker,
    interval: "1day",
    start_date: START_DATE,
    end_date: END_DATE,
    apikey: apiKey,
    outputsize: "5000",
    order: "ASC",
  });

  return `${API_URL}?${params.toString()}`;
}

async function fetchHistoricalPrices(
  ticker: string,
  apiKey: string,
): Promise<HistoricalPrice[]> {
  const response = await fetch(buildUrl(ticker, apiKey));

  if (!response.ok) {
    throw new HttpError(
      response.status,
      `HTTP ${response.status} ${response.statusText}`,
    );
  }

  const data = (await response.json()) as TwelveDataResponse;

  if (data.status === "error") {
    throw new Error(data.message || "Twelve Data returned an error");
  }

  if (!Array.isArray(data.values)) {
    throw new Error("Twelve Data response did not include values");
  }

  return data.values.map((entry) => {
    const close = Number.parseFloat(entry.close);

    if (Number.isNaN(close)) {
      throw new Error(`Invalid close price for ${ticker} on ${entry.datetime}`);
    }

    return {
      date: entry.datetime,
      close,
    };
  });
}

async function fetchHistoricalPricesWithRetry(
  ticker: string,
  apiKey: string,
): Promise<HistoricalPrice[]> {
  let attempt = 0;

  while (true) {
    try {
      return await fetchHistoricalPrices(ticker, apiKey);
    } catch (error) {
      if (!(error instanceof HttpError) || error.status !== 429) {
        throw error;
      }

      attempt += 1;

      if (attempt > MAX_429_RETRIES) {
        throw new Error(`HTTP 429 after ${MAX_429_RETRIES} retries`);
      }

      console.warn(
        `Rate limited for ${ticker}. Waiting 5 seconds before retry ${attempt}/${MAX_429_RETRIES}...`,
      );
      await sleep(RATE_LIMIT_DELAY_MS);
    }
  }
}

async function saveHistoricalPrices(
  ticker: string,
  prices: HistoricalPrice[],
): Promise<void> {
  const filePath = path.join(OUTPUT_DIR, `${ticker}.json`);
  const json = JSON.stringify(prices, null, 2);

  await writeFile(filePath, `${json}\n`, "utf8");
}

async function historicalFileExists(ticker: string): Promise<boolean> {
  const filePath = path.join(OUTPUT_DIR, `${ticker}.json`);

  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function main(): Promise<void> {
  await ensureEnvFile();

  const apiKey = process.env.TWELVE_DATA_API_KEY;

  if (!apiKey) {
    throw new Error("Missing TWELVE_DATA_API_KEY environment variable");
  }

  const tickers = getAllTickers();

  await mkdir(OUTPUT_DIR, { recursive: true });

  console.log(`Fetching historical prices for ${tickers.length} tickers...`);

  for (const ticker of tickers) {
    if (await historicalFileExists(ticker)) {
      console.log(`Skipping ${ticker} - already fetched`);
      continue;
    }

    console.log(`Fetching ${ticker}...`);

    try {
      await sleep(REQUEST_DELAY_MS);
      const prices = await fetchHistoricalPricesWithRetry(ticker, apiKey);
      await saveHistoricalPrices(ticker, prices);
      console.log(`Saved ${ticker}`);
    } catch (error) {
      console.error(`Failed ${ticker}:`, error);
    }
  }

  console.log("Done.");
}

main().catch((error) => {
  console.error("Script failed:", error);
  process.exitCode = 1;
});