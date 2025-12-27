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
  HockeyEventSymbolType,
  AnimationEasing,
} from "./types";

export type {
  PeriodDescriptor,
  NHLTeamInfo,
  NHLPlayerInfo,
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
  NHLPlayByPlayResponse,
  NHLPlayerResponse,
} from "./nhl";

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
  NHL_EVENT_TYPE_CODES,
} from "./nhl";

export {
  nhlEventToHockeyEvent,
  parseNHLEvents,
  parseNHLPlayByPlay,
  parseNHLEventsWithFilter,
  parseNHLEventsByTeam,
  type ParseOptions,
} from "./nhl";

export { NHLDataManager, type FetchOptions, type TeamData } from "./nhl";

export {
  nhlToSVG,
  svgToNHL,
  flipCoordinatesByPeriod,
  normalizeCoordinate,
  calculateScale,
  getDistance,
  getZone,
} from "./utils/coordinate-utils";

export {
  validateCoordinates,
  filterByZone,
  filterByTeam,
  filterByPeriod,
  groupBy,
  calculateStats,
} from "./utils/data-utils";

export {
  NHL_TEAM_COLORS,
  getTeamColors,
  getTeamPrimaryColor,
  HOCKEY_COLOR_SCALES,
  createColorScale,
  getShotResultColor,
  getOpacity,
  colorByProperty,
  colorByTeam,
  colorByCategory,
  colorGradient,
  colorByCondition,
} from "./utils/color-utils";

export {
  scaleRadiusByProperty,
  scaleOpacityByProperty,
  scaleByProperty,
  scaleSqrtByProperty,
  scaleLogByProperty,
  scaleByThresholds,
  type ScaleOptions,
  type RadiusScaleOptions,
  type OpacityScaleOptions,
} from "./utils/scale-utils";

export { Rink } from "./components/rink";

export { BaseLayer } from "./components/layers/base-layer";
export type { BaseLayerConfig } from "./components/layers/base-layer";

export { EventLayer } from "./components/layers/event-layer";
export type {
  EventLayerConfig,
  EventRenderContext,
} from "./components/layers/event-layer";

export { HexbinLayer } from "./components/layers/hexbin-layer";
export type {
  HexbinLayerConfig,
  HexbinRenderContext,
  AggregationFunction,
  BuiltInAggregation,
} from "./components/layers/hexbin-layer";

export { HeatmapLayer } from "./components/layers/heatmap-layer";
export type {
  HeatmapLayerConfig,
  HeatmapRenderContext,
  HeatmapGridData,
} from "./components/layers/heatmap-layer";

export { LayerManager } from "./components/layers/layer-manager";
