// @vitest-environment node

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const imagePath = new URL("./opengraph-image.png", import.meta.url);
const altPath = new URL("./opengraph-image.alt.txt", import.meta.url);

describe("static Open Graph image", () => {
  it("has a PNG signature and a complete IHDR header", () => {
    const image = readFileSync(imagePath);

    expect(image.length).toBeGreaterThanOrEqual(33);
    expect(image.subarray(0, 8)).toEqual(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    );
    expect(image.readUInt32BE(8)).toBe(13);
    expect(image.toString("ascii", 12, 16)).toBe("IHDR");
  });

  it("is exactly 1200 by 630 pixels according to the PNG IHDR bytes", () => {
    const image = readFileSync(imagePath);

    expect(image.readUInt32BE(16)).toBe(1200);
    expect(image.readUInt32BE(20)).toBe(630);
  });

  it("is under 1 MB", () => {
    expect(readFileSync(imagePath).length).toBeLessThan(1_000_000);
  });
});

describe("Open Graph image alt text", () => {
  it("contains non-empty alt text", () => {
    expect(readFileSync(altPath, "utf8").trim()).not.toBe("");
  });

  it("is one line, allowing a final newline", () => {
    const alt = readFileSync(altPath, "utf8").replace(/\r?\n$/, "");

    expect(alt).not.toMatch(/[\r\n\u2028\u2029]/);
  });

  it("is under 200 characters", () => {
    const alt = readFileSync(altPath, "utf8").replace(/\r?\n$/, "");

    expect(alt.length).toBeLessThan(200);
  });

  it("contains no em dash or en dash", () => {
    expect(readFileSync(altPath, "utf8")).not.toMatch(/[\u2014\u2013]/);
  });
});
