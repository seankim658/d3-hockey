# Types API

Complete TypeScript type definitions for d3-hockey. All types are exported from the main package.

## Import

```typescript
import type {
  RinkConfig,
  EventLayerConfig,
  HockeyEvent,
  NHLCoordinate,
  // ... any other types
} from "d3-hockey";
```

## Core Types

### Coordinate Types

#### NHLCoordinate

NHL API coordinate system (center-origin, in feet).

```typescript
interface NHLCoordinate {
  x: number; // -100 to 100 (longitudinal, center ice is 0)
  y: number; // -42.5 to 42.5 (lateral, center ice is 0)
}
```

**Example**:

```typescript
const centerIce: NHLCoordinate = { x: 0, y: 0 };
const offensiveZone: NHLCoordinate = { x: 75, y: 10 };
```

---

#### SVGCoordinate

SVG coordinate system (top-left origin, in pixels).

```typescript
interface SVGCoordinate {
  x: number; // Pixels from left edge
  y: number; // Pixels from top edge
}
```

**Note**: Use coordinate transformation utilities to convert between NHL and SVG coordinates.

**See**: [Coordinate Utilities](/api/utilities#coordinates)

---

#### PeriodInfo

Information for period-based coordinate transformations.

```typescript
interface PeriodInfo {
  period: number; // Period number (1, 2, 3, OT, etc.)
  isOffensiveZone?: boolean; // Optional: perspective flag
}
```

**Usage**: Teams attack opposite ends in different periods. Use with `flipCoordinatesByPeriod()` to normalize coordinates.

---

### Function Types

#### Accessor

Generic accessor function type for extracting values from data.

```typescript
type Accessor<TData, TReturn> = (d: TData, i: number) => TReturn;
```

**Parameters**:

- **d**: The data element
- **i**: The index in the data array

**Returns**: The extracted value

**Example**:

```typescript
// Color accessor
const colorAccessor: Accessor<Shot, string> = (d, i) => {
  return d.type === "GOAL" ? "gold" : "blue";
};

// Radius accessor
const radiusAccessor: Accessor<Shot, number> = (d, i) => {
  return d.xG * 10; // Scale by expected goals
};
```

---

## Data Types

### HockeyEvent

Default event data structure. Your data doesn't have to match this exactly - use accessors for custom structures.

```typescript
interface HockeyEvent {
  coordinates: NHLCoordinate; // Required: event location
  period?: number; // Optional: period number
  type?: string; // Optional: event type
  team?: string; // Optional: team identifier
  player?: string; // Optional: player name
  id?: string | number; // Optional: unique identifier
  [key: string]: unknown; // Any additional properties
}
```

**Example**:

```typescript
const shot: HockeyEvent = {
  coordinates: { x: 75, y: 10 },
  period: 2,
  type: "SHOT",
  team: "WSH",
  player: "Ovechkin",
  shotType: "Wrist",
  xG: 0.15,
};
```

---

### HockeyEventSymbolType

Available symbol types for rendering events.

```typescript
type HockeyEventSymbolType =
  | "circle" // ●
  | "cross" // +
  | "diamond" // ◆
  | "square" // ■
  | "star" // ★
  | "triangle" // ▲
  | "wye" // Y shape
  | string; // Custom SVG path
```

**Custom Symbols**: You can provide a custom SVG path string for unique symbols.

**Example**:

```typescript
// Built-in symbols
{
  symbol: "circle";
}
{
  symbol: "star";
}

// Dynamic symbol based on data
{
  symbol: (d) => (d.type === "GOAL" ? "star" : "circle");
}

// Custom SVG path
{
  symbol: "M0,-5 L5,5 L-5,5 Z";
} // Custom triangle
```

---

### AnimationEasing

D3 easing function names for animations.

```typescript
type AnimationEasing =
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
```

**See**: [D3 Easing Documentation](https://d3js.org/d3-ease) for visual examples

**Example**:

```typescript
{
  animate: true,
  animationDuration: 800,
  animationEasing: "easeElasticOut"  // Bouncy effect
}
```

---

## Configuration Types

### RinkConfig

Configuration for the Rink component.

```typescript
interface RinkConfig {
  // SVG dimensions
  width?: number; // Default: 800
  height?: number; // Default: 400
  padding?: number; // Default: 20

  // Layout options
  halfRink?: boolean; // Default: false
  halfRinkEnd?: "offensive" | "defensive"; // Default: "offensive"
  vertical?: boolean; // Default: false

  // Styling
  colors?: Partial<RinkColors>; // Override default colors
}
```

**See**: [Rink API](/api/rink#configuration) for detailed explanations

---

### RinkColors

Color scheme for rink elements.

```typescript
interface RinkColors {
  ice: string; // Ice surface (default: "#ffffff")
  boards: string; // Outer boards (default: "#000000")
  redLine: string; // Center & goal lines (default: "#c8102e")
  blueLine: string; // Blue lines (default: "#003e7e")
  faceoff: string; // Faceoff circles (default: "#c8102e")
  crease: string; // Goal crease (default: "#7fd3ff")
  line: string; // General lines (default: "#000000")
}
```

**Example**:

```typescript
const customColors: Partial<RinkColors> = {
  ice: "#f0f8ff",
  blueLine: "#1565c0",
  redLine: "#d32f2f",
};
```

---

### RenderDimensions

Calculated rendering dimensions passed to layers.

```typescript
interface RenderDimensions {
  width: number; // Total SVG width
  height: number; // Total SVG height
  padding: number; // Padding around rink
  scale: number; // Feet-to-pixels conversion factor
}
```

**Usage**: Automatically calculated and passed to layer render methods. Used for coordinate transformations.

---

## Layer Types

### BaseLayerConfig

Base configuration for all layers.

```typescript
interface BaseLayerConfig {
  id: string; // Required: unique layer identifier
  visible?: boolean; // Default: true
  opacity?: number; // Default: 1 (0-1 range)
  zIndex?: number; // Default: 0 (rendering order)
  className?: string; // Default: "layer"
}
```

---

### EventLayerConfig

Configuration for EventLayer (extends BaseLayerConfig).

```typescript
interface EventLayerConfig<TData = any> extends BaseLayerConfig {
  // Data accessors
  x?: Accessor<TData, number>;
  y?: Accessor<TData, number>;
  eventType?: Accessor<TData, string | null>;

  // Visual properties
  radius?: number | Accessor<TData, number>;
  color?: string | Accessor<TData, string>;
  stroke?: string | Accessor<TData, string>;
  strokeWidth?: number;

  // Tooltip
  showTooltip?: boolean;
  tooltip?: Accessor<TData, string>;

  // Animation
  animate?: boolean;
  animationDuration?: number;
  animationEasing?: AnimationEasing;

  // Symbol configuration
  symbol?: HockeyEventSymbolType | Accessor<TData, HockeyEventSymbolType>;
  symbolSize?: number | Accessor<TData, number>;

  // Advanced customization
  customRender?: (
    selection: d3.Selection<SVGElement, TData, SVGGElement, unknown>,
    dimensions: RenderDimensions,
    context: CustomRenderContext<TData, EventLayer<TData>>,
  ) => void;
  customAttributes?: {
    [key: string]: string | number | Accessor<TData, string | number>;
  };

  // Legend
  legendLabel?: string;
  legendColor?: string;
  legendSymbol?: HockeyEventSymbolType;
}
```

**See**: [EventLayer API](/api/event-layer) for detailed configuration guide

---

### CustomRenderContext

Context object passed to customRender functions.

```typescript
interface CustomRenderContext<TData, TLayer> {
  position: {
    svgX: number; // Calculated SVG X coordinate
    svgY: number; // Calculated SVG Y coordinate
    dataX: number; // Original NHL X coordinate
    dataY: number; // Original NHL Y coordinate
  };
  data: TData; // The data element
  index: number; // Index in dataset
  container: SVGGElement; // Parent container for adding siblings
  layer: TLayer; // Reference to the layer instance
}
```

**Usage**: Provides all necessary context for custom rendering logic.

**Example**:

```typescript
customRender: (selection, dimensions, context) => {
  // Access all context properties
  const { position, data, index, container, layer } = context;

  // Use calculated positions
  console.log(`SVG position: (${position.svgX}, ${position.svgY})`);
  console.log(`NHL position: (${position.dataX}, ${position.dataY})`);

  // Add custom elements
  d3.select(container)
    .append("text")
    .attr("x", position.svgX)
    .attr("y", position.svgY)
    .text(data.player);
};
```

---

## NHL API Types

### NHLEvent

Base interface for NHL API events.

```typescript
interface NHLEvent {
  eventId: number;
  period: number;
  periodTime: string;
  typeDescKey: string;
  details?: {
    xCoord?: number;
    yCoord?: number;
    [key: string]: any;
  };
  [key: string]: any;
}
```

---

### Specific Event Types

#### GoalEvent

```typescript
interface GoalEvent extends NHLEvent {
  typeDescKey: "goal";
  details: {
    xCoord: number;
    yCoord: number;
    shotType?: string;
    scoringPlayerTotal?: number;
    // ... other goal-specific fields
  };
}
```

#### ShotOnGoalEvent

```typescript
interface ShotOnGoalEvent extends NHLEvent {
  typeDescKey: "shot-on-goal";
  details: {
    xCoord: number;
    yCoord: number;
    shotType?: string;
    // ... other shot-specific fields
  };
}
```

#### MissedShotEvent

```typescript
interface MissedShotEvent extends NHLEvent {
  typeDescKey: "missed-shot";
  details: {
    xCoord: number;
    yCoord: number;
    shotType?: string;
    reason?: string;
  };
}
```

#### BlockedShotEvent

```typescript
interface BlockedShotEvent extends NHLEvent {
  typeDescKey: "blocked-shot";
  details: {
    xCoord: number;
    yCoord: number;
    shotType?: string;
  };
}
```

#### HitEvent, GiveawayEvent, TakeawayEvent, PenaltyEvent

Similar structure with `typeDescKey` matching their event type.

---

## Type Guards

Functions to check event types at runtime.

### Event Type Checks

```typescript
function isGoal(event: NHLEvent): event is GoalEvent;
function isShotOnGoal(event: NHLEvent): event is ShotOnGoalEvent;
function isMissedShot(event: NHLEvent): event is MissedShotEvent;
function isBlockedShot(event: NHLEvent): event is BlockedShotEvent;
function isHit(event: NHLEvent): event is HitEvent;
function isGiveaway(event: NHLEvent): event is GiveawayEvent;
function isTakeaway(event: NHLEvent): event is TakeawayEvent;
function isPenalty(event: NHLEvent): event is PenaltyEvent;
```

**Example**:

```typescript
import { isGoal, isShotOnGoal } from "d3-hockey";

events.forEach((event) => {
  if (isGoal(event)) {
    // TypeScript knows this is a GoalEvent
    console.log("Goal!", event.details.scoringPlayerTotal);
  } else if (isShotOnGoal(event)) {
    // TypeScript knows this is a ShotOnGoalEvent
    console.log("Shot:", event.details.shotType);
  }
});
```

### Shot Event Check

Checks if an event is any shot-related event.

```typescript
function isShotEvent(
  event: NHLEvent,
): event is ShotOnGoalEvent | MissedShotEvent | BlockedShotEvent | GoalEvent;
```

**Example**:

```typescript
import { isShotEvent } from "d3-hockey";

const shotEvents = events.filter(isShotEvent);
// shotEvents is now typed as shot-related events only
```

---

## Utility Types

### ScaleOptions

Base options for scaling utilities.

```typescript
interface ScaleOptions {
  domain?: [number, number]; // Input data range
  range?: [number, number]; // Output value range
}
```

### RadiusScaleOptions

```typescript
interface RadiusScaleOptions extends ScaleOptions {
  min?: number; // Minimum radius (default: 2)
  max?: number; // Maximum radius (default: 10)
}
```

### OpacityScaleOptions

```typescript
interface OpacityScaleOptions extends ScaleOptions {
  min?: number; // Minimum opacity (default: 0.1)
  max?: number; // Maximum opacity (default: 1)
}
```

**Example**:

```typescript
import { scaleRadiusByProperty } from "d3-hockey";

const radiusScale: RadiusScaleOptions = {
  min: 3,
  max: 15,
  domain: [0, 1], // xG values from 0 to 1
  range: [3, 15], // Radii from 3 to 15 pixels
};

rink.addEvents(shots, {
  id: "shots",
  radius: scaleRadiusByProperty("xG", radiusScale),
});
```

---

## Type Usage Examples

### Generic Event Layer

```typescript
// Define your custom data type
interface CustomShot {
  location: { x: number; y: number };
  shooter: string;
  speed: number;
  danger: number;
}

// Use it with EventLayerConfig
const config: EventLayerConfig<CustomShot> = {
  id: "custom-shots",
  x: (d) => d.location.x,
  y: (d) => d.location.y,
  radius: (d) => d.danger * 5,
  color: (d) => (d.speed > 90 ? "red" : "blue"),
  tooltip: (d) => `${d.shooter}: ${d.speed} MPH`,
};

rink.addEvents<CustomShot>(customShots, config);
```

### Strongly Typed Accessors

```typescript
interface ShotData {
  coords: NHLCoordinate;
  player: string;
  xG: number;
}

// Accessor functions are fully typed
const colorAccessor: Accessor<ShotData, string> = (shot, index) => {
  return shot.xG > 0.2 ? "red" : "blue";
};

const tooltipAccessor: Accessor<ShotData, string> = (shot) => {
  return `${shot.player}<br/>xG: ${(shot.xG * 100).toFixed(1)}%`;
};

rink.addEvents<ShotData>(shots, {
  id: "shots",
  x: (d) => d.coords.x,
  y: (d) => d.coords.y,
  color: colorAccessor,
  tooltip: tooltipAccessor,
});
```

## See Also

- [Rink API](/api/rink) - Rink configuration using these types
- [EventLayer API](/api/event-layer) - EventLayer configuration
- [Utilities](/api/utilities) - Functions using these types
- [D3 Types](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/d3) - D3.js type definitions
