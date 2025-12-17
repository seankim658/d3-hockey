# API Reference

Complete API documentation for d3-hockey.

## Core Components

| Component                          | Description                     |
| ---------------------------------- | ------------------------------- |
| [Rink](/api/rink)                  | Main visualization class        |
| [EventLayer](/api/event-layer)     | Individual event markers        |
| [HexbinLayer](/api/hexbin-layer)   | Hexagonal binning/density maps  |
| [BaseLayer](/api/base-layer)       | Abstract base for custom layers |
| [LayerManager](/api/layer-manager) | Layer lifecycle management      |

## Reference

| Page                        | Description                                  |
| --------------------------- | -------------------------------------------- |
| [Types](/api/types)         | Core TypeScript definitions                  |
| [Utilities](/api/utilities) | Coordinate, color, scale, and data utilities |

## Quick Example

```typescript
import { Rink, NHLDataManager } from "d3-hockey";

const manager = await NHLDataManager.fromGameId("2023020001");
const shots = manager.getAllEvents({ shotsOnly: true });

new Rink("#container")
  .width(900)
  .height(450)
  .render()
  .addEvents(shots, {
    id: "shots",
    color: (d) => (d.type === "goal" ? "gold" : "blue"),
  });
```

## Exports

```typescript
// Classes
export {
  Rink,
  EventLayer,
  HexbinLayer,
  BaseLayer,
  LayerManager,
  NHLDataManager,
};

// Core types
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
};

// Layer types
export type {
  BaseLayerConfig,
  EventLayerConfig,
  EventRenderContext,
  HexbinLayerConfig,
  HexbinRenderContext,
  AggregationFunction,
  BuiltInAggregation,
};

// NHL types
export type {
  NHLEvent,
  NHLPlayByPlayResponse,
  NHLEventWithLocation,
  GoalEvent,
  ShotOnGoalEvent,
  MissedShotEvent,
  BlockedShotEvent,
  HitEvent,
  GiveawayEvent,
  TakeawayEvent,
  PenaltyEvent,
  FetchOptions,
  TeamData,
  ParseOptions,
};

// Type guards
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
};

// Coordinate utilities
export {
  nhlToSVG,
  svgToNHL,
  flipCoordinatesByPeriod,
  normalizeCoordinate,
  calculateScale,
  getDistance,
  getZone,
};

// Data utilities
export {
  validateCoordinates,
  filterByZone,
  filterByTeam,
  filterByPeriod,
  groupBy,
  calculateStats,
};

// Color utilities
export {
  NHL_TEAM_COLORS,
  getTeamColors,
  getTeamPrimaryColor,
  HOCKEY_COLOR_SCALES,
  createColorScale,
  getShotResultColor,
  colorByProperty,
  colorByTeam,
  colorByCategory,
  colorByCondition,
};

// Scale utilities
export {
  scaleRadiusByProperty,
  scaleOpacityByProperty,
  scaleByProperty,
  scaleSqrtByProperty,
  scaleLogByProperty,
  scaleByThresholds,
};

// Parser functions
export {
  nhlEventToHockeyEvent,
  parseNHLEvents,
  parseNHLPlayByPlay,
  parseNHLEventsWithFilter,
  parseNHLEventsByTeam,
};
```
