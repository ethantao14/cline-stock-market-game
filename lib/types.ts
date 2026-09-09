import type { SimulationYear } from "./draft-reducer";

export type Sector =
  | "Technology"
  | "Healthcare"
  | "Financials"
  | "Energy"
  | "Consumer Discretionary"
  | "Consumer Staples"
  | "Industrials"
  | "Utilities";

export interface Stock {
  ticker: string;
  name: string;
  sector: Sector;
}

export interface DraftPick {
  sector: Sector;
  ticker: string;
  year: SimulationYear;
}

export type Portfolio = DraftPick[];

export interface SimulationConfig {
  startDate: string;
  endDate: string;
}

export interface SimulationResult {
  totalReturnPercent: number;
}
