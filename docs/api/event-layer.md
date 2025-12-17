# EventLayer API

Renders individual events (shots, goals, hits, etc.) as symbols on the rink.

## Usage

```typescript
// Via Rink (recommended)
rink.addEvents(data, config);

// Direct instantiation
import { EventLayer } from "d3-hockey";
const layer = new EventLayer(data, config);
rink.addLayer(layer);
```

## EventLayerConfig

```typescript
interface EventLayerConfig<TData> extends BaseLayerConfig {
  // Data accessors
  x?: Accessor<TData, number>; // Default: (d) => d.coordinates?.x
  y?: Accessor<TData, number>; // Default: (d) => d.coordinates?.y
  eventType?: Accessor<TData, string | null>; // Default: (d) => d.type

  // Visual properties
  radius?: number | Accessor<TData, number>; // Default: 4
  color?: string | Accessor<TData, string>; // Default: "#FF4C00"
  stroke?: string | Accessor<TData, string>; // Default: "#000000"
  strokeWidth?: number; // Default: 1

  // Symbol
  symbol?: HockeyEventSymbolType | Accessor<TData, HockeyEventSymbolType>; // Default: "auto"
  symbolSize?: number | Accessor<TData, number>; // Default: 64 (area in px²)

  // Tooltip
  showTooltip?: boolean; // Default: true
  tooltip?: Accessor<TData, string>; // Default: shows type & location

  // Animation
  animate?: boolean; // Default: true
  animationDuration?: number; // Default: 300
  animationEasing?: AnimationEasing; // Default: "easeCubicInOut"

  // Interaction
  onClick?: (event: MouseEvent, d: TData, index: number) => void;
  onHover?: (event: MouseEvent, d: TData, index: number) => void;
  onMouseOut?: (event: MouseEvent, d: TData, index: number) => void;

  // Advanced
  customRender?: (
    selection,
    dimensions,
    context: EventRenderContext<TData>,
  ) => void;
  customAttributes?: Record<
    string,
    string | number | Accessor<TData, string | number>
  >;

  // Legend
  legendLabel?: string;
  legendColor?: string;
  legendSymbol?: HockeyEventSymbolType;
}
```

## Types

### EventRenderContext

Context passed to `customRender`:

```typescript
interface EventRenderContext<TData, TLayer = EventLayer<TData>> {
  position: {
    svgX: number; // SVG pixel X
    svgY: number; // SVG pixel Y
    dataX: number; // NHL coordinate X
    dataY: number; // NHL coordinate Y
  };
  data: TData;
  index: number;
  container: SVGGElement;
  layer: TLayer;
}
```

## Auto Symbol Mapping

When `symbol: "auto"` (default), symbols are chosen by event type:

| Event Type                    | Symbol     |
| ----------------------------- | ---------- |
| `goal`                        | `star`     |
| `shot-on-goal`, `shot`        | `circle`   |
| `blocked-shot`, `missed-shot` | `cross`    |
| `hit`                         | `diamond`  |
| `giveaway`, `takeaway`        | `square`   |
| `penalty`                     | `triangle` |

## Examples

**Basic:**

```typescript
rink.addEvents(shots, { id: "shots", color: "blue", radius: 5 });
```

**Dynamic styling:**

```typescript
rink.addEvents(shots, {
  id: "shots",
  color: (d) => (d.type === "goal" ? "gold" : "blue"),
  radius: (d) => d.xG * 10,
  symbol: (d) => (d.type === "goal" ? "star" : "circle"),
});
```

**Custom tooltip:**

```typescript
rink.addEvents(shots, {
  id: "shots",
  tooltip: (d) => `<strong>${d.player}</strong><br/>xG: ${d.xG.toFixed(2)}`,
});
```

**Custom render (add labels):**

```typescript
rink.addEvents(goals, {
  id: "goals",
  customRender: (selection, dimensions, ctx) => {
    d3.select(ctx.container)
      .append("text")
      .attr("x", ctx.position.svgX + 8)
      .attr("y", ctx.position.svgY + 4)
      .attr("font-size", "10px")
      .text(ctx.data.player);
  },
});
```

## Inherited Methods

From [BaseLayer](/api/base-layer): `render()`, `update(data)`, `show()`, `hide()`, `destroy()`, `getConfig()`, `updateConfig(config)`

## See Also

- [BaseLayerConfig](/api/base-layer#baselayerconfig) — Base configuration
- [Accessor](/api/types#accessor), [HockeyEventSymbolType](/api/types#hockeyeventsymboltype), [AnimationEasing](/api/types#animationeasing) — Core types
- [Shot Chart Examples](/examples/shot-charts) — Interactive examples
- [Advanced Customization](/examples/advanced-customization) — customRender patterns
