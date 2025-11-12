/**
 * d3-hockey - D3.js library for hockey data visualization
 *
 * A comprehensive, extensible library for creating beautiful hockey visualizations
 */

export const version = "0.1.0";

export {
  RINK_DIMENSIONS,
  NHL_COORDS,
  DEFAULT_SVG,
  RINK_COLORS,
  LINE_WIDTHS,
  SYMBOL_PATHS,
  type SymbolPathKey,
} from "./constants";

export type {
  NHLCoordinate,
  SVGCoordinate,
  PeriodInfo,
  HockeyEvent,
  Accessor,
  RinkConfig,
  RinkColors,
  RenderDimensions,
  LayerType,
  LayerEventHandler,
  LayerEventType,
  HockeyEventSymbolType,
  AnimationEasing,
  // NHL API types
  PeriodDescriptor,
  NHLBaseEvent,
  EventDetailsWithLocation,
  ShotOnGoalEvent,
  MissedShotEvent,
  BlockedShotEvent,
  GoalEvent,
  HitEvent,
  GiveawayEvent,
  TakeawayEvent,
  PenaltyEvent,
  NHLEventWithLocation,
  NHLEventWithoutLocation,
  NHLEvent,
} from "./types";

export {
  hasLocation,
  isGoal,
  isShotOnGoal,
  isMissedShot,
  isBlockedShot,
  isHit,
  isGiveaway,
  isTakeaway,
  isPenalty,
  isShotEvent,
} from "./types";

export {
  nhlToSVG,
  svgToNHL,
  flipCoordinatesByPeriod,
  normalizeCoordinate,
  calculateScale,
  getDistance,
  getZone,
} from "./utils/coordinates";

export {
  validateCoordinates,
  filterByZone,
  filterByTeam,
  filterByPeriod,
  groupBy,
  calculateStats,
  parseNHLAPIResponse,
  parseNHLAPIEventArray,
} from "./utils/data-utils";

export {
  NHL_TEAM_COLORS,
  getTeamColors,
  getTeamPrimaryColor,
  HOCKEY_COLOR_SCALES,
  createColorScale,
  getShotResultColor,
  getOpacity,
} from "./utils/color-utils";

export { Rink } from "./components/rink";

export { BaseLayer } from "./components/layers/base-layer";
export type { BaseLayerConfig } from "./components/layers/base-layer";

export { EventLayer } from "./components/layers/event-layer";
export type { EventLayerConfig } from "./components/layers/event-layer";

export { LayerManager } from "./components/layers/layer-manager";

// TODO : Temporary test function
export function hello(): string {
  return "Hello from d3-hockey! Foundation layer ready.";
}
