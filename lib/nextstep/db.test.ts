import { describe, it, expect } from "vitest";
import {
  computeStreak,
  daysSinceLastEntry,
  getJournal,
  upsertJournalEntry,
  removeJournalEntry,
  localDateKey,
  JOURNAL_KEY,
  type Journal,
  type PlanProgress,
} from "./db";

// Tests pin todayISO so the suite is deterministic regardless of when it runs.
const TODAY = "2026-05-27"; // matches the project's current demo date
const YESTERDAY = "2026-05-26";
const TWO_DAYS_AGO = "2026-05-25";
const THREE_DAYS_AGO = "2026-05-24";

function entry(body = "x"): { body: string; createdAt: string; updatedAt: string } {
  const t = new Date().toISOString();
  return { body, createdAt: t, updatedAt: t };
}

describe("localDateKey()", () => {
  it("formats a date as YYYY-MM-DD in local time", () => {
    const d = new Date(2026, 0, 5); // 2026-01-05 local
    expect(localDateKey(d)).toBe("2026-01-05");
  });

  it("zero-pads month and day", () => {
    const d = new Date(2026, 8, 3); // 2026-09-03
    expect(localDateKey(d)).toBe("2026-09-03");
  });

  it("defaults to current date when no arg", () => {
    const out = localDateKey();
    expect(out).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("getJournal()", () => {
  it("returns {} for null/undefined progress", () => {
    expect(getJournal(null)).toEqual({});
    expect(getJournal(undefined)).toEqual({});
  });

  it("returns {} when __journal key is missing", () => {
    const prog: PlanProgress = {
      week_1: { done: true, note: "", updatedAt: "" },
    };
    expect(getJournal(prog)).toEqual({});
  });

  it("extracts journal entries from the reserved slot", () => {
    const prog = {
      week_1: { done: true, note: "", updatedAt: "" },
      [JOURNAL_KEY]: {
        [TODAY]: { body: "오늘", createdAt: "iso", updatedAt: "iso" },
      },
    } as unknown as PlanProgress;
    const j = getJournal(prog);
    expect(j[TODAY]?.body).toBe("오늘");
  });

  it("validates entry shape and drops malformed entries", () => {
    const prog = {
      [JOURNAL_KEY]: {
        [TODAY]: { body: "ok", createdAt: "iso" },
        [YESTERDAY]: { /* body missing */ createdAt: "iso" },
        [TWO_DAYS_AGO]: "not an object",
      },
    } as unknown as PlanProgress;
    const j = getJournal(prog);
    expect(j[TODAY]).toBeDefined();
    expect(j[YESTERDAY]).toBeUndefined();
    expect(j[TWO_DAYS_AGO]).toBeUndefined();
  });

  it("preserves mood when present, drops mood when not a number", () => {
    const prog = {
      [JOURNAL_KEY]: {
        a: { body: "with mood", mood: 4, createdAt: "iso" },
        b: { body: "bad mood", mood: "five" as unknown as number, createdAt: "iso" },
      },
    } as unknown as PlanProgress;
    const j = getJournal(prog);
    expect(j.a.mood).toBe(4);
    expect(j.b.mood).toBeUndefined();
  });
});

describe("upsertJournalEntry()", () => {
  it("creates a new entry on a date with no existing entry", () => {
    const next = upsertJournalEntry({}, TODAY, { body: "new" });
    const j = getJournal(next);
    expect(j[TODAY]?.body).toBe("new");
    expect(j[TODAY]?.createdAt).toBeTruthy();
    expect(j[TODAY]?.updatedAt).toBeTruthy();
  });

  it("returns a new object (pure — does not mutate input)", () => {
    const prog: PlanProgress = {};
    const next = upsertJournalEntry(prog, TODAY, { body: "x" });
    expect(next).not.toBe(prog);
    expect(prog).toEqual({}); // original unchanged
  });

  it("preserves existing action progress when adding a journal entry", () => {
    const prog: PlanProgress = {
      week_1: { done: true, note: "review", updatedAt: "iso" },
    };
    const next = upsertJournalEntry(prog, TODAY, { body: "j" });
    expect((next as Record<string, unknown>).week_1).toEqual(prog.week_1);
    expect(getJournal(next)[TODAY]?.body).toBe("j");
  });

  it("preserves createdAt when updating an existing entry", async () => {
    const t1 = upsertJournalEntry({}, TODAY, { body: "first" });
    const created = getJournal(t1)[TODAY]?.createdAt;
    // Small delay so the new ISO timestamp differs.
    await new Promise((r) => setTimeout(r, 5));
    const t2 = upsertJournalEntry(t1, TODAY, { body: "edited" });
    const j = getJournal(t2);
    expect(j[TODAY]?.body).toBe("edited");
    expect(j[TODAY]?.createdAt).toBe(created); // unchanged
  });

  it("stores mood when provided", () => {
    const next = upsertJournalEntry({}, TODAY, { body: "ok", mood: 5 });
    expect(getJournal(next)[TODAY]?.mood).toBe(5);
  });
});

describe("removeJournalEntry()", () => {
  it("returns unchanged progress when the date is not present", () => {
    const prog: PlanProgress = {};
    const next = removeJournalEntry(prog, TODAY);
    expect(next).toBe(prog); // same reference (no copy needed)
  });

  it("removes an existing entry from the journal", () => {
    const p1 = upsertJournalEntry({}, TODAY, { body: "x" });
    const p2 = removeJournalEntry(p1, TODAY);
    expect(getJournal(p2)[TODAY]).toBeUndefined();
  });

  it("does not affect other dates", () => {
    const p1 = upsertJournalEntry({}, TODAY, { body: "today" });
    const p2 = upsertJournalEntry(p1, YESTERDAY, { body: "yesterday" });
    const p3 = removeJournalEntry(p2, TODAY);
    const j = getJournal(p3);
    expect(j[TODAY]).toBeUndefined();
    expect(j[YESTERDAY]?.body).toBe("yesterday");
  });
});

describe("computeStreak()", () => {
  function makeJ(...dates: string[]): Journal {
    const j: Journal = {};
    for (const d of dates) j[d] = { body: "x", createdAt: "iso" };
    return j;
  }

  it("returns 0 for an empty journal", () => {
    expect(computeStreak({}, TODAY)).toBe(0);
  });

  it("returns 1 when only today is written", () => {
    expect(computeStreak(makeJ(TODAY), TODAY)).toBe(1);
  });

  it("returns 2 when today + yesterday are written", () => {
    expect(computeStreak(makeJ(TODAY, YESTERDAY), TODAY)).toBe(2);
  });

  it("keeps streak alive when today is missing but yesterday is written", () => {
    // Important UX: visiting late at night before writing should still show streak.
    expect(computeStreak(makeJ(YESTERDAY), TODAY)).toBe(1);
    expect(computeStreak(makeJ(YESTERDAY, TWO_DAYS_AGO), TODAY)).toBe(2);
  });

  it("returns 0 when the most recent entry is two days ago (gap broken)", () => {
    expect(computeStreak(makeJ(TWO_DAYS_AGO), TODAY)).toBe(0);
    expect(computeStreak(makeJ(TWO_DAYS_AGO, THREE_DAYS_AGO), TODAY)).toBe(0);
  });

  it("only counts the trailing consecutive run, not the longest run", () => {
    // Suppose user wrote 3 days in a row, took a 2-day break, then 1 day.
    // The current streak should be 1 (the trailing run), not 3.
    const j = makeJ(
      TODAY,
      "2026-05-23", // 4 days ago — start of older run
      "2026-05-22",
      "2026-05-21",
    );
    expect(computeStreak(j, TODAY)).toBe(1);
  });

  it("counts 5 consecutive days ending today", () => {
    const j = makeJ(
      TODAY,
      YESTERDAY,
      TWO_DAYS_AGO,
      THREE_DAYS_AGO,
      "2026-05-23",
    );
    expect(computeStreak(j, TODAY)).toBe(5);
  });
});

describe("daysSinceLastEntry()", () => {
  it("returns null when the journal is empty", () => {
    expect(daysSinceLastEntry({}, TODAY)).toBeNull();
  });

  it("returns 0 when today has an entry", () => {
    const j = { [TODAY]: { body: "x", createdAt: "iso" } };
    expect(daysSinceLastEntry(j, TODAY)).toBe(0);
  });

  it("returns 1 when yesterday is the latest", () => {
    const j = { [YESTERDAY]: { body: "x", createdAt: "iso" } };
    expect(daysSinceLastEntry(j, TODAY)).toBe(1);
  });

  it("returns the correct gap when latest is several days ago", () => {
    const j = {
      [THREE_DAYS_AGO]: { body: "x", createdAt: "iso" },
      "2026-05-22": { body: "x", createdAt: "iso" }, // 5 days ago
    };
    expect(daysSinceLastEntry(j, TODAY)).toBe(3); // most recent is THREE_DAYS_AGO
  });

  it("identifies the nudge threshold (> 1 day) correctly", () => {
    // The UI shows the nudge banner when lastGapDays > 1.
    const fresh = { [YESTERDAY]: { body: "x", createdAt: "iso" } };
    const stale = { [TWO_DAYS_AGO]: { body: "x", createdAt: "iso" } };
    expect((daysSinceLastEntry(fresh, TODAY) ?? 0) > 1).toBe(false);
    expect((daysSinceLastEntry(stale, TODAY) ?? 0) > 1).toBe(true);
  });
});
