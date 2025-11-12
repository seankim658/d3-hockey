/**
 * Color utilities for hockey visualizations
 * Includes NHL team colors and color scale helpers
 */

import * as d3 from "d3";

/**
 * NHL team colors (32 teams as of 2024-25 season)
 */
export const NHL_TEAM_COLORS = {
  ANA: { primary: "#F47A38", secondary: "#B9975B", accent: "#000000" },
  ARI: { primary: "#8C2633", secondary: "#E2D6B5", accent: "#000000" },
  BOS: { primary: "#FFB81C", secondary: "#000000", accent: "#FFFFFF" },
  BUF: { primary: "#002654", secondary: "#FCB514", accent: "#FFFFFF" },
  CAR: { primary: "#CC0000", secondary: "#000000", accent: "#A2AAAD" },
  CBJ: { primary: "#002654", secondary: "#CE1126", accent: "#A4A9AD" },
  CGY: { primary: "#D2001C", secondary: "#F1BE48", accent: "#000000" },
  CHI: { primary: "#CF0A2C", secondary: "#000000", accent: "#FF671B" },
  COL: { primary: "#6F263D", secondary: "#236192", accent: "#A2AAAD" },
  DAL: { primary: "#006847", secondary: "#8F8F8C", accent: "#000000" },
  DET: { primary: "#CE1126", secondary: "#FFFFFF", accent: "#000000" },
  EDM: { primary: "#041E42", secondary: "#FF4C00", accent: "#FFFFFF" },
  FLA: { primary: "#041E42", secondary: "#C8102E", accent: "#B9975B" },
  LAK: { primary: "#111111", secondary: "#A2AAAD", accent: "#FFFFFF" },
  MIN: { primary: "#154734", secondary: "#DDCBA4", accent: "#A6192E" },
  MTL: { primary: "#AF1E2D", secondary: "#192168", accent: "#FFFFFF" },
  NJD: { primary: "#CE1126", secondary: "#000000", accent: "#FFFFFF" },
  NSH: { primary: "#FFB81C", secondary: "#041E42", accent: "#FFFFFF" },
  NYI: { primary: "#00539B", secondary: "#F47D30", accent: "#FFFFFF" },
  NYR: { primary: "#0038A8", secondary: "#CE1126", accent: "#FFFFFF" },
  OTT: { primary: "#C52032", secondary: "#C2912C", accent: "#000000" },
  PHI: { primary: "#F74902", secondary: "#000000", accent: "#FFFFFF" },
  PIT: { primary: "#000000", secondary: "#CFC493", accent: "#FCB514" },
  SEA: { primary: "#001628", secondary: "#99D9D9", accent: "#355464" },
  SJS: { primary: "#006D75", secondary: "#EA7200", accent: "#000000" },
  STL: { primary: "#002F87", secondary: "#FCB514", accent: "#041E42" },
  TBL: { primary: "#002868", secondary: "#FFFFFF", accent: "#000000" },
  TOR: { primary: "#00205B", secondary: "#FFFFFF", accent: "#000000" },
  UTA: { primary: "#69B3E7", secondary: "#000000", accent: "#FFFFFF" },
  VAN: { primary: "#00205B", secondary: "#00843D", accent: "#041C2C" },
  VGK: { primary: "#B4975A", secondary: "#333F42", accent: "#C8102E" },
  WSH: { primary: "#041E42", secondary: "#C8102E", accent: "#FFFFFF" },
  WPG: { primary: "#041E42", secondary: "#004C97", accent: "#AC162C" },
} as const;

/**
 * Get team colors by abbreviation
 */
export function getTeamColors(
  teamAbbr: string,
): { primary: string; secondary: string; accent: string } | null {
  const colors =
    NHL_TEAM_COLORS[teamAbbr.toUpperCase() as keyof typeof NHL_TEAM_COLORS];
  return colors || null;
}

/**
 * Get primary color for a team
 */
export function getTeamPrimaryColor(teamAbbr: string): string {
  return getTeamColors(teamAbbr)?.primary || "#000000";
}

/**
 * Common color scales for hockey visualizations
 */
export const HOCKEY_COLOR_SCALES = {
  // Shot quality (low to high danger)
  shotQuality: d3.scaleSequential(d3.interpolateYlOrRd).domain([0, 1]),

  // Heat map (blue to red)
  heatmap: d3.scaleSequential(d3.interpolateRdYlBu).domain([1, 0]),

  // Performance (bad to good)
  performance: d3.scaleSequential(d3.interpolateRdYlGn).domain([0, 1]),

  // Diverging (centered at 0)
  diverging: d3.scaleDiverging(d3.interpolateRdBu).domain([-1, 0, 1]),
} as const;

/**
 * Create a custom color scale
 */
export function createColorScale(
  domain: [number, number],
  range: [string, string],
): d3.ScaleLinear<string, string> {
  return d3.scaleLinear<string>().domain(domain).range(range);
}

/**
 * Generate color for shot based on result
 */
export function getShotResultColor(result: string): string {
  const colors: Record<string, string> = {
    goal: "#00ff00",
    shot: "#0088ff",
    miss: "#888888",
    block: "#ff6600",
  };
  return colors[result.toLowerCase()] || "#cccccc";
}

/**
 * Generate opacity based on value (0-1 range)
 */
export function getOpacity(
  value: number,
  min: number = 0.2,
  max: number = 1,
): number {
  return Math.max(min, Math.min(max, value));
}
