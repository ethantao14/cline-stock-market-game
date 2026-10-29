import { describe, expect, it, vi } from "vitest";

import { metadata } from "./layout";

vi.mock("next/font/google", () => ({
  Geist: () => ({ variable: "" }),
  Geist_Mono: () => ({ variable: "" }),
}));

vi.mock("@/components/theme-provider", () => ({
  ThemeProvider: () => null,
}));

vi.mock("@/components/theme-picker", () => ({
  ThemePicker: () => null,
}));

describe("metadata.description", () => {
  it("does not claim players see no price data", () => {
    expect(metadata.description).not.toMatch(/without seeing any price/i);
  });

  it("mentions both blind and informed modes", () => {
    expect(metadata.description).toMatch(/\bblind\b/i);
    expect(metadata.description).toMatch(/\binformed\b/i);
  });

  it("contains no em dash or en dash", () => {
    expect(metadata.description).not.toMatch(/[\u2014\u2013]/);
  });

  it("stays a single sentence under 200 characters", () => {
    const description = metadata.description;

    expect(typeof description).toBe("string");
    if (typeof description !== "string") {
      throw new Error("Expected metadata.description to be a string");
    }

    const sentences = Array.from(
      new Intl.Segmenter("en", { granularity: "sentence" }).segment(description),
    );

    expect(sentences).toHaveLength(1);
    expect(description.length).toBeLessThan(200);
  });
});
