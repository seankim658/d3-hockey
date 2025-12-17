# HexbinLayer API

Hexagonal binning layer for density maps and aggregated visualizations.

## Usage

```typescript
// Via Rink (recommended)
rink.addHexbin(data, config);

// Direct instantiation
import { HexbinLayer } from "d3-hockey";
const layer = new HexbinLayer(data, config);
rink.addLayer(layer);
```

## HexbinLayerConfig

```typescript
interface HexbinLayerConfig<TData> extends BaseLayerConfig {
  // Data accessors
  x?: Accessor<TData, number>; // Default: (d) => d.coordinates?.x ?? 0
  y?: Accessor<TData, number>; // Default: (d) => d.coordinates?.y ?? 0
  value?: Accessor<TData, number>; // Default: () => 1

  // Hexagon properties
  radius?: number; // Grid radius in feet (default: 4)
  radiusScale?: [number, number]; // [min, max] for size scaling (default: [0, 0] = no scaling)

  // Aggregation
  aggregation?: BuiltInAggregation | AggregationFunction<TData>; // Default: "count"

  // Visual
  colorScale?: d3.ScaleSequential<string> | d3.ScaleLinear<string, string>;
  stroke?: string | ((bin: HexbinBin, i: number) => string); // Default: "none"
  strokeWidth?: number; // Default: 0.5

  // Tooltip
  showTooltip?: boolean; // Default: true
  tooltip?: (bin: HexbinBin, value: number) => string;

  // Animation
  animate?: boolean; // Default: true
  animationDuration?: number; // Default: 500
  animationEasing?: AnimationEasing; // Default: "easeCubicOut"

  // Interaction
  onClick?: (event: MouseEvent, bin: HexbinBin, value: number) => void;
  onHover?: (event: MouseEvent, bin: HexbinBin, value: number) => void;
  onMouseOut?: (event: MouseEvent, bin: HexbinBin, value: number) => void;

  // Advanced
  customRender?: (
    selection,
    dimensions,
    context: HexbinRenderContext<TData>,
  ) => void;
  customAttributes?: Record<string, string | number | Function>;
}
```

## Types

### BuiltInAggregation

```typescript
type BuiltInAggregation = "count" | "mean" | "sum" | "min" | "max" | "median";
```

### AggregationFunction

```typescript
type AggregationFunction<TData> = (
  values: number[],
  dataPoints: TData[],
) => number;
```

### HexbinRenderContext

```typescript
interface HexbinRenderContext<TData> {
  bin: HexbinBin<[number, number, TData]>;
  value: number;
  index: number;
  position: { svgX: number; svgY: number };
  container: SVGGElement;
  layer: HexbinLayer<TData>;
}
```

## Built-in Color Scales

```typescript
import { HOCKEY_COLOR_SCALES } from "d3-hockey";

HOCKEY_COLOR_SCALES.heatmap; // Blue → yellow → red (default)
HOCKEY_COLOR_SCALES.ice; // Cool blues
HOCKEY_COLOR_SCALES.fire; // Warm oranges/reds
HOCKEY_COLOR_SCALES.diverging; // Blue → white → red
```

## Examples

**Basic density:**

```typescript
rink.addHexbin(shots, { id: "density", radius: 4 });
```

**Average metric:**

```typescript
rink.addHexbin(shots, {
  id: "avg-xg",
  value: (d) => d.xG,
  aggregation: "mean",
  colorScale: d3.scaleSequential(d3.interpolateViridis),
});
```

**Custom aggregation:**

```typescript
const shootingPct: AggregationFunction<Shot> = (values, points) => {
  const goals = points.filter((p) => p.result === "GOAL").length;
  return points.length > 0 ? goals / points.length : 0;
};

rink.addHexbin(shots, { aggregation: shootingPct });
```

## Inherited Methods

From [BaseLayer](/api/base-layer): `render()`, `update(data)`, `show()`, `hide()`, `destroy()`, `getConfig()`, `updateConfig(config)`

## See Also

- [BaseLayerConfig](/api/base-layer#baselayerconfig) — Base configuration
- [Accessor](/api/types#accessor), [AnimationEasing](/api/types#animationeasing) — Core types
- [Hexbin Examples](/examples/hexbin-layer) — Interactive examples
