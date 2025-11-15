# API Reference

Complete API documentation for d3-hockey.

## Core Components

### [Rink](/api/rink)

The main class for creating and managing hockey rink visualizations.

```typescript
new Rink(container: string | HTMLElement, config?: RinkConfig)
```

### [EventLayer](/api/event-layer)

Render individual events (shots, hits, etc.) as symbols on the rink.

```typescript
new EventLayer(config?: EventLayerConfig)
```

### [BaseLayer](/api/base-layer)

Abstract base class for creating custom visualization layers.

```typescript
class BaseLayer
```

### [LayerManager](/api/layer-manager)

Manages multiple layers and their rendering order.

```typescript
new LayerManager(svg: d3.Selection)
```

## Utilities

### [Coordinates](/api/coordinates)

Functions for transforming between NHL API coordinates and SVG coordinates.

- `nhlToSVG()` - Convert NHL coordinates to SVG
- `flipCoordinatesByPeriod()` - Handle period-based flipping
- `getZone()` - Determine which zone a coordinate is in
- `getDistance()` - Calculate distance between points

### [Colors](/api/colors)

Color utilities and NHL team color palettes.

- `NHL_TEAM_COLORS` - All 32 team color schemes
- `getTeamColors()` - Get colors for a specific team
- `createColorScale()` - Create D3 color scales
- `getShotResultColor()` - Standard colors for shot results

### [Scales](/api/scales)

Utilities for scaling visual properties based on data.

- `scaleRadiusByProperty()` - Scale marker size
- `scaleOpacityByProperty()` - Scale transparency
- `scaleByThresholds()` - Threshold-based scaling

### [Data Utils](/api/data-utils)

Functions for processing and filtering hockey data.

- `parseNHLAPIResponse()` - Parse NHL API data
- `filterByZone()` - Filter events by rink zone
- `filterByTeam()` - Filter events by team
- `calculateStats()` - Calculate summary statistics

## Constants

### [Rink Dimensions](/api/constants)

Official NHL rink dimensions and specifications.

```typescript
RINK_DIMENSIONS; // Length, width, zones, etc.
NHL_COORDS; // Coordinate system boundaries
DEFAULT_SVG; // Default rendering dimensions
RINK_COLORS; // Standard rink colors
LINE_WIDTHS; // Standard line widths
```

### [Team Colors](/api/team-colors)

Complete color palette for all 32 NHL teams.

```typescript
NHL_TEAM_COLORS["TOR"]; // { primary, secondary, accent }
```

## TypeScript Types

All public types are exported from the main package:

```typescript
import type {
  RinkConfig,
  EventLayerConfig,
  HockeyEvent,
  NHLCoordinate,
  SVGCoordinate,
  // ... and more
} from "d3-hockey";
```

See individual API pages for detailed type definitions.

## Version

Current version: **v0.1.0**

::: warning
This library is in active development. The API may change between minor versions until v1.0.0 is released.
:::
