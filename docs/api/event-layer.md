# EventLayer API

The `EventLayer` class renders individual hockey events (shots, goals, hits, etc.) as symbols on the rink with full customization support.

## Basic Usage

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

## Configuration

### EventLayerConfig

```typescript
interface EventLayerConfig<TData> {
  // Identification
  id: string;

  // Visibility
  visible?: boolean;
  opacity?: number;
  zIndex?: number;
  className?: string;

  // Data Accessors
  x?: Accessor<TData, number>;
  y?: Accessor<TData, number>;
  eventType?: Accessor<TData, string | null>;

  // Visual Properties
  radius?: number | Accessor<TData, number>;
  color?: string | Accessor<TData, string>;
  stroke?: string | Accessor<TData, string>;
  strokeWidth?: number;

  // Symbols
  symbol?: HockeyEventSymbolType | Accessor<TData, HockeyEventSymbolType>;
  symbolSize?: number | Accessor<TData, number>;

  // Tooltips
  showTooltip?: boolean;
  tooltip?: Accessor<TData, string>;

  // Animation
  animate?: boolean;
  animationDuration?: number;
  animationEasing?: AnimationEasing;

  // Advanced Customization
  customRender?: (
    selection: d3.Selection<SVGElement, TData, SVGGElement, unknown>,
    dimensions: RenderDimensions,
  ) => void;
  customAttributes?: {
    [key: string]: string | number | Accessor<TData, string | number>;
  };
}
```

## Properties

### Data Accessors

#### `x`

- **Type:** `Accessor<TData, number>`
- **Default:** Extracts from `d.coordinates.x`, `d.x`, or `d.details.xCoord`
- **Description:** Function to extract x-coordinate from your data

```typescript
x: (d) => d.coordinates.x;
```

#### `y`

- **Type:** `Accessor<TData, number>`
- **Default:** Extracts from `d.coordinates.y`, `d.y`, or `d.details.yCoord`
- **Description:** Function to extract y-coordinate from your data

```typescript
y: (d) => d.coordinates.y;
```

#### `eventType`

- **Type:** `Accessor<TData, string | null>`
- **Default:** Extracts from `d.typeDescKey`, `d.type`, `d.eventType`, or `d.event`
- **Description:** Function to extract event type for automatic symbol selection

```typescript
eventType: (d) => d.type;
```

### Visual Properties

#### `radius`

- **Type:** `number | Accessor<TData, number>`
- **Default:** `4`
- **Description:** Radius of the event marker in pixels

```typescript
// Static
radius: 6;

// Dynamic
radius: (d) => (d.speed > 90 ? 8 : 4);
```

#### `color`

- **Type:** `string | Accessor<TData, string>`
- **Default:** `"#c8102e"`
- **Description:** Fill color of the event marker

```typescript
// Static
color: "#FF4C00";

// Dynamic
color: (d) => (d.type === "GOAL" ? "#00FF00" : "#0088FF");
```

#### `stroke`

- **Type:** `string | Accessor<TData, string>`
- **Default:** `"#000000"`
- **Description:** Stroke color of the event marker

#### `strokeWidth`

- **Type:** `number`
- **Default:** `1`
- **Description:** Width of the stroke in pixels

### Symbols

#### `symbol`

- **Type:** `HockeyEventSymbolType | Accessor<TData, HockeyEventSymbolType>`
- **Default:** `"auto"` (based on event type)
- **Description:** Shape of the event marker

**Built-in D3 Symbols:**

- `"circle"`, `"cross"`, `"diamond"`, `"square"`, `"star"`, `"triangle"`, `"wye"`

**Custom Symbols:**

- `"HEXAGON"`, `"ARROW_UP"`, `"ARROW_RIGHT"` (from SYMBOL_PATHS)
- Any custom SVG path string: `"M0,-5 L5,5 L-5,5 Z"`

**Auto Mode:**

- `goal` → `star`
- `shot` → `circle`
- `blocked` → `cross`
- `hit` → `diamond`
- `giveaway`/`takeaway` → `square`

```typescript
// Static
symbol: "star";

// Dynamic
symbol: (d) => (d.type === "GOAL" ? "star" : "circle");

// Custom SVG path
symbol: "M0,-8 L8,8 L-8,8 Z";
```

#### `symbolSize`

- **Type:** `number | Accessor<TData, number>`
- **Default:** `64`
- **Description:** Area of the symbol in square pixels (used with D3 symbol generator)

::: tip
If you set `radius`, it takes precedence over `symbolSize`. The radius is converted to area using `Math.PI * radius * radius`.
:::

### Tooltips

#### `showTooltip`

- **Type:** `boolean`
- **Default:** `true`
- **Description:** Whether to show tooltips on hover

#### `tooltip`

- **Type:** `Accessor<TData, string>`
- **Default:** Shows event type and location
- **Description:** Function to generate tooltip HTML

```typescript
tooltip: (d) => `
  <strong>${d.player}</strong><br/>
  ${d.shotType}<br/>
  Speed: ${d.speed} MPH
`;
```

### Animation

#### `animate`

- **Type:** `boolean`
- **Default:** `true`
- **Description:** Enable enter/exit animations

#### `animationDuration`

- **Type:** `number`
- **Default:** `300`
- **Description:** Animation duration in milliseconds

#### `animationEasing`

- **Type:** `AnimationEasing`
- **Default:** `"easeCubicInOut"`
- **Description:** D3 easing function name

**Available easing functions:**

- `"easeLinear"`
- `"easeCubicIn"`, `"easeCubicOut"`, `"easeCubicInOut"`
- `"easeElasticIn"`, `"easeElasticOut"`, `"easeElasticInOut"`
- `"easeBounceIn"`, `"easeBounceOut"`, `"easeBounceInOut"`
- And many more D3 easing functions

```typescript
animate: true,
animationDuration: 800,
animationEasing: "easeElasticOut"
```

## Advanced Customization

### `customAttributes`

Add arbitrary SVG attributes to event elements.

```typescript
customAttributes: {
  'class': (d) => `shot-${d.type}`,
  'data-player': (d) => d.player,
  'data-speed': (d) => d.speed,
  'stroke-dasharray': '3,3',
  'opacity': (d) => d.speed / 100
}
```

**Common use cases:**

- Add CSS classes for styling
- Add data attributes for JavaScript access
- Override visual properties conditionally
- Add accessibility attributes

### `customRender`

Get full D3 selection access to create advanced visualizations.

```typescript
customRender: (selection, dimensions) => {
  // selection: D3 selection of event elements
  // dimensions: { scale, padding, width, height }

  selection.each(function (d) {
    // 'd' is your data
    // 'this' is the DOM element
  });
};
```

**What you can do:**

- Add child/sibling elements (labels, arrows, decorations)
- Create composite visualizations
- Add custom interactions (drag, click handlers)
- Conditional rendering based on data
- Connect events with lines
- Add animations

**Example: Add player labels**

```typescript
customRender: (selection, dimensions) => {
  selection.each(function (d) {
    const parent = d3.select(this.parentNode);
    const transform = d3.select(this).attr("transform");

    parent
      .append("text")
      .attr("transform", transform)
      .attr("dx", 10)
      .attr("dy", -10)
      .attr("font-size", "10px")
      .text(d.player);
  });
};
```

**Example: Add custom interactions**

```typescript
customRender: (selection) => {
  selection.on("click", (event, d) => {
    console.log("Clicked:", d);
    d3.select(event.target).transition().attr("stroke-width", 4);
  });
};
```

::: warning
`customRender` is called on every render/update. Keep operations efficient for large datasets.
:::

See [Advanced Customization Examples](/examples/advanced-customization) for more.

## Customization Levels

Choose the right level for your needs:

### Level 1: Configuration (Easiest)

```typescript
{ color: "#FF4C00", radius: 6, symbol: "star" }
```

### Level 2: Custom Attributes (Medium)

```typescript
{
  customAttributes: {
    'class': 'my-shot',
    'data-player': (d) => d.player
  }
}
```

### Level 3: Custom Render (Advanced)

```typescript
{
  customRender: (selection, dimensions) => {
    // Full D3 power!
  };
}
```

### Level 4: Custom Layer (Expert)

Extend `BaseLayer` for completely new layer types.

## Default Data Structure

EventLayer expects data with coordinates:

```typescript
interface DefaultEventData {
  coordinates: {
    x: number; // NHL coordinate (-100 to 100)
    y: number; // NHL coordinate (-42.5 to 42.5)
  };
  type?: string;
  player?: string;
  // ... any other properties
}
```

**Alternative structures:**

```typescript
// Direct properties
{ x: 75, y: 10, type: "GOAL" }

// NHL API format
{ details: { xCoord: 75, yCoord: 10 }, typeDescKey: "goal" }
```

You can use custom accessors if your data structure is different.

## Type Definitions

```typescript
type Accessor<TData, TReturn> = (d: TData, i: number) => TReturn;

type HockeyEventSymbolType =
  | "circle"
  | "cross"
  | "diamond"
  | "square"
  | "star"
  | "triangle"
  | "wye"
  | "HEXAGON"
  | "ARROW_UP"
  | "ARROW_RIGHT"
  | "auto"
  | string; // Custom SVG path

type AnimationEasing =
  | "easeLinear"
  | "easeCubicIn"
  | "easeCubicOut"
  | "easeCubicInOut"
  | "easeElasticIn"
  | "easeElasticOut"
  | "easeElasticInOut"
  | "easeBounceIn"
  | "easeBounceOut"
  | "easeBounceInOut"
  | string; // Any D3 easing function name

interface RenderDimensions {
  scale: number;
  padding: number;
  width: number;
  height: number;
}
```

## Examples

### Basic Shot Chart

```typescript
new Rink("#container").render().addEvents(shots, {
  id: "shots",
  color: "#FF4C00",
  radius: 5,
});
```

### Different Symbols by Event Type

```typescript
addEvents(events, {
  id: "events",
  symbol: (d) => {
    if (d.type === "GOAL") return "star";
    if (d.type === "BLOCKED") return "cross";
    return "circle";
  },
  color: (d) => (d.type === "GOAL" ? "#00FF00" : "#0088FF"),
});
```

### Dynamic Sizing by xG

```typescript
import { scaleRadiusByProperty } from "d3-hockey";

addEvents(shots, {
  id: "xg-shots",
  radius: scaleRadiusByProperty("xG", {
    min: 3,
    max: 15,
    domain: [0, 1],
  }),
  color: "#c8102e",
  opacity: 0.7,
});
```

### Custom Tooltips

```typescript
addEvents(shots, {
  id: "detailed-shots",
  tooltip: (d) => `
    <strong>${d.player}</strong><br/>
    ${d.shotType} - ${d.result}<br/>
    Speed: ${d.speed} MPH<br/>
    xG: ${(d.xG * 100).toFixed(1)}%
  `,
});
```

### With Custom Attributes

```typescript
addEvents(shots, {
  id: "tracked-shots",
  customAttributes: {
    class: (d) => `shot-${d.type.toLowerCase()}`,
    "data-player-id": (d) => d.playerId,
    "data-timestamp": (d) => d.timestamp,
  },
});
```

### Advanced Custom Rendering

```typescript
addEvents(shots, {
  id: "custom-shots",
  customRender: (selection, dimensions) => {
    // Add speed rings
    selection.each(function (d) {
      const parent = d3.select(this.parentNode);
      const transform = d3.select(this).attr("transform");
      const ringRadius = (d.speed / 100) * 15;

      parent
        .append("circle")
        .attr("transform", transform)
        .attr("r", ringRadius)
        .attr("fill", "none")
        .attr("stroke", "#2196F3")
        .attr("stroke-dasharray", "3,3")
        .attr("opacity", 0.6);
    });
  },
});
```

## See Also

- [Shot Charts Examples](/examples/shot-charts)
- [Advanced Customization](/examples/advanced-customization)
- [BaseLayer API](/api/base-layer)
- [Rink API](/api/rink)
- [Utility Functions](/api/utilities)
