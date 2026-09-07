import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CampaignImpactCalculator } from "./CampaignImpactCalculator";

describe("CampaignImpactCalculator", () => {
  beforeEach(() => {
    // Pin to a non-rainy-season date (January) so the 2x seasonal yield
    // multiplier in lib/water-impact.ts doesn't make these assertions
    // flaky depending on what month the suite happens to run in.
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15T00:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the calculator header", () => {
    render(<CampaignImpactCalculator />);
    expect(
      screen.getByRole("heading", { name: /campaign impact calculator/i }),
    ).toBeDefined();
  });

  it("defaults to a hand-pump well with 10 sources and shows the projected output", () => {
    render(<CampaignImpactCalculator />);
    // Hand-pump well = 1,500 L/day/source × 10 sources × 365 days = 5,475,000 L/year.
    expect(screen.getByText("5,475,000")).toBeDefined();
  });

  it("updates the projection when the quantity changes", () => {
    render(<CampaignImpactCalculator />);
    const input = screen.getByLabelText(/number of sources/i);
    fireEvent.change(input, { target: { value: "100" } });
    // Hand-pump well = 1,500 L/day/source × 100 sources × 365 days = 54,750,000 L/year.
    expect(screen.getByText("54,750,000")).toBeDefined();
  });

  it("clamps an empty or invalid quantity to zero", () => {
    render(<CampaignImpactCalculator />);
    const input = screen.getByLabelText(/number of sources/i);
    fireEvent.change(input, { target: { value: "" } });
    // With zero sources every metric card shows 0.
    expect(screen.getAllByText("0").length).toBeGreaterThan(0);
  });
});
