export interface WaterSourceType {
  id: string;
  label: string;
  litersPerDay: number;
}

export const WATER_SOURCE_TYPES: WaterSourceType[] = [
  { id: "hand-pump-well", label: "Hand-Pump Well", litersPerDay: 1_500 },
  { id: "solar-borehole", label: "Solar-Powered Borehole", litersPerDay: 3_000 },
  { id: "rainwater-harvesting", label: "Rainwater Harvesting System", litersPerDay: 800 },
  { id: "community-tap-stand", label: "Community Tap Stand", litersPerDay: 2_000 },
  { id: "sand-dam", label: "Sand Dam", litersPerDay: 1_200 },
  { id: "spring-protection", label: "Protected Spring", litersPerDay: 1_000 },
  { id: "biosand-filter", label: "Biosand Filter Station", litersPerDay: 600 },
  { id: "piped-connection", label: "Piped Water Connection", litersPerDay: 2_500 },
];

export const DEFAULT_SOURCE_TYPE_ID = WATER_SOURCE_TYPES[0].id;

// WHO minimum recommended water supply per person per day, used as the
// reference unit for "people served" equivalence figures.
const WHO_MIN_LITERS_PER_PERSON_PER_DAY = 20;

export function getWaterSourceType(id: string): WaterSourceType {
  return WATER_SOURCE_TYPES.find((s) => s.id === id) ?? WATER_SOURCE_TYPES[0];
}

export interface WaterImpactResult {
  sourceTypeId: string;
  sourceTypeLabel: string;
  litersPerDayPerSource: number;
  quantity: number;
  yieldMultiplier: number;
  litersPerDay: number;
  litersPerYear: number;
  cubicMetersPerYear: number;
  litersOver10Years: number;
  cubicMetersOver10Years: number;
  peopleServedPerDay: number;
}

/**
 * Helper to determine if a given date/timestamp falls within rainy season (May - October).
 * (issue #714)
 */
export function isRainySeason(dateOrTimestamp?: Date | number): boolean {
  const date = dateOrTimestamp
    ? typeof dateOrTimestamp === "number"
      ? new Date(dateOrTimestamp * 1000)
      : dateOrTimestamp
    : new Date();
  const month = date.getMonth() + 1; // 1-indexed (1=Jan, 5=May, 10=Oct)
  return month >= 5 && month <= 10;
}

/**
 * Compute the projected clean-water output for a campaign, applying a 2x
 * yield bonus for campaigns created during the rainy season (May-October) —
 * groundwater recharge and rainwater catchment both genuinely increase
 * during this window. (issue #714)
 *
 * @param sourceTypeId - selected water source type id
 * @param quantity - number of water sources installed (>= 0)
 * @returns the projected daily/annual water output plus a rough
 *          people-served equivalence for the daily figure
 */
export function calculateWaterImpact(
  sourceTypeId: string,
  quantity: number,
  dateOrTimestamp?: Date | number,
): WaterImpactResult {
  const sourceType = getWaterSourceType(sourceTypeId);
  const qty = Math.max(0, Math.floor(quantity) || 0);

  const rainySeason = isRainySeason(dateOrTimestamp);
  const yieldMultiplier = rainySeason ? 2 : 1;

  const baseLitersPerDay = qty * sourceType.litersPerDay;
  const litersPerDay = baseLitersPerDay * yieldMultiplier;
  const litersPerYear = litersPerDay * 365;
  const litersOver10Years = litersPerYear * 10;

  return {
    sourceTypeId: sourceType.id,
    sourceTypeLabel: sourceType.label,
    litersPerDayPerSource: sourceType.litersPerDay,
    quantity: qty,
    yieldMultiplier,
    litersPerDay,
    litersPerYear,
    cubicMetersPerYear: litersPerYear / 1000,
    litersOver10Years,
    cubicMetersOver10Years: litersOver10Years / 1000,
    peopleServedPerDay: Math.round(litersPerDay / WHO_MIN_LITERS_PER_PERSON_PER_DAY),
  };
}
