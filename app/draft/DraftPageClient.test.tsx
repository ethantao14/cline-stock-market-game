import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DraftPageClient } from "./DraftPageClient";
import type { AvailableStocksByYearAndSector } from "@/lib/season";
import { SECTORS, STOCKS_BY_SECTOR } from "@/data/sectors";
import { AVAILABLE_SIMULATION_YEARS } from "@/lib/draft-reducer";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(""),
}));

afterEach(() => {
  cleanup();
});

function makeAvailableStocksByYearAndSector(): AvailableStocksByYearAndSector {
  return Object.fromEntries(
    AVAILABLE_SIMULATION_YEARS.map((year) => [
      year,
      Object.fromEntries(SECTORS.map((sector) => [sector, [STOCKS_BY_SECTOR[sector][0]]])),
    ]),
  ) as AvailableStocksByYearAndSector;
}

describe("DraftPageClient", () => {
  it("renders sector chips as non-interactive labels", () => {
    const { container } = render(<DraftPageClient availableStocksByYearAndSector={makeAvailableStocksByYearAndSector()} />);

    const chipRow = container.querySelector(".flex.flex-wrap.gap-2");

    expect(chipRow).not.toBeNull();

    expect(screen.queryByRole("button", { name: "Technology" })).not.toBeInTheDocument();

    const technologyChip = within(chipRow as HTMLElement).getByText("Technology");
    expect(technologyChip.tagName).toBe("SPAN");
    expect(technologyChip).not.toHaveAttribute("tabindex");
  });
});