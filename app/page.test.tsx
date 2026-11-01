import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import Home from "@/app/page";

afterEach(() => {
  cleanup();
});

function renderInformedNote() {
  render(<Home />);
  return screen.getByText(/informed mode/i, { selector: "p" });
}

describe("Home informed mode note", () => {
  it("says informed mode shows each stock's starting price", () => {
    const note = renderInformedNote();

    expect(note).toHaveTextContent(
      /informed mode shows each stock['’]s starting price/i,
    );
  });

  it("contains neither an em dash nor an en dash", () => {
    const note = renderInformedNote();

    expect(note).not.toHaveTextContent(/[\u2014\u2013]/);
  });

  it("does not describe the round or assigned year as unpredictable or hidden", () => {
    const note = renderInformedNote();

    // Check either word order within a clause, allowing a separate sentence
    // to explain that the year is visible while the outcome remains hidden.
    expect(note).not.toHaveTextContent(
      /\b(?:(?:round\s+|assigned\s+)?year\b[^.!?;]*(?:unpredictable|hidden|unknown)|(?:unpredictable|hidden|unknown)\b[^.!?;]*\b(?:round\s+|assigned\s+)?year)\b/i,
    );
  });

  it("says the outcome stays hidden or unknown until the results", () => {
    const note = renderInformedNote();

    expect(note).toHaveTextContent(
      /\boutcome\b[^.!?;]*\b(?:hidden|unknown)\b[^.!?;]*\buntil\b[^.!?;]*\bresults\b/i,
    );
  });
});
