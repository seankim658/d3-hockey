# API Reference

Complete API documentation for d3-hockey.

## Quick Links

- [Rink](/api/rink) - Main visualization component
- [EventLayer](/api/event-layer) - Event rendering layer
- [BaseLayer](/api/base-layer) - Custom layer base class
- [LayerManager](/api/layer-manager) - Layer management
- [Types](/api/types) - TypeScript definitions
- [Utilities](/api/utilities) - Helper functions

## Core Components

### [Rink](/api/rink)

The main class for creating and managing hockey rink visualizations.

```typescript
new Rink(container: string | HTMLElement, config?: RinkConfig)
```

**Key Methods**:

- `render()` - Render the rink to DOM
- `addEvents(data, config)` - Add event visualization layer
- `addLayer(layer)` - Add custom layer
- `removeLayer(id)` - Remove a layer
- `showLayer(id)` / `hideLayer(id)` - Toggle layer visibility
- `updateLayer(id, data)` - Update layer data
- `getLayerManager()` - Access layer manager

**See**: [Full Rink API Documentation →](/api/rink)

---

### [EventLayer](/api/event-layer)

Render individual events (shots, goals, hits, etc.) as symbols on the rink with extensive customization.

```typescript
new EventLayer(data: TData[], config: EventLayerConfig<TData>)
```

**Key Features**:

- Dynamic sizing and coloring based on data
- Multiple symbol types (circles, stars, diamonds, etc.)
- Interactive tooltips
- Animations
- Custom rendering via `customRender` hook

**Common Usage**:

```typescript
rink.addEvents(shots, {
  id: "shots",
  color: (d) => (d.type === "GOAL" ? "gold" : "blue"),
  radius: (d) => d.xG * 10,
  tooltip: (d) => `${d.player}: ${d.type}`,
});
```

**See**: [Full EventLayer API Documentation →](/api/event-layer)

---

### [BaseLayer](/api/base-layer)

Abstract base class for creating custom visualization layers.

```typescript
abstract class BaseLayer<TData, TConfig extends BaseLayerConfig>
```

**When to Use**:

- EventLayer doesn't meet your needs
- You need specialized rendering (heatmaps, flow fields, etc.)
- You want complete control over D3 rendering

**Example**:

```typescript
class HeatmapLayer extends BaseLayer {
  render(container, dimensions) {
    // Your custom rendering logic
  }
}
```

**See**: [Full BaseLayer API Documentation →](/api/base-layer)

---

### [LayerManager](/api/layer-manager)

Manages multiple layers, handling rendering order, visibility, and lifecycle.

```typescript
const layerManager = rink.getLayerManager();
```

**Key Methods**:

- `addLayer(layer)` - Add a layer
- `removeLayer(id)` - Remove a layer
- `getLayer(id)` - Get layer reference
- `getAllLayers()` - Get all layers
- `showLayer(id)` / `hideLayer(id)` - Toggle visibility
- `reorderLayers(ids)` - Change z-index order

**See**: [Full LayerManager API Documentation →](/api/layer-manager)

---

## Types & Interfaces

### [Types](/api/types)

Complete TypeScript type definitions.

**Core Types**:

- `NHLCoordinate` - NHL API coordinate system
- `SVGCoordinate` - SVG coordinate system
- `HockeyEvent` - Event data structure
- `HockeyEventSymbolType` - Symbol types
- `AnimationEasing` - Animation functions
- `Accessor<TData, TReturn>` - Accessor function type

**Configuration Types**:

- `RinkConfig` - Rink configuration
- `RinkColors` - Color scheme
- `EventLayerConfig` - EventLayer configuration
- `BaseLayerConfig` - Base layer configuration
- `CustomRenderContext` - Custom render context

**NHL API Types**:

- `NHLEvent` - Base NHL event
- `GoalEvent`, `ShotOnGoalEvent`, etc.
- Type guard functions: `isGoal()`, `isShotEvent()`, etc.

**See**: [Full Types API Documentation →](/api/types)

---

## Utilities

### [Utilities Overview](/api/utilities)

Comprehensive utility functions for coordinates, data processing, colors, and scaling.

#### Coordinate Utilities

Transform between NHL and SVG coordinate systems:

```typescript
import {
  nhlToSVG,
  svgToNHL,
  flipCoordinatesByPeriod,
  getZone,
  getDistance,
} from "d3-hockey";
```

**Functions**:

- `nhlToSVG(coords, dimensions)` - NHL → SVG coordinates
- `svgToNHL(coords, dimensions)` - SVG → NHL coordinates
- `flipCoordinatesByPeriod(coords, period)` - Handle period flipping
- `normalizeCoordinate(coord)` - Clamp to valid bounds
- `calculateScale(width, height, padding)` - Calculate scale factor
- `getDistance(coord1, coord2)` - Distance between points
- `getZone(coord)` - Determine rink zone (offensive/neutral/defensive)

---

#### Data Utilities

Process and filter hockey data:

```typescript
import {
  parseNHLAPIResponse,
  filterByZone,
  filterByTeam,
  filterByPeriod,
  groupBy,
  calculateStats,
} from "d3-hockey";
```

**Functions**:

- `parseNHLAPIResponse(response)` - Parse NHL API response
- `parseNHLAPIEventArray(events)` - Parse event array
- `validateCoordinates(data)` - Filter invalid coordinates
- `filterByZone(data, zone)` - Filter by rink zone
- `filterByTeam(data, team)` - Filter by team
- `filterByPeriod(data, period)` - Filter by period
- `groupBy(data, key)` - Group data by property
- `calculateStats(data, accessor)` - Summary statistics

---

#### Color Utilities

Work with team colors and create color scales:

```typescript
import {
  NHL_TEAM_COLORS,
  getTeamColors,
  getTeamPrimaryColor,
  colorByTeam,
  colorByProperty,
  getShotResultColor,
} from "d3-hockey";
```

**Constants & Functions**:

- `NHL_TEAM_COLORS` - All 32 team color palettes
- `getTeamColors(teamCode)` - Get team colors
- `getTeamPrimaryColor(teamCode)` - Get primary color
- `HOCKEY_COLOR_SCALES` - Pre-configured scales
- `createColorScale(type, domain, colors)` - Create D3 scale
- `getShotResultColor(result)` - Standard shot colors
- `colorByProperty(property, scale)` - Color by data value
- `colorByTeam(accessor)` - Automatic team colors
- `colorByCategory(categories)` - Categorical coloring
- `colorGradient(start, end, accessor)` - Color gradient
- `colorByCondition(conditions, default)` - Conditional colors

---

#### Scale Utilities

Scale visual properties based on data:

```typescript
import {
  scaleRadiusByProperty,
  scaleOpacityByProperty,
  scaleByProperty,
} from "d3-hockey";
```

**Functions**:

- `scaleRadiusByProperty(property, options)` - Scale marker size
- `scaleOpacityByProperty(property, options)` - Scale transparency
- `scaleByProperty(property, options)` - General linear scaling
- `scaleSqrtByProperty(property, options)` - Square root scale
- `scaleLogByProperty(property, options)` - Logarithmic scale
- `scaleByThresholds(thresholds)` - Threshold-based scaling

**Example**:

```typescript
rink.addEvents(shots, {
  id: "shots",
  radius: scaleRadiusByProperty("xG", {
    min: 3,
    max: 15,
    domain: [0, 1],
  }),
  color: colorByTeam((d) => d.team),
  opacity: scaleOpacityByProperty("danger", {
    min: 0.3,
    max: 1,
  }),
});
```

**See**: [Full Utilities API Documentation →](/api/utilities)

---

## Common Patterns

### Basic Shot Chart

```typescript
import { Rink } from "d3-hockey";

const shots = [
  { coordinates: { x: 75, y: 10 }, player: "Ovechkin" },
  { coordinates: { x: 80, y: -5 }, player: "Backstrom" },
];

new Rink("#container").render().addEvents(shots, {
  id: "shots",
  color: "#FF4C00",
  radius: 5,
});
```

### Multiple Layers

```typescript
const rink = new Rink("#container").render();

rink
  .addEvents(goals, {
    id: "goals",
    color: "gold",
    radius: 8,
    symbol: "star",
  })
  .addEvents(shots, {
    id: "shots",
    color: "blue",
    radius: 4,
  });
```

### Dynamic Styling

```typescript
import {
  scaleRadiusByProperty,
  colorByProperty,
  createColorScale,
} from "d3-hockey";

rink.addEvents(shots, {
  id: "shots",
  radius: scaleRadiusByProperty("xG", {
    min: 3,
    max: 12,
    domain: [0, 1],
  }),
  color: colorByProperty(
    "xG",
    createColorScale("linear", [0, 1], ["blue", "red"]),
  ),
  tooltip: (d) => `xG: ${(d.xG * 100).toFixed(1)}%`,
});
```

### Working with NHL API Data

```typescript
import {
  parseNHLAPIResponse,
  flipCoordinatesByPeriod,
  filterByZone,
} from "d3-hockey";

// Fetch NHL data
const response = await fetch(
  "https://api-web.nhle.com/v1/gamecenter/2023020001/play-by-play",
).then((r) => r.json());

// Parse and transform
const events = parseNHLAPIResponse(response);

const normalized = events.map((event) => ({
  ...event,
  coordinates: flipCoordinatesByPeriod(event.coordinates, event.period),
}));

// Filter and visualize
const offensiveShots = filterByZone(normalized, "offensive");

new Rink("#container").render().addEvents(offensiveShots, {
  id: "shots",
  color: "blue",
});
```

### Custom Layer

```typescript
import { BaseLayer, Rink } from "d3-hockey";

class HeatmapLayer extends BaseLayer {
  protected getDefaults() {
    return {
      id: "heatmap",
      visible: true,
      opacity: 0.6,
      zIndex: -1, // Render behind other layers
      className: "heatmap-layer",
    };
  }

  render(container, dimensions) {
    // Your custom D3 rendering logic
    container
      .selectAll(".heatmap-cell")
      .data(this.data)
      .enter()
      .append("rect")
      .attr("class", "heatmap-cell")
      .attr("x", (d) => this.calculateX(d))
      .attr("y", (d) => this.calculateY(d))
      .attr("width", 10)
      .attr("height", 10)
      .attr("fill", (d) => this.getHeatColor(d));
  }
}

const heatmap = new HeatmapLayer(data, { id: "heatmap" });
rink.addLayer(heatmap);
```

## Package Exports

All exports from the main package:

```typescript
import {
  // Core classes
  Rink,
  BaseLayer,
  EventLayer,
  LayerManager,

  // Types
  type RinkConfig,
  type RinkColors,
  type EventLayerConfig,
  type BaseLayerConfig,
  type HockeyEvent,
  type NHLCoordinate,
  type SVGCoordinate,
  type Accessor,
  type HockeyEventSymbolType,
  type AnimationEasing,

  // Coordinate utilities
  nhlToSVG,
  svgToNHL,
  flipCoordinatesByPeriod,
  normalizeCoordinate,
  calculateScale,
  getDistance,
  getZone,

  // Data utilities
  validateCoordinates,
  filterByZone,
  filterByTeam,
  filterByPeriod,
  groupBy,
  calculateStats,
  parseNHLAPIResponse,
  parseNHLAPIEventArray,

  // Color utilities
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

  // Scale utilities
  scaleRadiusByProperty,
  scaleOpacityByProperty,
  scaleByProperty,
  scaleSqrtByProperty,
  scaleLogByProperty,
  scaleByThresholds,
  type ScaleOptions,
  type RadiusScaleOptions,
  type OpacityScaleOptions,

  // NHL API types
  type NHLEvent,
  type GoalEvent,
  type ShotOnGoalEvent,
  type MissedShotEvent,
  type BlockedShotEvent,
  type HitEvent,
  type GiveawayEvent,
  type TakeawayEvent,
  type PenaltyEvent,

  // Type guards
  isGoal,
  isShotOnGoal,
  isMissedShot,
  isBlockedShot,
  isHit,
  isGiveaway,
  isTakeaway,
  isPenalty,
  isShotEvent,
} from "d3-hockey";
```

## Need Help?

- **Getting Started**: See the [Getting Started Guide](/guide/getting-started)
- **Examples**: Browse [Example Visualizations](/examples/)
- **Issues**: Report bugs on [GitHub](https://github.com/seankim658/d3-hockey/issues)
- **TypeScript**: All types are fully documented with JSDoc comments

## Documentation Structure

```
/api/
├── index.md              # This overview page
├── rink.md              # Rink class documentation
├── event-layer.md       # EventLayer class documentation
├── base-layer.md        # BaseLayer abstract class
├── layer-manager.md     # LayerManager class
├── types.md             # TypeScript type definitions
└── utilities.md         # All utility functions
```

## Version

Current documentation is for d3-hockey v0.1.0.
