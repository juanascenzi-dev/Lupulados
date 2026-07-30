import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join } from "node:path";
import { describe, expect, it } from "vitest";

const TEXT_ROOTS = ["src", "public", "docs", "index.html"];
const BINARY_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".gif",
  ".ico",
  ".svg",
  ".woff",
  ".woff2",
  ".ttf",
  ".eot",
  ".mp4",
  ".mov",
  ".pdf",
]);
const SKIPPED_DIRECTORIES = new Set(["node_modules", "dist"]);
const SUSPICIOUS_MOJIBAKE_PATTERNS = [
  { label: "latin capital A with tilde", value: String.fromCharCode(0x00c3) },
  { label: "latin capital A with circumflex", value: String.fromCharCode(0x00c2) },
  { label: "latin small a with circumflex", value: String.fromCharCode(0x00e2) },
];

function listTextFiles(path: string): string[] {
  if (!existsSync(path)) return [];
  const stats = statSync(path);
  if (stats.isFile()) return BINARY_EXTENSIONS.has(extname(path).toLowerCase()) ? [] : [path];

  return readdirSync(path).flatMap((entry) => {
    if (SKIPPED_DIRECTORIES.has(entry)) return [];
    return listTextFiles(join(path, entry));
  });
}

describe("mojibake guard", () => {
  it("keeps source, public text, docs and HTML free of common mojibake sequences", () => {
    const findings = TEXT_ROOTS
      .flatMap(listTextFiles)
      .flatMap((file) => {
        const lines = readFileSync(file, "utf8").split(/\r?\n/);
        return lines.flatMap((line, index) =>
          SUSPICIOUS_MOJIBAKE_PATTERNS
            .filter((pattern) => line.includes(pattern.value))
            .map((pattern) => `${file}:${index + 1} contains ${pattern.label}`),
        );
      });

    expect(findings).toEqual([]);
  });
});
