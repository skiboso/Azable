"use client";

import { useMemo, useState } from "react";
import AppSelect from "@/components/molecules/AppSelect";
import { Input } from "@/components/ui/input";
import {
  calculateWaterImpact,
  DEFAULT_SOURCE_TYPE_ID,
  WATER_SOURCE_TYPES,
} from "@/lib/water-impact";

const SOURCE_TYPE_OPTIONS = WATER_SOURCE_TYPES.map((sourceType) => ({
  label: sourceType.label,
  value: sourceType.id,
}));

function formatNumber(value: number, digits = 0): string {
  return value.toLocaleString("en-US", {
    maximumFractionDigits: digits,
  });
}

export function CampaignImpactCalculator() {
  const [sourceTypeId, setSourceTypeId] = useState<string>(DEFAULT_SOURCE_TYPE_ID);
  const [quantity, setQuantity] = useState<string>("10");

  const parsedQuantity = Number.parseInt(quantity, 10);
  const quantityValue = Number.isFinite(parsedQuantity) ? parsedQuantity : 0;

  const result = useMemo(
    () => calculateWaterImpact(sourceTypeId, quantityValue),
    [sourceTypeId, quantityValue],
  );

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-white">
          Campaign Impact Calculator
        </h2>
        <p className="text-sm text-zinc-400">
          Estimate the projected clean-water output of a water-access campaign
          based on source type and quantity. Figures are indicative estimates
          for fully operational sources.
        </p>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <p className="mb-1.5 ml-1 text-xs font-medium uppercase tracking-[0.08em] text-zinc-500">
            Water source type
          </p>
          <AppSelect
            options={SOURCE_TYPE_OPTIONS}
            value={sourceTypeId}
            setValue={setSourceTypeId}
            placeholder="Select a source type"
            className="bg-zinc-900 border-zinc-700 text-white"
          />
        </div>

        <div>
          <label
            htmlFor="water-quantity"
            className="mb-1.5 ml-1 block text-xs font-medium uppercase tracking-[0.08em] text-zinc-500"
          >
            Number of sources
          </label>
          <Input
            id="water-quantity"
            type="number"
            min={0}
            inputMode="numeric"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            className="bg-zinc-900 border-zinc-700 text-white"
          />
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-3">
          <p className="text-xs text-zinc-400">Clean water / year</p>
          <p className="mt-1 text-2xl font-bold text-sky-300">
            {formatNumber(result.litersPerYear)}
          </p>
          <p className="text-xs text-zinc-500">L · {formatNumber(result.cubicMetersPerYear, 2)} m³</p>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-3">
          <p className="text-xs text-zinc-400">Clean water over 10 years</p>
          <p className="mt-1 text-2xl font-bold text-sky-300">
            {formatNumber(result.litersOver10Years)}
          </p>
          <p className="text-xs text-zinc-500">L · {formatNumber(result.cubicMetersOver10Years, 2)} m³</p>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-3">
          <p className="text-xs text-zinc-400">Source type</p>
          <p className="mt-1 text-2xl font-bold text-white">{result.sourceTypeLabel}</p>
          <p className="text-xs text-zinc-500">
            {result.quantity} sources · {result.litersPerDayPerSource} L/day/source
          </p>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-3">
          <p className="text-xs text-zinc-400">≈ People served / day</p>
          <p className="mt-1 text-2xl font-bold text-white">
            {formatNumber(result.peopleServedPerDay)}
          </p>
          <p className="text-xs text-zinc-500">at WHO minimum 20 L/person/day</p>
        </div>
      </div>
    </section>
  );
}

export default CampaignImpactCalculator;
