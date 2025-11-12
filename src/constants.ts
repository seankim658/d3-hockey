/**
 * NHL Rink Dimensions and Specifications
 * All measurements in feet unless otherwise specified
 * Based on official NHL rulebook
 */

export const RINK_DIMENSIONS = {
  // Total rink length
  LENGTH: 200,
  // Total rink width
  WIDTH: 85,
  // Corner radius
  CORNER_RADIUS: 28,
  // Distance from goal line to end boards
  GOAL_LINE_OFFSET: 11,
  // Blue line distance from center
  BLUE_LINE_OFFSET: 25,
  // Center circle radius
  CENTER_CIRCLE_RADIUS: 15,
  // Faceoff circle radius
  FACEOFF_CIRCLE_RADIUS: 15,
  // Faceoff dot radius in inches
  FACEOFF_DOT_RADIUS: 12,
  // Length of main 'L' hash on faceoff circle
  FACEOFF_HASH_MAIN_LEG: 3,
  // Length of cross 'L' hash on faceoff circle
  FACEOFF_HASH_CROSS_LEG: 1 + 10 / 12, // 1' 10"
  // Y-offset from faceoff center to start of hash
  FACEOFF_HASH_Y_OFFSET: 1.5, // 1' 6"
  // X-offset from faceoff center to start of hash
  FACEOFF_HASH_X_OFFSET: 1, // Half of 2'
  // Goal crease radius
  CREASE_RADIUS: 6,
  // Goal width
  GOAL_WIDTH: 6,
  // Goal depth
  GOAL_DEPTH: 4,
  // Width of trapezoid on goal line
  GOAL_TRAPEZOID_GOAL_LINE_WIDTH: 22,
  // Width of trapezoid on end boards
  GOAL_TRAPEZOID_END_BOARD_WIDTH: 28,
} as const;

/**
 * NHL API Coordinate System
 * The NHL API uses a center-origin coordinate system:
 * - [0, 0] is at center ice
 * - X-axis: -100 to +100 (longitudinal, offensive zone is positive)
 * - Y-axis: -42.5 to +42.5 (lateral, positive is typically right side)
 */
export const NHL_COORDS = {
  // Maximum X coordinate (offensive zone end)
  MAX_X: 100,
  // Minimum X coordinate (defensive zone end)
  MIN_X: -100,
  // Maximum Y coordinate
  MAX_Y: 42.5,
  // Minimum Y coordinate
  MIN_Y: -42.5,
  // Center ice X coordinate
  CENTER_X: 0,
  // Center ice Y coordinate
  CENTER_Y: 0,
} as const;

/**
 * Default SVG dimensions for rendering
 */
export const DEFAULT_SVG = {
  // Default width in pixels
  WIDTH: 1000,
  // Default height in pixels
  HEIGHT: 425, // Maintains 200:85 aspect ratio
  // Default padding in pixels
  PADDING: 20,
} as const;

/**
 * Rink line colors and styling (NHL standard)
 */
export const RINK_COLORS = {
  // Ice surface color
  ICE: "#f0f4f8",
  // Board color
  BOARDS: "#000000",
  // Red line color
  RED_LINE: "#c8102e",
  // Blue line color
  BLUE_LINE: "#003e7e",
  // Faceoff circle and dot color
  FACEOFF: "#c8102e",
  // Goal crease color
  CREASE: "#7db9de",
  // Default line color for other markings
  LINE: "#000000",
} as const;

/**
 * Rink line widths (in feet, will be scaled to SVG)
 */
export const LINE_WIDTHS = {
  // Red center line width
  RED_LINE: 1,
  // Blue line width
  BLUE_LINE: 1,
  // Goal line width
  GOAL_LINE: 0.5, // 2 inches converted to feet
  // Faceoff circle width
  FACEOFF_CIRCLE: 2 / 12, // 2 inches converted to feet
} as const;

/**
 * Predefined SVG symbol paths for hockey-specific visualizations
 * These can be used with the symbol configuration in EventLayer
 */
export const SYMBOL_PATHS = {
  HEXAGON: "M 0,-6 L 5.2,-3 L 5.2,3 L 0,6 L -5.2,3 L -5.2,-3 Z",
  ARROW_UP: "M 0,-6 L 4,0 L 1,0 L 1,6 L -1,6 L -1,0 L -4,0 Z",
  ARROW_RIGHT: "M 6,0 L 0,4 L 0,1 L -6,1 L -6,-1 L 0,-1 L 0,-4 Z",
} as const;

/**
 * Helper type for symbol path keys
 */
export type SymbolPathKey = keyof typeof SYMBOL_PATHS;
