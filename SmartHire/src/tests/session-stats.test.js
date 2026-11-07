import { describe, expect, test } from "vitest";
import { computeStreak } from "../utils/sessionStats";

const at = (daysAgo, now) => {
  const d = new Date(now);
  d.setDate(d.getDate() - daysAgo);
  return { createdAt: d.toISOString() };
};

describe("computeStreak", () => {
  const now = new Date("2026-11-07T12:00:00");

  test("counts consecutive days ending today", () => {
    expect(computeStreak([at(0, now), at(1, now), at(2, now), at(4, now)], now)).toBe(3);
  });

  test("still counts a streak that ended yesterday", () => {
    expect(computeStreak([at(1, now), at(2, now)], now)).toBe(2);
  });

  test("returns 0 when the last session is older than yesterday", () => {
    expect(computeStreak([at(3, now)], now)).toBe(0);
    expect(computeStreak([], now)).toBe(0);
  });
});
