import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ThemeProvider } from "@/components/theme-provider";
import { ThemePicker } from "@/components/theme-picker";
import { THEMES } from "@/lib/theme";

// next-themes (with enableSystem) probes the user's color-scheme preference,
// which jsdom does not implement. Stub it so the provider can render.
beforeEach(() => {
  window.matchMedia =
    window.matchMedia ||
    ((query: string) =>
      ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }) as MediaQueryList);
});

afterEach(() => {
  cleanup();
  // next-themes mutates <html> class; strip any theme tokens so suites stay isolated
  document.documentElement.classList.remove(...THEMES);
});

describe("ThemePicker", () => {
  it("renders a trigger button that opens the theme swatches", () => {
    render(
      <ThemeProvider>
        <ThemePicker />
      </ThemeProvider>,
    );

    const trigger = screen.getByRole("button", { name: /change color theme/i });
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    expect(screen.getByRole("button", { name: "Light" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Dark" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Forest" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sunset" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Berry" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Indigo" })).toBeInTheDocument();
  });

  it("closes the picker when a theme is selected", () => {
    render(
      <ThemeProvider>
        <ThemePicker />
      </ThemeProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: /change color theme/i }));
    fireEvent.click(screen.getByRole("button", { name: "Forest" }));

        expect(screen.queryByRole("button", { name: "Forest" })).not.toBeInTheDocument();
  });

  it("applies the selected theme class to <html>", () => {
    render(
      <ThemeProvider>
        <ThemePicker />
      </ThemeProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: /change color theme/i }));
        fireEvent.click(screen.getByRole("button", { name: "Sunset" }));

    expect(document.documentElement.classList.contains("sunset")).toBe(true);
    expect(document.documentElement.classList.contains("light")).toBe(false);
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });
});
