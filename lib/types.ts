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
  year: number;
  dollarsAllocated: number;
}

export type Portfolio = DraftPick[];

export interface SimulationConfig {
  startDate: string;
  endDate: string;
}

export interface SimulationResult {
  startingValue: number;
  endingValue: number;
  totalReturnPercent: number;
  positions: SimulationPositionResult[];
  missingDataPicks: SimulationMissingDataPick[];
}

export interface SimulationPositionResult {
  sector: Sector;
  ticker: string;
  year: number;
  dollarsAllocated: number;
  endingValue: number;
  positionReturnPercent: number;
  hasData: boolean;
}

export interface SimulationMissingDataPick {
  sector: Sector;
  ticker: string;
  year: number;
}
