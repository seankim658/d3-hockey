import { RINK_DIMENSIONS } from "../constants";
import type { HockeyEvent } from "../types";

/**
 * Check if all events have valid coordinates
 * Returns true if ALL events have valid x/y coordinate numbers
 */
export function hasValidCoordinates(data: HockeyEvent[]): boolean {
  return data.every(
    (d) =>
      d.coordinates &&
      typeof d.coordinates.x === "number" &&
      typeof d.coordinates.y === "number" &&
      !isNaN(d.coordinates.x) &&
      !isNaN(d.coordinates.y),
  );
}

/**
 * Filter events to only those with valid coordinates
 * Removes events that have missing, null, or NaN coordinate values
 */
export function validateCoordinates(data: HockeyEvent[]): HockeyEvent[] {
  return data.filter(
    (d) =>
      d.coordinates &&
      typeof d.coordinates.x === "number" &&
      typeof d.coordinates.y === "number" &&
      !isNaN(d.coordinates.x) &&
      !isNaN(d.coordinates.y),
  );
}

/**
 * Filter events by zone
 */
export function filterByZone(
  events: HockeyEvent[],
  zone: "offensive" | "defensive" | "neutral",
): HockeyEvent[] {
  const threshold = RINK_DIMENSIONS.BLUE_LINE_OFFSET; // Blue line at ±25 feet

  return events.filter((event) => {
    const x = event.coordinates.x;

    switch (zone) {
      case "offensive":
        return x > threshold;
      case "defensive":
        return x < -threshold;
      case "neutral":
        return x >= -threshold && x <= threshold;
      default:
        return true;
    }
  });
}

/**
 * Filter events by team
 */
export function filterByTeam(
  events: HockeyEvent[],
  team: string,
): HockeyEvent[] {
  return events.filter((event) => event.team === team);
}

/**
 * Filter events by period
 */
export function filterByPeriod(
  events: HockeyEvent[],
  period: number,
): HockeyEvent[] {
  return events.filter((event) => event.period === period);
}

/**
 * Group events by a property
 */
export function groupBy<T extends Record<string, unknown>>(
  data: T[],
  key: keyof T,
): Map<string | number, T[]> {
  const groups = new Map<string | number, T[]>();

  data.forEach((item) => {
    const groupKey = item[key];
    const keyString = String(groupKey);
    if (!groups.has(keyString)) {
      groups.set(keyString, []);
    }
    groups.get(keyString)!.push(item);
  });

  return groups;
}

/**
 * Calculate basic statistics for a numeric property
 */
export function calculateStats(
  data: HockeyEvent[],
  getValue: (d: HockeyEvent) => number,
): {
  count: number;
  sum: number;
  mean: number;
  min: number;
  max: number;
} {
  if (data.length === 0) {
    return { count: 0, sum: 0, mean: 0, min: 0, max: 0 };
  }

  const values = data.map(getValue);
  const sum = values.reduce((a, b) => a + b, 0);

  return {
    count: data.length,
    sum,
    mean: sum / data.length,
    min: Math.min(...values),
    max: Math.max(...values),
  };
}
