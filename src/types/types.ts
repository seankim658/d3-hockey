/**
 * Core types for d3-hockey library
 */

/**
 * NHL API coordinate point (center-origin system)
 */
export interface NHLCoordinate {
  x: number;
  y: number;
}

/**
 * SVG coordinate point (top-left origin system)
 */
export interface SVGCoordinate {
  x: number;
  y: number;
}

/**
 * Period information for coordinate transformation
 * NHL coordinates flip based on which period and which team's perspective
 */
export interface PeriodInfo {
  period: number;
  isOffensiveZone?: boolean;
}

/**
 * Shot or event data point
 */
export interface HockeyEvent {
  coordinates: NHLCoordinate;
  period?: number;
  type?: string;
  team?: string;
  player?: string;
  id?: string | number;
  [key: string]: unknown;
}

/**
 * Symbol types for event rendering
 */
export type HockeyEventSymbolType =
  | "circle"
  | "cross"
  | "diamond"
  | "square"
  | "star"
  | "triangle"
  | "wye"
  | string; // Custom SVG path

/**
 * Animation easing functions (D3 easing names)
 * See: https://d3js.org/d3-ease
 */
export type AnimationEasing =
  | "easeLinear"
  | "easeQuad"
  | "easeQuadIn"
  | "easeQuadOut"
  | "easeQuadInOut"
  | "easeCubic"
  | "easeCubicIn"
  | "easeCubicOut"
  | "easeCubicInOut"
  | "easePoly"
  | "easePolyIn"
  | "easePolyOut"
  | "easePolyInOut"
  | "easeSin"
  | "easeSinIn"
  | "easeSinOut"
  | "easeSinInOut"
  | "easeExp"
  | "easeExpIn"
  | "easeExpOut"
  | "easeExpInOut"
  | "easeCircle"
  | "easeCircleIn"
  | "easeCircleOut"
  | "easeCircleInOut"
  | "easeElastic"
  | "easeElasticIn"
  | "easeElasticOut"
  | "easeElasticInOut"
  | "easeBack"
  | "easeBackIn"
  | "easeBackOut"
  | "easeBackInOut"
  | "easeBounce"
  | "easeBounceIn"
  | "easeBounceOut"
  | "easeBounceInOut"
  | string; // Any valid D3 easing function name

/**
 * Configuration for rink rendering
 */
export interface RinkConfig {
  // SVG width in pixels
  width?: number;
  // SVG height in pixels
  height?: number;
  // Padding around rink in pixels
  padding?: number;
  // Whether to show full rink or half rink
  halfRink?: boolean;
  // If half rink, which end ('offensive' or 'defensive')
  halfRinkEnd?: "offensive" | "defensive";
  // Whether to rotate rink vertically
  vertical?: boolean;
  // Custom colors override
  colors?: Partial<RinkColors>;
}

/**
 * Color configuration for rink elements
 */
export interface RinkColors {
  ice: string;
  boards: string;
  redLine: string;
  blueLine: string;
  faceoff: string;
  crease: string;
  line: string;
}

/**
 * Dimensions for the rendering space
 */
export interface RenderDimensions {
  width: number;
  height: number;
  padding: number;
  scale: number;
}

/**
 * Layer types available in the library
 */
export type LayerType = "shot" | "heatmap" | "zone" | "path" | "custom";

/**
 * Event handler type for layer interactions
 */
export type LayerEventHandler<T = unknown> = (
  event: MouseEvent,
  data: T,
) => void;

/**
 * Layer event types
 */
export type LayerEventType =
  | "click"
  | "mouseover"
  | "mouseout"
  | "mousemove"
  | "dblclick";
