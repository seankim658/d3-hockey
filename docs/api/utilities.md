# Utilities API

d3-hockey provides a set of utility functions for working with hockey data, coordinates, colors, and scales. All utilities are exported from the main package.

## Import

```typescript
import {
  // Coordinate utilities
  nhlToSVG,
  flipCoordinatesByPeriod,
  getZone,

  // Data utilities
  parseNHLAPIResponse,
  filterByZone,

  // Color utilities
  NHL_TEAM_COLORS,
  getTeamColors,
  colorByTeam,

  // Scale utilities
  scaleRadiusByProperty,
  scaleOpacityByProperty,
} from "d3-hockey";
```

---

## Coordinate Utilities

Functions for transforming coordinates between NHL API format and SVG rendering coordinates.

### nhlToSVG()

Converts NHL API coordinates (center-origin) to SVG coordinates (top-left origin).

```typescript
function nhlToSVG(
  coords: NHLCoordinate,
  dimensions: RenderDimensions,
): SVGCoordinate;
```

**Parameters**:

- **coords**: NHL coordinate with `{ x, y }` in feet
- **dimensions**: Rendering dimensions with scale factor

**Returns**: SVG coordinate in pixels

**Example**:

```typescript
const nhlCoords = { x: 75, y: 10 };
const dimensions = {
  scale: 4,
  padding: 20,
  width: 800,
  height: 400,
};

const svgCoords = nhlToSVG(nhlCoords, dimensions);
// { x: 720, y: 150 } (approximately)
```

---

### svgToNHL()

Converts SVG coordinates (top-left origin) to NHL API coordinates (center-origin).

```typescript
function svgToNHL(
  coords: SVGCoordinate,
  dimensions: RenderDimensions,
): NHLCoordinate;
```

**Parameters**:

- **coords**: SVG coordinate with `{ x, y }` in pixels
- **dimensions**: Rendering dimensions with scale factor

**Returns**: NHL coordinate in feet

**Example**:

```typescript
const svgCoords = { x: 600, y: 200 };
const nhlCoords = svgToNHL(svgCoords, dimensions);
// { x: 45, y: 5 } (approximately)
```

**Use Case**: Converting mouse click positions to NHL coordinates for analysis.

---

### flipCoordinatesByPeriod()

Flips coordinates based on the period (teams switch ends).

```typescript
function flipCoordinatesByPeriod(
  coords: NHLCoordinate,
  period: number,
): NHLCoordinate;
```

**Parameters**:

- **coords**: NHL coordinate to transform
- **period**: Period number (1, 2, 3, etc.)

**Returns**: Normalized NHL coordinate

**Example**:

```typescript
// Team shoots right in period 1, left in period 2
const p1Coords = { x: 75, y: 10 };
const p2Coords = { x: 75, y: 10 };

const normalized1 = flipCoordinatesByPeriod(p1Coords, 1);
// { x: 75, y: 10 } - unchanged in period 1

const normalized2 = flipCoordinatesByPeriod(p2Coords, 2);
// { x: -75, y: -10 } - flipped in period 2
```

**Note**: Essential for comparing shots from different periods, as teams attack opposite ends.

---

### normalizeCoordinate()

Ensures coordinates are within valid NHL rink bounds.

```typescript
function normalizeCoordinate(coord: NHLCoordinate): NHLCoordinate;
```

**Parameters**:

- **coord**: Coordinate to normalize

**Returns**: Clamped coordinate within valid bounds

**Example**:

```typescript
const invalid = { x: 150, y: 60 }; // Out of bounds
const normalized = normalizeCoordinate(invalid);
// { x: 100, y: 42.5 } - clamped to max values
```

---

### calculateScale()

Calculates the feet-to-pixels conversion scale factor.

```typescript
function calculateScale(width: number, height: number, padding: number): number;
```

**Parameters**:

- **width**: SVG width in pixels
- **height**: SVG height in pixels
- **padding**: Padding in pixels

**Returns**: Scale factor (pixels per foot)

**Example**:

```typescript
const scale = calculateScale(800, 400, 20);
// scale ≈ 3.8 (pixels per foot)
```

---

### getDistance()

Calculates Euclidean distance between two coordinates.

```typescript
function getDistance(coord1: NHLCoordinate, coord2: NHLCoordinate): number;
```

**Parameters**:

- **coord1**: First coordinate
- **coord2**: Second coordinate

**Returns**: Distance in feet

**Example**:

```typescript
const shot = { x: 75, y: 10 };
const net = { x: 89, y: 0 };

const distance = getDistance(shot, net);
// distance ≈ 15.65 feet from net
```

---

### getZone()

Determines which rink zone a coordinate is in.

```typescript
function getZone(coord: NHLCoordinate): "offensive" | "neutral" | "defensive";
```

**Parameters**:

- **coord**: NHL coordinate

**Returns**: Zone name

**Example**:

```typescript
getZone({ x: 75, y: 10 }); // "offensive"
getZone({ x: 0, y: 0 }); // "neutral"
getZone({ x: -75, y: -10 }); // "defensive"
```

**Zone Definitions**:

- **Offensive**: x > 25 (past attacking blue line)
- **Neutral**: -25 ≤ x ≤ 25 (between blue lines)
- **Defensive**: x < -25 (behind defending blue line)

---

## Data Utilities

Functions for processing, filtering, and analyzing hockey event data.

### parseNHLAPIResponse()

Parses a complete NHL API game response and extracts events with location data.

```typescript
function parseNHLAPIResponse(response: any): NHLEvent[];
```

**Parameters**:

- **response**: NHL API play-by-play response object

**Returns**: Array of parsed events with coordinates

**Example**:

```typescript
const response = await fetch(
  "https://api-web.nhle.com/v1/gamecenter/2023020001/play-by-play",
).then((r) => r.json());

const events = parseNHLAPIResponse(response);
// Array of all events with location data
```

---

### parseNHLAPIEventArray()

Parses an array of NHL API events.

```typescript
function parseNHLAPIEventArray(events: any[]): NHLEvent[];
```

**Parameters**:

- **events**: Array of NHL API event objects

**Returns**: Array of parsed events

**Example**:

```typescript
const rawEvents = gameData.plays;
const parsed = parseNHLAPIEventArray(rawEvents);
```

---

### validateCoordinates()

Validates that data has valid coordinate information.

```typescript
function validateCoordinates<T>(data: T[]): T[];
```

**Parameters**:

- **data**: Array of data to validate

**Returns**: Filtered array with only valid coordinates

**Example**:

```typescript
const shots = [
  { coordinates: { x: 75, y: 10 } },
  { coordinates: { x: null, y: null } }, // Invalid
  { coordinates: { x: 80, y: -5 } },
];

const valid = validateCoordinates(shots);
// Returns only the 2 valid shots
```

---

### filterByZone()

Filters events by rink zone.

```typescript
function filterByZone<T extends { coordinates: NHLCoordinate }>(
  data: T[],
  zone: "offensive" | "neutral" | "defensive",
): T[];
```

**Parameters**:

- **data**: Array of events
- **zone**: Zone to filter by

**Returns**: Filtered array

**Example**:

```typescript
const allShots = [...];
const offensiveShots = filterByZone(allShots, "offensive");
```

---

### filterByTeam()

Filters events by team.

```typescript
function filterByTeam<T>(
  data: T[],
  team: string,
  accessor?: (d: T) => string,
): T[];
```

**Parameters**:

- **data**: Array of events
- **team**: Team identifier (abbreviation or name)
- **accessor**: Optional function to extract team from data

**Returns**: Filtered array

**Example**:

```typescript
const allShots = [
  { team: "WSH", coordinates: { x: 75, y: 10 } },
  { team: "PIT", coordinates: { x: -75, y: -10 } },
];

const wshShots = filterByTeam(allShots, "WSH");
// Returns only WSH shots
```

---

### filterByPeriod()

Filters events by period.

```typescript
function filterByPeriod<T>(
  data: T[],
  period: number,
  accessor?: (d: T) => number,
): T[];
```

**Parameters**:

- **data**: Array of events
- **period**: Period number
- **accessor**: Optional function to extract period from data

**Returns**: Filtered array

**Example**:

```typescript
const firstPeriodShots = filterByPeriod(allShots, 1);
```

---

### groupBy()

Groups data by a property value.

```typescript
function groupBy<T>(
  data: T[],
  key: keyof T | ((d: T) => string | number),
): Map<string | number, T[]>;
```

**Parameters**:

- **data**: Array to group
- **key**: Property name or accessor function

**Returns**: Map of groups

**Example**:

```typescript
const shots = [
  { team: "WSH", type: "GOAL" },
  { team: "PIT", type: "SHOT" },
  { team: "WSH", type: "SHOT" },
];

// Group by team
const byTeam = groupBy(shots, "team");
// Map { "WSH" => [...], "PIT" => [...] }

// Group by custom function
const byZone = groupBy(shots, (d) => getZone(d.coordinates));
```

---

### calculateStats()

Calculates summary statistics for numeric data.

```typescript
function calculateStats<T>(
  data: T[],
  accessor: (d: T) => number,
): {
  count: number;
  sum: number;
  mean: number;
  min: number;
  max: number;
  median: number;
};
```

**Parameters**:

- **data**: Array of data
- **accessor**: Function to extract numeric value

**Returns**: Statistics object

**Example**:

```typescript
const shots = [
  { xG: 0.15, distance: 25 },
  { xG: 0.45, distance: 15 },
  { xG: 0.05, distance: 45 },
];

const xGStats = calculateStats(shots, (d) => d.xG);
// {
//   count: 3,
//   sum: 0.65,
//   mean: 0.217,
//   min: 0.05,
//   max: 0.45,
//   median: 0.15
// }
```

---

## Color Utilities

Utilities for working with team colors and creating color scales.

### NHL_TEAM_COLORS

Complete color palette for all 32 NHL teams.

```typescript
const NHL_TEAM_COLORS: {
  [teamCode: string]: {
    primary: string;
    secondary: string;
    accent: string;
  };
};
```

**Example**:

```typescript
import { NHL_TEAM_COLORS } from "d3-hockey";

console.log(NHL_TEAM_COLORS.WSH);
// {
//   primary: "#c8102e",
//   secondary: "#003e7e",
//   accent: "#ffffff"
// }
```

**Available Teams**: All 32 current NHL teams by their 3-letter code.

---

### getTeamColors()

Gets the complete color palette for a team.

```typescript
function getTeamColors(teamCode: string): {
  primary: string;
  secondary: string;
  accent: string;
};
```

**Example**:

```typescript
const colors = getTeamColors("WSH");
// { primary: "#c8102e", secondary: "#003e7e", accent: "#ffffff" }
```

---

### getTeamPrimaryColor()

Gets just the primary color for a team.

```typescript
function getTeamPrimaryColor(teamCode: string): string;
```

**Example**:

```typescript
const red = getTeamPrimaryColor("WSH");
// "#c8102e"
```

---

### HOCKEY_COLOR_SCALES

Pre-configured color scales for common hockey visualizations.

```typescript
const HOCKEY_COLOR_SCALES: {
  heatRed: string[]; // Heat map (cold to hot)
  heatBlue: string[]; // Inverse heat map
  shotResult: {
    // Shot result colors
    goal: string;
    shot: string;
    miss: string;
    block: string;
  };
  danger: string[]; // Low to high danger
};
```

**Example**:

```typescript
import { HOCKEY_COLOR_SCALES } from "d3-hockey";

// Use shot result colors
const color = HOCKEY_COLOR_SCALES.shotResult.goal; // "#FFD700"
```

---

### createColorScale()

Creates a D3 color scale.

```typescript
function createColorScale(
  type: "linear" | "sequential" | "diverging",
  domain?: [number, number],
  colors?: string[],
): d3.ScaleLinear<string, string>;
```

**Parameters**:

- **type**: Scale type
- **domain**: Optional input range (default: [0, 1])
- **colors**: Optional color array (uses defaults if not provided)

**Returns**: D3 color scale function

**Example**:

```typescript
const xGScale = createColorScale("linear", [0, 1], ["blue", "red"]);

shots.forEach((shot) => {
  const color = xGScale(shot.xG);
});
```

---

### getShotResultColor()

Gets standard color for a shot result.

```typescript
function getShotResultColor(result: "GOAL" | "SHOT" | "MISS" | "BLOCK"): string;
```

**Example**:

```typescript
const color = getShotResultColor("GOAL"); // "#FFD700" (gold)
```

---

### getOpacity()

Calculates opacity based on a value and range.

```typescript
function getOpacity(value: number, range?: [number, number]): number;
```

**Parameters**:

- **value**: Input value
- **range**: Min and max values (default: [0, 1])

**Returns**: Opacity value between 0 and 1

**Example**:

```typescript
const opacity = getOpacity(0.5, [0, 1]); // 0.5
```

---

### colorByProperty()

Creates a color accessor that scales by a data property.

```typescript
function colorByProperty<T>(
  property: keyof T,
  scale?: d3.ScaleLinear<string, string>,
): Accessor<T, string>;
```

**Example**:

```typescript
rink.addEvents(shots, {
  id: "shots",
  color: colorByProperty("xG", createColorScale("linear", [0, 1])),
});
```

---

### colorByTeam()

Creates a color accessor that uses team colors.

```typescript
function colorByTeam<T>(teamAccessor?: (d: T) => string): Accessor<T, string>;
```

**Example**:

```typescript
rink.addEvents(shots, {
  id: "shots",
  color: colorByTeam((d) => d.team), // Automatic team colors
});
```

---

### colorByCategory()

Creates a color accessor for categorical data.

```typescript
function colorByCategory<T>(
  categories: Map<string, string> | { [key: string]: string },
): Accessor<T, string>;
```

**Example**:

```typescript
const typeColors = {
  GOAL: "gold",
  SHOT: "blue",
  MISS: "gray",
  BLOCK: "red",
};

rink.addEvents(shots, {
  id: "shots",
  color: colorByCategory(typeColors),
});
```

---

### colorGradient()

Creates a color gradient accessor.

```typescript
function colorGradient<T>(
  startColor: string,
  endColor: string,
  accessor: (d: T) => number,
): Accessor<T, string>;
```

**Example**:

```typescript
rink.addEvents(shots, {
  id: "shots",
  color: colorGradient("#0000ff", "#ff0000", (d) => d.xG),
});
```

---

### colorByCondition()

Creates a conditional color accessor.

```typescript
function colorByCondition<T>(
  conditions: Array<[(d: T) => boolean, string]>,
  defaultColor?: string,
): Accessor<T, string>;
```

**Example**:

```typescript
rink.addEvents(shots, {
  id: "shots",
  color: colorByCondition(
    [
      [(d) => d.type === "GOAL", "gold"],
      [(d) => d.xG > 0.3, "red"],
      [(d) => d.xG > 0.1, "orange"],
    ],
    "blue",
  ), // default color
});
```

---

## Scale Utilities

Functions for scaling visual properties based on data values.

### scaleRadiusByProperty()

Creates a radius accessor that scales by a data property.

```typescript
function scaleRadiusByProperty<T>(
  property: keyof T | ((d: T) => number),
  options?: RadiusScaleOptions,
): Accessor<T, number>;
```

**Options**:

```typescript
interface RadiusScaleOptions {
  min?: number; // Minimum radius (default: 2)
  max?: number; // Maximum radius (default: 10)
  domain?: [number, number]; // Input data range
  range?: [number, number]; // Output radius range
}
```

**Example**:

```typescript
rink.addEvents(shots, {
  id: "shots",
  radius: scaleRadiusByProperty("xG", {
    min: 3,
    max: 15,
    domain: [0, 1],
  }),
});
```

---

### scaleOpacityByProperty()

Creates an opacity accessor that scales by a data property.

```typescript
function scaleOpacityByProperty<T>(
  property: keyof T | ((d: T) => number),
  options?: OpacityScaleOptions,
): Accessor<T, number>;
```

**Example**:

```typescript
rink.addEvents(shots, {
  id: "shots",
  opacity: scaleOpacityByProperty("danger", {
    min: 0.2,
    max: 1,
    domain: [0, 100],
  }),
});
```

---

### scaleByProperty()

General-purpose linear scaling by property.

```typescript
function scaleByProperty<T>(
  property: keyof T | ((d: T) => number),
  options?: ScaleOptions,
): Accessor<T, number>;
```

---

### scaleSqrtByProperty()

Square root scaling (good for areas/circles).

```typescript
function scaleSqrtByProperty<T>(
  property: keyof T | ((d: T) => number),
  options?: ScaleOptions,
): Accessor<T, number>;
```

---

### scaleLogByProperty()

Logarithmic scaling (good for wide-ranging values).

```typescript
function scaleLogByProperty<T>(
  property: keyof T | ((d: T) => number),
  options?: ScaleOptions,
): Accessor<T, number>;
```

---

### scaleByThresholds()

Threshold-based scaling (discrete steps).

```typescript
function scaleByThresholds<T>(
  thresholds: Array<[number, number]>,
): Accessor<T, number>;
```

**Example**:

```typescript
const thresholds: Array<[number, number]> = [
  [0, 3], // 0-0.2 => radius 3
  [0.2, 6], // 0.2-0.5 => radius 6
  [0.5, 10], // 0.5+ => radius 10
];

rink.addEvents(shots, {
  id: "shots",
  radius: scaleByThresholds(thresholds),
});
```

---

## Complete Usage Example

Combining multiple utilities:

```typescript
import {
  Rink,
  parseNHLAPIResponse,
  flipCoordinatesByPeriod,
  filterByZone,
  getTeamPrimaryColor,
  scaleRadiusByProperty,
  colorByCondition,
} from "d3-hockey";

// Fetch and parse NHL data
const response = await fetch("...").then((r) => r.json());
const allEvents = parseNHLAPIResponse(response);

// Normalize coordinates for period
const normalized = allEvents.map((event) => ({
  ...event,
  coordinates: flipCoordinatesByPeriod(event.coordinates, event.period),
}));

// Filter to offensive zone shots
const shots = filterByZone(normalized, "offensive");

// Render with dynamic properties
new Rink("#container").render().addEvents(shots, {
  id: "shots",
  color: colorByCondition(
    [
      [(d) => d.typeDescKey === "goal", "gold"],
      [(d) => d.details?.xG > 0.3, "red"],
    ],
    getTeamPrimaryColor("WSH"),
  ),
  radius: scaleRadiusByProperty("xG", {
    min: 3,
    max: 12,
    domain: [0, 1],
  }),
  tooltip: (d) => `
      ${d.details?.shootingPlayerFullName}<br/>
      xG: ${(d.details?.xG * 100).toFixed(1)}%<br/>
      Distance: ${d.details?.distance} ft
    `,
});
```

## See Also

- [Types API](/api/types) - Type definitions for utilities
- [Rink API](/api/rink) - Using utilities with Rink
- [EventLayer API](/api/event-layer) - Accessor patterns
- [Examples](/examples/) - Real-world usage examples
