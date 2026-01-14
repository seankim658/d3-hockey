import type { Accessor } from "../types";

function extractCoordinate<T>(
  d: T,
  coord: "x" | "y",
  nhlCoord: "xCoord" | "yCoord",
): number {
  if (d && typeof d === "object") {
    const obj = d as Record<string, unknown>;

    // NHL format: { details: { xCoord: number, yCoord: number } }
    if ("details" in obj && obj.details && typeof obj.details === "object") {
      const details = obj.details as Record<string, unknown>;
      if (nhlCoord in details && typeof details[nhlCoord] === "number") {
        return details[nhlCoord] as number;
      }
    }

    // Flat format: { x: number, y: number }
    if (coord in obj && typeof obj[coord] === "number") {
      return obj[coord] as number;
    }

    // HockeyEvent format: { coordinates: { x: number, y: number } }
    if (
      "coordinates" in obj &&
      obj.coordinates &&
      typeof obj.coordinates === "object"
    ) {
      const coords = obj.coordinates as Record<string, unknown>;
      if (coord in coords && typeof coords[coord] === "number") {
        return coords[coord] as number;
      }
    }
  }
  throw new Error(`Cannot extract ${coord} coordinate from data point`);
}

/**
 * Default X coordinate accessor
 */
export function defaultXAccessor<T>(d: T): number {
  return extractCoordinate(d, "x", "xCoord");
}

/**
 * Default Y coordinate accessor
 */
export function defaultYAccessor<T>(d: T): number {
  return extractCoordinate(d, "y", "yCoord");
}

/**
 * Default event type accessor
 */
export function defaultEventTypeAccessor<T>(d: T): string | null {
  if (!d || typeof d !== "object") return null;

  const obj = d as Record<string, unknown>;

  if (typeof obj.typeDescKey === "string") return obj.typeDescKey;
  if (typeof obj.type === "string") return obj.type;
  if (typeof obj.eventType === "string") return obj.eventType;
  if (typeof obj.event === "string") return obj.event;

  return null;
}

/**
 * Safely extract a numeric value from data using a property name or accessor function
 */
export function extractNumericValue<TData>(
  d: TData,
  property: string | Accessor<TData, number>,
  index: number = 0,
): number | undefined {
  if (typeof property === "function") {
    return property(d, index);
  }

  if (d !== null && typeof d === "object") {
    const value = (d as Record<string, unknown>)[property];
    if (typeof value === "number") {
      return value;
    }
  }

  return undefined;
}

/**
 * Safely extract a string value from data using a property name or accessor function
 */
export function extractStringValue<TData>(
  d: TData,
  property: string | Accessor<TData, string>,
  index: number = 0,
): string | undefined {
  if (typeof property === "function") {
    return property(d, index);
  }

  if (d !== null && typeof d === "object") {
    const value = (d as Record<string, unknown>)[property];
    if (typeof value === "string") {
      return value;
    }
  }

  return undefined;
}
