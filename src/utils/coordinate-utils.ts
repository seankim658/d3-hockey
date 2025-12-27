import { NHL_COORDS, RINK_DIMENSIONS } from "../constants";
import type { NHLCoordinate, SVGCoordinate, RenderDimensions } from "../types";

/**
 * Transform NHL API coordinates to SVG coordinates
 * NHL uses center-origin: (0,0) at center ice, x: [-100, 100], y: [-42.5, 42.5]
 * SVG uses top-left origin: (0,0) at top-left corner
 *
 * @param nhlCoord - Coordinate in NHL API format
 * @param dimensions - Rendering dimensions with scale factor
 * @returns Coordinate in SVG space
 */
export function nhlToSVG(
  nhlCoord: NHLCoordinate,
  dimensions: RenderDimensions,
): SVGCoordinate {
  const { scale, padding } = dimensions;

  // Translate from center-origin to top-left origin
  // NHL X runs from -100 to 100, so add 100 to make it 0 to 200
  // NHL Y runs from -42.5 to 42.5, but we need to flip it (SVG Y increases downward)
  const x = (nhlCoord.x + NHL_COORDS.MAX_X) * scale + padding;
  const y = (NHL_COORDS.MAX_Y - nhlCoord.y) * scale + padding;

  return { x, y };
}

/**
 * Transform SVG coordinates back to NHL API coordinates
 * Useful for interactive features and reverse mapping
 *
 * @param svgCoord - Coordinate in SVG space
 * @param dimensions - Rendering dimensions with scale factor
 * @returns Coordinate in NHL API format
 */
export function svgToNHL(
  svgCoord: SVGCoordinate,
  dimensions: RenderDimensions,
): NHLCoordinate {
  const { scale, padding } = dimensions;

  // Reverse the transformation
  const x = (svgCoord.x - padding) / scale - NHL_COORDS.MAX_X;
  const y = NHL_COORDS.MAX_Y - (svgCoord.y - padding) / scale;

  return { x, y };
}

/**
 * Flip coordinates based on period
 *
 * @param coord - NHL API coordinate
 * @param period - Period number (1, 2, 3, etc.)
 * @param flipOddPeriods - Whether to flip coordinates in odd periods (default: false)
 * @returns Flipped coordinate if necessary
 */
export function flipCoordinatesByPeriod(
  coord: NHLCoordinate,
  period: number,
  flipOddPeriods: boolean = false,
): NHLCoordinate {
  // Determine if we should flip based on period
  const shouldFlip = flipOddPeriods ? period % 2 === 1 : period % 2 === 0;

  if (!shouldFlip) {
    return coord;
  }

  return {
    x: -coord.x,
    y: -coord.y,
  };
}

/**
 * Normalize coordinate to offensive zone (positive x)
 * Useful for half-rink visualizations where all shots should appear
 * on the same side regardless of which period they occurred in.
 *
 * @param coord - NHL API coordinate
 * @returns Coordinate with x always positive (offensive zone)
 */
export function normalizeToOffensiveZone(coord: NHLCoordinate): NHLCoordinate {
  if (coord.x < 0) {
    return {
      x: -coord.x,
      y: -coord.y,
    };
  }
  return coord;
}

/**
 * Normalize coordinate to defensive zone (negative x)
 * For visualizations from the goalie's perspective.
 *
 * @param coord - NHL API coordinate
 * @returns Coordinate with x always negative (defensive zone)
 */
export function normalizeToDefensiveZone(coord: NHLCoordinate): NHLCoordinate {
  if (coord.x > 0) {
    return {
      x: -coord.x,
      y: -coord.y,
    };
  }
  return coord;
}

/**
 * Normalize coordinate to ensure it's within rink bounds
 * Useful for handling edge cases and data validation
 *
 * @param coord - NHL API coordinate
 * @returns Clamped coordinate within valid rink bounds
 */
export function normalizeCoordinate(coord: NHLCoordinate): NHLCoordinate {
  return {
    x: Math.max(NHL_COORDS.MIN_X, Math.min(NHL_COORDS.MAX_X, coord.x)),
    y: Math.max(NHL_COORDS.MIN_Y, Math.min(NHL_COORDS.MAX_Y, coord.y)),
  };
}

/**
 * Calculate the scale factor for rendering
 * Determines how many pixels represent one foot on the rink
 *
 * @param width - SVG width in pixels
 * @param height - SVG height in pixels
 * @param padding - Padding in pixels
 * @param halfRink - Whether rendering half rink
 * @param vertical - Whether rendering in vertical orientation
 * @returns Object with scale factor and adjusted dimensions
 */
export function calculateScale(
  width: number,
  height: number,
  padding: number,
  halfRink: boolean = false,
  vertical: boolean = false,
): RenderDimensions {
  const availableWidth = width - 2 * padding;
  const availableHeight = height - 2 * padding;

  const rinkLength = halfRink
    ? RINK_DIMENSIONS.LENGTH / 2
    : RINK_DIMENSIONS.LENGTH;
  const rinkWidth = RINK_DIMENSIONS.WIDTH;

  // For vertical orientation, swap the dimensions we're fitting
  const targetWidth = vertical ? rinkWidth : rinkLength;
  const targetHeight = vertical ? rinkLength : rinkWidth;

  // Calculate scale to fit rink in available space
  const scaleX = availableWidth / targetWidth;
  const scaleY = availableHeight / targetHeight;

  const scale = Math.min(scaleX, scaleY);

  return {
    width,
    height,
    padding,
    scale,
  };
}

/**
 * Get the distance between two NHL coordinates
 * Useful for proximity calculations, clustering, etc.
 *
 * @param coord1 - First coordinate
 * @param coord2 - Second coordinate
 * @returns Euclidean distance in feet
 */
export function getDistance(
  coord1: NHLCoordinate,
  coord2: NHLCoordinate,
): number {
  const dx = coord2.x - coord1.x;
  const dy = coord2.y - coord1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Determine which zone a coordinate is in
 *
 * @param coord - NHL API coordinate
 * @param offensiveZonePositive - Whether positive X is offensive zone
 * @returns Zone identifier
 */
export function getZone(
  coord: NHLCoordinate,
  offensiveZonePositive: boolean = true,
): "offensive" | "defensive" | "neutral" {
  const threshold = 25; // Blue line is at ±25 feet from center

  if (offensiveZonePositive) {
    if (coord.x > threshold) return "offensive";
    if (coord.x < -threshold) return "defensive";
  } else {
    if (coord.x < -threshold) return "offensive";
    if (coord.x > threshold) return "defensive";
  }

  return "neutral";
}

/**
 * Check if a coordinate is within a specified zone
 *
 * @param coord - NHL API coordinate
 * @param zone - Zone to check
 * @param offensiveZonePositive - Whether positive X is offensive zone
 * @returns True if coordinate is in the specified zone
 */
export function isInZone(
  coord: NHLCoordinate,
  zone: "offensive" | "defensive" | "neutral",
  offensiveZonePositive: boolean = true,
): boolean {
  return getZone(coord, offensiveZonePositive) === zone;
}

/**
 * Get the distance to the nearest goal
 *
 * @param coord - NHL API coordinate
 * @returns Distance to the nearest goal in feet
 */
export function getDistanceToNearestGoal(coord: NHLCoordinate): number {
  const goalX = NHL_COORDS.MAX_X - RINK_DIMENSIONS.GOAL_LINE_OFFSET; // 89 feet

  const distanceToRight = getDistance(coord, { x: goalX, y: 0 });
  const distanceToLeft = getDistance(coord, { x: -goalX, y: 0 });

  return Math.min(distanceToRight, distanceToLeft);
}

/**
 * Get the angle to the goal from a coordinate
 *
 * @param coord - NHL API coordinate
 * @param toOffensiveGoal - Whether to calculate angle to offensive goal (positive x)
 * @returns Angle in degrees (0 = straight on, 90 = from the side)
 */
export function getAngleToGoal(
  coord: NHLCoordinate,
  toOffensiveGoal: boolean = true,
): number {
  const goalX = NHL_COORDS.MAX_X - RINK_DIMENSIONS.GOAL_LINE_OFFSET; // 89 feet
  const targetX = toOffensiveGoal ? goalX : -goalX;

  const dx = targetX - coord.x;
  const dy = coord.y; // Goal is at y=0

  // Calculate angle from the horizontal axis
  const angleRad = Math.atan2(Math.abs(dy), Math.abs(dx));
  const angleDeg = angleRad * (180 / Math.PI);

  return angleDeg;
}

/**
 * Check if a coordinate is within the rink bounds
 *
 * @param coord - NHL API coordinate
 * @returns True if coordinate is within valid rink bounds
 */
export function isWithinRink(coord: NHLCoordinate): boolean {
  return (
    coord.x >= NHL_COORDS.MIN_X &&
    coord.x <= NHL_COORDS.MAX_X &&
    coord.y >= NHL_COORDS.MIN_Y &&
    coord.y <= NHL_COORDS.MAX_Y
  );
}

/**
 * Check if a coordinate is visible in the half rink view
 *
 * @param coord - NHL API coordinate
 * @param halfRinkEnd - Which end is being displayed
 * @param buffer - Buffer zone around center ice (default: 5 feet)
 * @returns True if coordinate would be visible
 */
export function isVisibleInHalfRink(
  coord: NHLCoordinate,
  halfRinkEnd: "offensive" | "defensive",
  buffer: number = 5,
): boolean {
  if (halfRinkEnd === "offensive") {
    return coord.x >= -buffer;
  } else {
    return coord.x <= buffer;
  }
}
