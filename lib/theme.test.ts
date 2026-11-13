// @vitest-environment node

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { DEFAULT_THEME, THEME_PRESETS, THEMES, type Theme } from "./theme";

const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

function themeBlock(theme: Theme) {
  const selector = theme === "light" ? ":root" : `.${theme}`;
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return css.match(new RegExp(`^${escapedSelector} \\{([\\s\\S]*?)^\\}`, "m"))?.[1];
}

describe("theme contract", () => {
  it("has no duplicate themes and includes the default theme", () => {
    expect(new Set(THEMES).size).toBe(THEMES.length);
    expect(THEMES).toContain(DEFAULT_THEME);
  });

  it("has exactly one preset for every theme with no extra keys", () => {
    expect(Object.keys(THEME_PRESETS).sort()).toEqual([...THEMES].sort());
  });

  it("has unique labels", () => {
    const labels = THEMES.map((theme) => THEME_PRESETS[theme].label.trim());
    expect(new Set(labels).size).toBe(labels.length);
  });

  it.each(THEMES)("%s has a non-empty label", (theme) => {
    expect(THEME_PRESETS[theme].label.trim()).not.toBe("");
  });

  it.each(THEMES)("%s has a Tailwind background swatch", (theme) => {
    expect(THEME_PRESETS[theme].swatch).toMatch(/^bg-/);
  });

  it.each(THEMES)("%s has a CSS block with page background and primary variables", (theme) => {
    const block = themeBlock(theme);
    expect(block).toBeDefined();
    expect(block).toContain("--page-bg:");
    expect(block).toContain("--primary:");
  });
});
