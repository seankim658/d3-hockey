# Types API

Core TypeScript definitions from `src/types/types.ts` and NHL types from `src/nhl/types.ts`.

For layer-specific types, see [EventLayer](/api/event-layer) and [HexbinLayer](/api/hexbin-layer).

## Coordinate Types

### NHLCoordinate

NHL API coordinate system (center-origin, feet).

```typescript
interface NHLCoordinate {
  x: number; // -100 to 100 (longitudinal)
  y: number; // -42.5 to 42.5 (lateral)
}
```

### SVGCoordinate

SVG coordinate system (top-left origin, pixels).

```typescript
interface SVGCoordinate {
  x: number;
  y: number;
}
```

### PeriodInfo

```typescript
interface PeriodInfo {
  period: number;
  isOffensiveZone?: boolean;
}
```

---

## Data Types

### HockeyEvent

Default event structure. Use accessors for custom structures.

```typescript
interface HockeyEvent {
  coordinates: NHLCoordinate;
  period?: number;
  type?: string;
  team?: string;
  player?: string;
  id?: string | number;
  [key: string]: unknown;
}
```

### Accessor

```typescript
type Accessor<TData, TReturn> = (d: TData, i: number) => TReturn;
```

### HockeyEventSymbolType

```typescript
type HockeyEventSymbolType =
  | "circle"
  | "cross"
  | "diamond"
  | "square"
  | "star"
  | "triangle"
  | "wye"
  | "auto"
  | "HEXAGON"
  | "ARROW_UP"
  | "ARROW_RIGHT"
  | string; // Custom SVG path
```

### AnimationEasing

D3 easing function names. Common values:

```typescript
type AnimationEasing =
  | "easeLinear"
  | "easeCubicIn"
  | "easeCubicOut"
  | "easeCubicInOut"
  | "easeElasticOut"
  | "easeBounceOut"
  | string; // Any D3 easing name
```

See [D3 Easing](https://d3js.org/d3-ease) for full list.

---

## Rink Configuration

### RinkConfig

```typescript
interface RinkConfig {
  width?: number; // Default: 800
  height?: number; // Default: 400
  padding?: number; // Default: 20
  halfRink?: boolean; // Default: false
  halfRinkEnd?: "offensive" | "defensive"; // Default: "offensive"
  vertical?: boolean; // Default: false
  colors?: Partial<RinkColors>;
}
```

### RinkColors

```typescript
interface RinkColors {
  ice: string; // Default: "#f0f4f8"
  boards: string; // Default: "#000000"
  redLine: string; // Default: "#c8102e"
  blueLine: string; // Default: "#003e7e"
  faceoff: string; // Default: "#c8102e"
  centerSpot: string; // Default: "#003e7e"
  crease: string; // Default: "#7db9de"
  line: string; // Default: "#000000"
}
```

### RenderDimensions

Passed to layer render methods.

```typescript
interface RenderDimensions {
  width: number;
  height: number;
  padding: number;
  scale: number; // Feet-to-pixels conversion
}
```

---

## NHL API Types

### NHLEvent

```typescript
type NHLEvent = NHLEventWithLocation | NHLEventWithoutLocation;

type NHLEventWithLocation =
  | GoalEvent
  | ShotOnGoalEvent
  | MissedShotEvent
  | BlockedShotEvent
  | HitEvent
  | GiveawayEvent
  | TakeawayEvent
  | PenaltyEvent;
```

### Event Interfaces

All extend `NHLBaseEvent` with `typeDescKey` and `details`:

| Type               | `typeDescKey`    | Key Details                                      |
| ------------------ | ---------------- | ------------------------------------------------ |
| `GoalEvent`        | `"goal"`         | `scoringPlayerId`, `shotType`, `assist1PlayerId` |
| `ShotOnGoalEvent`  | `"shot-on-goal"` | `shootingPlayerId`, `goalieInNetId`              |
| `MissedShotEvent`  | `"missed-shot"`  | `shootingPlayerId`, `reason`                     |
| `BlockedShotEvent` | `"blocked-shot"` | `shootingPlayerId`, `blockingPlayerId`           |
| `HitEvent`         | `"hit"`          | `hittingPlayerId`, `hitteePlayerId`              |
| `GiveawayEvent`    | `"giveaway"`     | `playerId`                                       |
| `TakeawayEvent`    | `"takeaway"`     | `playerId`                                       |
| `PenaltyEvent`     | `"penalty"`      | `committedByPlayerId`, `duration`                |

### NHLPlayByPlayResponse

```typescript
interface NHLPlayByPlayResponse {
  id: number;
  season: number;
  gameType: number;
  gameDate: string;
  venue: { default: string };
  awayTeam: NHLTeamInfo;
  homeTeam: NHLTeamInfo;
  plays: NHLEvent[];
  rosterSpots?: NHLPlayerInfo[];
}
```

### Type Guards

```typescript
hasLocation(event): event is NHLEventWithLocation
isGoal(event): event is GoalEvent
isShotOnGoal(event): event is ShotOnGoalEvent
isMissedShot(event): event is MissedShotEvent
isBlockedShot(event): event is BlockedShotEvent
isHit(event): event is HitEvent
isGiveaway(event): event is GiveawayEvent
isTakeaway(event): event is TakeawayEvent
isPenalty(event): event is PenaltyEvent
isShotEvent(event): boolean  // Any shot-related event
```

---

## NHLDataManager Types

### FetchOptions

```typescript
interface FetchOptions {
  baseUrl?: string; // Default: "https://api-web.nhle.com/v1"
  flipCoordinates?: boolean; // Default: true
  flipOddPeriods?: boolean; // Default: false
}
```

### TeamData

```typescript
interface TeamData {
  id: number;
  abbrev: string;
  name: string;
  colors: TeamColors;
  events: HockeyEvent[];
}
```

### ParseOptions

```typescript
interface ParseOptions {
  teamId?: number;
  eventTypes?: string[];
  periods?: number[];
  shotsOnly?: boolean;
}
```

---

## See Also

- [EventLayer](/api/event-layer) — `EventLayerConfig`, `EventRenderContext`
- [HexbinLayer](/api/hexbin-layer) — `HexbinLayerConfig`, `HexbinRenderContext`, aggregation types
- [BaseLayer](/api/base-layer) — `BaseLayerConfig`
