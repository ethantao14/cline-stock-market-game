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

  it("does not mention an assigned year or call the year unpredictable", () => {
    const note = renderInformedNote();

    expect(note).not.toHaveTextContent(/assigned year/i);
    expect(note).not.toHaveTextContent(/(?<![-\w])year\b[^.]*unpredictable/i);
  });

  it("says the outcome stays hidden or unknown until the results", () => {
    const note = renderInformedNote();

    expect(note).toHaveTextContent(
      /\boutcome\b[^.!?;]*\b(?:hidden|unknown)\b[^.!?;]*\buntil\b[^.!?;]*\bresults\b/i,
    );
  });
});
