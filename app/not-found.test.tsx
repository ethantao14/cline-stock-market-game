import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import NotFound, { metadata } from "@/app/not-found";

afterEach(() => {
  cleanup();
});

describe("Not-found page", () => {
  it("renders the page heading", () => {
    render(<NotFound />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Page not found" }),
    ).toBeInTheDocument();
  });

  it("explains how to continue", () => {
    render(<NotFound />);

    expect(
      screen.getByText(
        "This page doesn't exist. Start a new draft or go back to the home page.",
      ),
    ).toBeInTheDocument();
  });

  it("links to a new draft", () => {
    render(<NotFound />);

    expect(screen.getByRole("link", { name: "Start a draft" })).toHaveAttribute(
      "href",
      "/draft",
    );
  });

  it("links to the home page", () => {
    render(<NotFound />);

    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
  });

  it("exports the page title metadata", () => {
    expect(metadata.title).toBe("Page not found");
  });

  it("contains neither an em dash nor an en dash", () => {
    const { container } = render(<NotFound />);

    expect(container).not.toHaveTextContent(/[\u2014\u2013]/);
  });
});
