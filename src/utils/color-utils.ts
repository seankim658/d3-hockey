import * as d3 from "d3";
import { Accessor } from "../types";
import { extractNumericValue, extractStringValue } from "./accessor-utils";

/**
 * NHL team colors (32 teams as of 2024-25 season)
 * From: https://teamcolorcodes.com/nhl-team-color-codes/
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

export interface TeamColors {
  primary: string;
  secondary: string;
  accent: string;
}

/**
 * Get team colors by abbreviation
 */
export function getTeamColors(teamAbbr: string): TeamColors | null {
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
  heatmap: d3.scaleSequential(interpolateHeatmapVibrant).domain([1, 0]),

  // Performance (bad to good)
  performance: d3.scaleSequential(d3.interpolateRdYlGn).domain([0, 1]),

  // Diverging (centered at 0)
  diverging: d3.scaleDiverging(d3.interpolateRdBu).domain([-1, 0, 1]),

  // Ice-themed cool colors (for subtle overlays)
  ice: d3.scaleSequential(d3.interpolateBlues).domain([0, 1]),

  // Fire/danger theme (orange to deep red)
  fire: d3.scaleSequential(d3.interpolateOrRd).domain([0, 1]),

  // Plasma (good for colorblind accessibility)
  plasma: d3.scaleSequential(d3.interpolatePlasma).domain([0, 1]),

  // Viridis (good for colorblind accessibility)
  viridis: d3.scaleSequential(d3.interpolateViridis).domain([0, 1]),
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

/**
 * Type for built-in color scale names
 */
export type ColorScaleName = keyof typeof HOCKEY_COLOR_SCALES;

/**
 * Options for property-based color scaling
 */
export interface ColorByPropertyOptions {
  // Use a built-in scale name
  scale?: ColorScaleName;
  // Or provide a custom D3 color scale
  customScale?: d3.ScaleSequential<string> | d3.ScaleDiverging<string>;
  // Input domain (required if using customScale without a preset domain)
  domain?: [number, number] | [number, number, number];
  // Fallback color if value is invalid
  fallback?: string;
}

/**
 * Create a color accessor based on a data property
 * Uses built-in hockey color scales or custom scales
 */
export function colorByProperty<TData>(
  property: string | Accessor<TData, number>,
  options: ColorByPropertyOptions = {},
): Accessor<TData, string> {
  const {
    scale: scaleName,
    customScale,
    domain,
    fallback = "#cccccc",
  } = options;

  // Determine which scale to use
  let colorScale: d3.ScaleSequential<string> | d3.ScaleDiverging<string>;

  if (customScale) {
    colorScale = customScale;
    if (domain) {
      colorScale = applyDomainToScale(colorScale, domain);
    }
  } else if (scaleName) {
    colorScale = HOCKEY_COLOR_SCALES[scaleName];
    if (domain) {
      colorScale = applyDomainToScale(colorScale.copy(), domain);
    }
  } else {
    // Default to shot quality scale
    colorScale = HOCKEY_COLOR_SCALES.shotQuality;
    if (domain) {
      colorScale = applyDomainToScale(colorScale.copy(), domain);
    }
  }

  return (d: TData, i: number): string => {
    const value = extractNumericValue(d, property, i);
    if (value === undefined || isNaN(value)) {
      return fallback;
    }

    return colorScale(value);
  };
}

/**
 * Options for team-based coloring
 */
export interface ColorByTeamOptions {
  // Which color type to use (primary, secondary, or accent)
  colorType?: "primary" | "secondary" | "accent";
  // Fallback color if team not found
  fallback?: string;
}

/**
 * Create a color accessor based on team abbreviation
 */
export function colorByTeam<TData>(
  teamProperty: string | Accessor<TData, string> = "team",
  options: ColorByTeamOptions = {},
): Accessor<TData, string> {
  const { colorType = "primary", fallback = "#000000" } = options;

  return (d: TData, i: number): string => {
    const teamAbbr = extractStringValue(d, teamProperty, i);

    if (!teamAbbr) {
      return fallback;
    }

    const colors = getTeamColors(teamAbbr);
    if (!colors) {
      return fallback;
    }

    return colors[colorType];
  };
}

/**
 * Known D3 color schemes that can be used with colorByCategory
 */
type D3ColorScheme =
  | "schemeCategory10"
  | "schemeAccent"
  | "schemeDark2"
  | "schemePaired"
  | "schemePastel1"
  | "schemePastel2"
  | "schemeSet1"
  | "schemeSet2"
  | "schemeSet3"
  | "schemeTableau10";

/**
 * Map of D3 color scheme names to their color arrays
 */
const D3_COLOR_SCHEMES: Record<D3ColorScheme, readonly string[]> = {
  schemeCategory10: d3.schemeCategory10,
  schemeAccent: d3.schemeAccent,
  schemeDark2: d3.schemeDark2,
  schemePaired: d3.schemePaired,
  schemePastel1: d3.schemePastel1,
  schemePastel2: d3.schemePastel2,
  schemeSet1: d3.schemeSet1,
  schemeSet2: d3.schemeSet2,
  schemeSet3: d3.schemeSet3,
  schemeTableau10: d3.schemeTableau10,
};

/**
 * Options for categorical color mapping
 */
export interface ColorByCategoryOptions {
  // Color mapping for categories
  colors?: Record<string, string>;
  // Use D3 categorical scheme
  scheme?: D3ColorScheme;
  // Fallback color
  fallback?: string;
}

/**
 * Create a color accessor based on categorical data
 * ```
 */
export function colorByCategory<TData>(
  property: string | Accessor<TData, string>,
  options: ColorByCategoryOptions = {},
): Accessor<TData, string> {
  const { colors, scheme, fallback = "#cccccc" } = options;

  // Create ordinal scale if using a D3 scheme
  let ordinalScale: d3.ScaleOrdinal<string, string> | null = null;
  if (scheme !== undefined) {
    const schemeColors = D3_COLOR_SCHEMES[scheme];
    if (schemeColors) {
      ordinalScale = d3.scaleOrdinal<string, string>(schemeColors);
    }
  }

  return (d: TData, i: number): string => {
    const category = extractStringValue(d, property, i);
    if (!category) {
      return fallback;
    }

    // Use custom colors first
    if (colors && category in colors) {
      return colors[category];
    }

    // Fall back to ordinal scale
    if (ordinalScale) {
      return ordinalScale(category);
    }

    return fallback;
  };
}

/**
 * Create a color gradient between two colors based on a property
 */
export function colorGradient<TData>(
  property: string | Accessor<TData, number>,
  options: {
    from: string;
    to: string;
    domain?: [number, number];
    fallback?: string;
  },
): Accessor<TData, string> {
  const { from, to, domain = [0, 1], fallback = "#cccccc" } = options;

  const scale = d3
    .scaleLinear<string>()
    .domain(domain)
    .range([from, to])
    .clamp(true);

  return (d: TData, i: number): string => {
    const value = extractNumericValue(d, property, i);
    if (value === undefined || isNaN(value)) {
      return fallback;
    }

    return scale(value);
  };
}

/**
 * Combine multiple color conditions with priority
 * Returns the first matching color function result
 */
export function colorByCondition<TData>(
  conditions: Array<
    [condition: (d: TData) => boolean, color: string | Accessor<TData, string>]
  >,
  fallback: string = "#cccccc",
): Accessor<TData, string> {
  return (d: TData, i: number = 0): string => {
    for (const [condition, color] of conditions) {
      if (condition(d)) {
        return typeof color === "string" ? color : color(d, i);
      }
    }
    return fallback;
  };
}

/**
 * Custom interpolator for vibrant heatmap (green → yellow → orange → red)
 * More visible on white ice than the default RdYlBu scale
 */
function interpolateHeatmapVibrant(t: number): string {
  // Color stops: green → lime → yellow → orange → red
  const colors = [
    { pos: 0.0, r: 0, g: 200, b: 0 }, // Green
    { pos: 0.25, r: 128, g: 255, b: 0 }, // Lime/Yellow-green
    { pos: 0.5, r: 255, g: 255, b: 0 }, // Yellow
    { pos: 0.75, r: 255, g: 128, b: 0 }, // Orange
    { pos: 1.0, r: 255, g: 0, b: 0 }, // Red
  ];

  // Find the two colors to interpolate between
  let lower = colors[0];
  let upper = colors[colors.length - 1];

  for (let i = 0; i < colors.length - 1; i++) {
    if (t >= colors[i].pos && t <= colors[i + 1].pos) {
      lower = colors[i];
      upper = colors[i + 1];
      break;
    }
  }

  // Interpolate between the two colors
  const range = upper.pos - lower.pos;
  const localT = range === 0 ? 0 : (t - lower.pos) / range;

  const r = Math.round(lower.r + (upper.r - lower.r) * localT);
  const g = Math.round(lower.g + (upper.g - lower.g) * localT);
  const b = Math.round(lower.b + (upper.b - lower.b) * localT);

  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Apply a domain to a color scale with proper type handling
 */
function applyDomainToScale(
  scale: d3.ScaleSequential<string> | d3.ScaleDiverging<string>,
  domain: [number, number] | [number, number, number],
): d3.ScaleSequential<string> | d3.ScaleDiverging<string> {
  if (domain.length === 3) {
    return (scale as d3.ScaleDiverging<string>).domain(
      domain as [number, number, number],
    );
  }
  return (scale as d3.ScaleSequential<string>).domain(
    domain as [number, number],
  );
}
