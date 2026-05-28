import { describe, it, expect } from "vitest";
import {
  RESOURCE_LIBRARY,
  findResource,
  libraryCatalogForPrompt,
  resolvePicks,
} from "./resource-library";

describe("RESOURCE_LIBRARY structure", () => {
  it("contains at least one item in every documented category", () => {
    const categories = new Set(RESOURCE_LIBRARY.map((r) => r.category));
    // The README + UI list these 5 categories explicitly.
    expect(categories.has("jobs")).toBe(true);
    expect(categories.has("courses")).toBe(true);
    expect(categories.has("books")).toBe(true);
    expect(categories.has("communities")).toBe(true);
    expect(categories.has("trends")).toBe(true);
  });

  it("has unique ids across the whole library", () => {
    const ids = RESOURCE_LIBRARY.map((r) => r.id);
    const uniq = new Set(ids);
    expect(uniq.size).toBe(ids.length);
  });

  it("every entry has all required fields non-empty", () => {
    for (const r of RESOURCE_LIBRARY) {
      expect(r.id.trim()).not.toBe("");
      expect(r.category.trim()).not.toBe("");
      expect(r.title.trim()).not.toBe("");
      expect(r.description.trim()).not.toBe("");
      expect(r.source.trim()).not.toBe("");
      // url must be http(s) — never a relative path or placeholder
      expect(r.url).toMatch(/^https?:\/\//);
      expect(Array.isArray(r.tags)).toBe(true);
    }
  });
});

describe("findResource()", () => {
  it("returns the matching item by id", () => {
    const item = findResource("edu-04");
    expect(item).toBeDefined();
    expect(item?.title).toBe("노마드코더");
    expect(item?.url).toBe("https://nomadcoders.co");
  });

  it("returns undefined for unknown ids", () => {
    expect(findResource("totally-fake-id")).toBeUndefined();
    expect(findResource("")).toBeUndefined();
    expect(findResource("EDU-04")).toBeUndefined(); // case-sensitive
  });
});

describe("libraryCatalogForPrompt()", () => {
  it("includes one line per library item", () => {
    const cat = libraryCatalogForPrompt();
    const lines = cat.split("\n").filter(Boolean);
    expect(lines.length).toBe(RESOURCE_LIBRARY.length);
  });

  it("DOES NOT include URLs (model cannot exfiltrate them)", () => {
    const cat = libraryCatalogForPrompt();
    for (const r of RESOURCE_LIBRARY) {
      expect(cat).not.toContain(r.url);
    }
  });

  it("includes id, category, title, description", () => {
    const cat = libraryCatalogForPrompt();
    expect(cat).toContain("edu-04 · courses · 노마드코더 — ");
    expect(cat).toContain("trend-01 · trends · 2025 한국 직업 전망");
  });
});

describe("resolvePicks() — defensive resolution", () => {
  it("returns empty array for non-array input", () => {
    expect(resolvePicks(null)).toEqual([]);
    expect(resolvePicks(undefined)).toEqual([]);
    expect(resolvePicks("not an array")).toEqual([]);
    expect(resolvePicks({} as unknown)).toEqual([]);
  });

  it("maps valid ids to real library entries", () => {
    const out = resolvePicks([
      { id: "edu-04", why: "사용자의 feelsAlive에 맞아." },
    ]);
    expect(out).toHaveLength(1);
    expect(out[0]).toEqual({
      title: "노마드코더",
      url: "https://nomadcoders.co",
      why: "사용자의 feelsAlive에 맞아.",
      source: "노마드코더",
    });
  });

  it("DROPS hallucinated ids silently", () => {
    const out = resolvePicks([
      { id: "edu-04", why: "valid" },
      { id: "totally-fake-id", why: "this is hallucinated" },
      { id: "trend-01", why: "also valid" },
    ]);
    expect(out).toHaveLength(2);
    expect(out.map((r) => r.title)).toContain("노마드코더");
    expect(out.map((r) => r.title)).toContain("2025 한국 직업 전망 (한국고용정보원)");
  });

  it("drops entries with missing/empty why", () => {
    const out = resolvePicks([
      { id: "edu-04", why: "" },
      { id: "trend-01", why: "   " },
      { id: "com-03", why: "real why" },
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].source).toBe("커리어리");
  });

  it("drops entries with missing/empty id", () => {
    const out = resolvePicks([
      { id: "", why: "valid" },
      { why: "valid" } as unknown,
      { id: "edu-04", why: "real" },
    ]);
    expect(out).toHaveLength(1);
  });

  it("de-duplicates repeated ids (keeps first occurrence)", () => {
    const out = resolvePicks([
      { id: "edu-04", why: "first" },
      { id: "edu-04", why: "second (should be dropped)" },
      { id: "trend-01", why: "valid" },
    ]);
    expect(out).toHaveLength(2);
    expect(out[0].why).toBe("first");
  });

  it("preserves the user-specific why string verbatim", () => {
    const customWhy = "사용자의 stuck 답변 '커리어 방향이 막막함'에 정확히 맞춤.";
    const out = resolvePicks([{ id: "trend-01", why: customWhy }]);
    expect(out[0].why).toBe(customWhy);
  });

  it("NEVER trusts a url field from the input (even if model sends one)", () => {
    const malicious = resolvePicks([
      {
        id: "edu-04",
        why: "valid",
        // Model could send these — we should ignore them.
        url: "https://attacker.example.com",
        title: "Hacked Title",
        source: "Attacker",
      } as unknown,
    ]);
    expect(malicious).toHaveLength(1);
    expect(malicious[0].url).toBe("https://nomadcoders.co");
    expect(malicious[0].title).toBe("노마드코더");
    expect(malicious[0].source).toBe("노마드코더");
  });

  it("skips null/non-object items inside the array", () => {
    const out = resolvePicks([
      null,
      undefined,
      "string",
      42,
      { id: "edu-04", why: "valid" },
    ] as unknown as never[]);
    expect(out).toHaveLength(1);
  });
});
