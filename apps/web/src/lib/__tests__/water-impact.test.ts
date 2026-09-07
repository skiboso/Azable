import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  calculateWaterImpact,
  DEFAULT_SOURCE_TYPE_ID,
  getWaterSourceType,
  WATER_SOURCE_TYPES,
} from "../water-impact";

describe("WATER_SOURCE_TYPES", () => {
  it("exposes a non-empty list with unique ids", () => {
    expect(WATER_SOURCE_TYPES.length).toBeGreaterThan(0);
    const ids = WATER_SOURCE_TYPES.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("returns the default source type for an unknown id", () => {
    const sourceType = getWaterSourceType("not-a-source-type");
    expect(sourceType.id).toBe(DEFAULT_SOURCE_TYPE_ID);
  });
});

describe("calculateWaterImpact", () => {
  // Pin to a non-rainy-season date (January) so the 2x seasonal yield
  // multiplier doesn't make these assertions flaky depending on what month
  // the suite happens to run in — pass no date arg below to exercise that
  // default-to-`new Date()` path against a known-fixed "now".
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15T00:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("computes daily, annual, and 10-year projections from source type and quantity", () => {
    const result = calculateWaterImpact("hand-pump-well", 10);
    expect(result.quantity).toBe(10);
    expect(result.litersPerDay).toBe(15_000); // 10 * 1,500
    expect(result.litersPerYear).toBe(5_475_000); // 15,000 * 365
    expect(result.cubicMetersPerYear).toBeCloseTo(5_475);
    expect(result.litersOver10Years).toBe(54_750_000);
    expect(result.cubicMetersOver10Years).toBeCloseTo(54_750);
  });

  it("uses the selected source type's output rate", () => {
    const borehole = calculateWaterImpact("solar-borehole", 1);
    const handPump = calculateWaterImpact("hand-pump-well", 1);
    expect(borehole.litersPerYear).toBeGreaterThan(handPump.litersPerYear);
  });

  it("clamps zero and negative quantities to zero", () => {
    expect(calculateWaterImpact("hand-pump-well", 0).litersPerYear).toBe(0);
    expect(calculateWaterImpact("hand-pump-well", -5).litersPerYear).toBe(0);
  });

  it("provides a people-served equivalence for the daily figure", () => {
    const result = calculateWaterImpact("hand-pump-well", 10);
    // 15,000 L/day / 20 L per person (WHO minimum) = 750 people/day
    expect(result.peopleServedPerDay).toBe(750);
  });

  it("applies a 2x yield multiplier during rainy season (May-October)", () => {
    const result = calculateWaterImpact("hand-pump-well", 10, new Date("2026-06-15"));
    expect(result.yieldMultiplier).toBe(2);
    expect(result.litersPerDay).toBe(30_000);
  });
});
