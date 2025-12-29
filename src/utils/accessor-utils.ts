import type { Accessor } from "../types";

/**
 * Default X coordinate accessor
 */
export function defaultXAccessor<T>(d: T): number {
  if (d && typeof d === "object") {
    const obj = d as Record<string, unknown>;

    // NHL API format: { details: { xCoord: number } }
    if ("details" in obj && obj.details && typeof obj.details === "object") {
      const details = obj.details as Record<string, unknown>;
      if ("xCoord" in details && typeof details.xCoord === "number") {
        return details.xCoord;
      }
    }

    // Flat format: { x: number }
    if ("x" in obj && typeof obj.x === "number") {
      return obj.x;
    }

    // HockeyEvent format: { coordinates: { x: number } }
    if (
      "coordinates" in obj &&
      obj.coordinates &&
      typeof obj.coordinates === "object"
    ) {
      const coords = obj.coordinates as Record<string, unknown>;
      if ("x" in coords && typeof coords.x === "number") {
        return coords.x;
      }
    }
  }
  throw new Error("Cannot extract x coordinate from data point");
}

/**
 * Default Y coordinate accessor
 */
export function defaultYAccessor<T>(d: T): number {
  if (d && typeof d === "object") {
    const obj = d as Record<string, unknown>;

    // NHL API format: { details: { yCoord: number } }
    if ("details" in obj && obj.details && typeof obj.details === "object") {
      const details = obj.details as Record<string, unknown>;
      if ("yCoord" in details && typeof details.yCoord === "number") {
        return details.yCoord;
      }
    }

    // Flat format: { y: number }
    if ("y" in obj && typeof obj.y === "number") {
      return obj.y;
    }

    // HockeyEvent format: { coordinates: { y: number } }
    if (
      "coordinates" in obj &&
      obj.coordinates &&
      typeof obj.coordinates === "object"
    ) {
      const coords = obj.coordinates as Record<string, unknown>;
      if ("y" in coords && typeof coords.y === "number") {
        return coords.y;
      }
    }
  }
  throw new Error("Cannot extract y coordinate from data point");
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
