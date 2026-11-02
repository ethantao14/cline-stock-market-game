// @vitest-environment node

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const imagePath = new URL("./opengraph-image.png", import.meta.url);
const altPath = new URL("./opengraph-image.alt.txt", import.meta.url);

describe("static Open Graph image", () => {
  it("is exactly 1200 by 630 pixels according to the PNG IHDR bytes", () => {
    const image = readFileSync(imagePath);

    expect(image.subarray(0, 8)).toEqual(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    );
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

  it("is a single line with no trailing newline, under 200 characters", () => {
    const alt = readFileSync(altPath, "utf8");

    expect(alt).not.toMatch(/[\r\n\u2028\u2029]/);
    expect(alt.length).toBeLessThan(200);
  });

  it("contains no em dash or en dash", () => {
    expect(readFileSync(altPath, "utf8")).not.toMatch(/[\u2014\u2013]/);
  });
});
