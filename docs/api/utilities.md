# Utilities API

Utility functions for coordinates, data processing, colors, and scales.

## Coordinate Utilities

### nhlToSVG()

Converts NHL coordinates (center-origin) to SVG coordinates (top-left origin).

```typescript
function nhlToSVG(
  coord: NHLCoordinate,
  dimensions: RenderDimensions,
): SVGCoordinate;
```

### svgToNHL()

Converts SVG coordinates back to NHL coordinates.

```typescript
function svgToNHL(
  coord: SVGCoordinate,
  dimensions: RenderDimensions,
): NHLCoordinate;
```

### flipCoordinatesByPeriod()

Flips coordinates based on period (teams switch ends).

```typescript
function flipCoordinatesByPeriod(
  coord: NHLCoordinate,
  period: number,
  flipOddPeriods?: boolean,
): NHLCoordinate;
```

### normalizeCoordinate()

Clamps coordinates to valid rink bounds.

```typescript
function normalizeCoordinate(coord: NHLCoordinate): NHLCoordinate;
```

### normalizeToOffensiveZone()

Ensures x is positive (offensive perspective).

```typescript
function normalizeToOffensiveZone(coord: NHLCoordinate): NHLCoordinate;
```

### normalizeToDefensiveZone()

Ensures x is negative (goalie perspective).

```typescript
function normalizeToDefensiveZone(coord: NHLCoordinate): NHLCoordinate;
```

### calculateScale()

Calculates feet-to-pixels conversion factor.

```typescript
function calculateScale(
  width: number,
  height: number,
  padding: number,
  halfRink?: boolean,
  vertical?: boolean,
): RenderDimensions;
```

### getDistance()

Euclidean distance between two coordinates (in feet).

```typescript
function getDistance(coord1: NHLCoordinate, coord2: NHLCoordinate): number;
```

### getZone()

Determines rink zone for a coordinate.

```typescript
function getZone(
  coord: NHLCoordinate,
  offensiveZonePositive?: boolean,
): "offensive" | "neutral" | "defensive";
```

Zone boundaries: offensive (x > 25), neutral (-25 ≤ x ≤ 25), defensive (x < -25).

---

## NHL Data Parsing

### parseNHLPlayByPlay()

Parses NHL API play-by-play response into HockeyEvent array.

```typescript
function parseNHLPlayByPlay(response: NHLPlayByPlayResponse): HockeyEvent[];
```

### parseNHLEvents()

Parses array of NHL events, filtering to those with location data.

```typescript
function parseNHLEvents(events: NHLEvent[]): HockeyEvent[];
```

### parseNHLEventsWithFilter()

Parses with filtering options.

```typescript
function parseNHLEventsWithFilter(
  events: NHLEvent[],
  options?: ParseOptions,
): HockeyEvent[];
```

### parseNHLEventsByTeam()

Parses events for a specific team.

```typescript
function parseNHLEventsByTeam(
  events: NHLEvent[],
  teamId: number,
): HockeyEvent[];
```

### nhlEventToHockeyEvent()

Converts single NHL event to HockeyEvent format.

```typescript
function nhlEventToHockeyEvent(event: NHLEventWithLocation): HockeyEvent;
```

---

## Data Utilities

### validateCoordinates()

Filters data to only entries with valid coordinates.

```typescript
function validateCoordinates<T>(data: T[]): T[];
```

### filterByZone()

```typescript
function filterByZone<T extends { coordinates: NHLCoordinate }>(
  data: T[],
  zone: "offensive" | "neutral" | "defensive",
): T[];
```

### filterByTeam()

```typescript
function filterByTeam<T>(
  data: T[],
  team: string,
  accessor?: (d: T) => string,
): T[];
```

### filterByPeriod()

```typescript
function filterByPeriod<T>(
  data: T[],
  period: number,
  accessor?: (d: T) => number,
): T[];
```

### groupBy()

```typescript
function groupBy<T>(
  data: T[],
  key: keyof T | ((d: T) => string | number),
): Map<string | number, T[]>;
```

### calculateStats()

Returns min, max, mean, median for numeric data.

```typescript
function calculateStats<T>(
  data: T[],
  accessor: (d: T) => number,
): { min: number; max: number; mean: number; median: number };
```

---

## Color Utilities

### NHL_TEAM_COLORS

Object with all 32 NHL team color palettes.

```typescript
const NHL_TEAM_COLORS: Record<string, TeamColors>;

// TeamColors: { primary: string; secondary: string; accent: string }
```

### getTeamColors()

```typescript
function getTeamColors(teamAbbrev: string): TeamColors | undefined;
```

### getTeamPrimaryColor()

```typescript
function getTeamPrimaryColor(teamAbbrev: string): string;
```

### HOCKEY_COLOR_SCALES

Built-in color scales for visualizations.

```typescript
HOCKEY_COLOR_SCALES.heatmap; // Blue → yellow → red
HOCKEY_COLOR_SCALES.ice; // Cool blues
HOCKEY_COLOR_SCALES.fire; // Warm oranges/reds
HOCKEY_COLOR_SCALES.diverging; // Blue → white → red
```

### createColorScale()

Creates a D3 sequential color scale.

```typescript
function createColorScale(
  domain: [number, number],
  colors?: string[],
): d3.ScaleSequential<string>;
```

### colorByTeam()

Creates accessor that returns team color.

```typescript
function colorByTeam(
  teamAccessor: keyof T | ((d: T) => string),
  options?: { colorType?: "primary" | "secondary" | "accent" },
): Accessor<T, string>;
```

### colorByProperty()

Maps property values to colors.

```typescript
function colorByProperty<T>(
  property: keyof T | ((d: T) => number),
  colors: string[],
  domain?: [number, number],
): Accessor<T, string>;
```

### colorByCategory()

Maps categories to colors.

```typescript
function colorByCategory<T>(
  property: keyof T | ((d: T) => string),
  colorMap: Record<string, string>,
  defaultColor?: string,
): Accessor<T, string>;
```

### colorByCondition()

Returns color based on first matching condition.

```typescript
function colorByCondition<T>(
  conditions: Array<[(d: T) => boolean, string]>,
  defaultColor: string,
): Accessor<T, string>;
```

### getShotResultColor()

Returns standard color for shot results.

```typescript
function getShotResultColor(result: "GOAL" | "SAVE" | "MISS" | "BLOCK"): string;
```

---

## Scale Utilities

### scaleRadiusByProperty()

Creates radius accessor scaled by property value.

```typescript
function scaleRadiusByProperty<T>(
  property: keyof T | ((d: T) => number),
  options?: { min?: number; max?: number; domain?: [number, number] },
): Accessor<T, number>;
```

### scaleOpacityByProperty()

Creates opacity accessor (0-1 range).

```typescript
function scaleOpacityByProperty<T>(
  property: keyof T | ((d: T) => number),
  options?: { min?: number; max?: number; domain?: [number, number] },
): Accessor<T, number>;
```

### scaleByProperty()

Linear scaling.

```typescript
function scaleByProperty<T>(
  property: keyof T | ((d: T) => number),
  options?: ScaleOptions,
): Accessor<T, number>;
```

### scaleSqrtByProperty()

Square root scaling (good for area-based sizing).

```typescript
function scaleSqrtByProperty<T>(
  property: keyof T | ((d: T) => number),
  options?: ScaleOptions,
): Accessor<T, number>;
```

### scaleLogByProperty()

Logarithmic scaling (good for wide-ranging values).

```typescript
function scaleLogByProperty<T>(
  property: keyof T | ((d: T) => number),
  options?: ScaleOptions,
): Accessor<T, number>;
```

### scaleByThresholds()

Discrete threshold-based scaling.

```typescript
function scaleByThresholds<T>(
  property: keyof T | ((d: T) => number),
  thresholds: Array<[number, number]>, // [threshold, output]
): Accessor<T, number>;
```

---

## See Also

- [Types](/api/types) — Type definitions
- [NHLDataManager](/api/types#nhldatamanager-types) — Higher-level data management
