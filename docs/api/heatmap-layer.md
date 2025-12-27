# HeatmapLayer API

Continuous density visualization using Kernel Density Estimation (KDE). Creates smooth color gradients representing data concentration.

## Usage

```typescript
// Via Rink (recommended)
rink.addHeatmap(data, config);

// Direct instantiation
import { HeatmapLayer } from "d3-hockey";
const layer = new HeatmapLayer(data, config);
rink.addLayer(layer);
```

## When to Use

| Layer            | Best For                                                              |
| ---------------- | --------------------------------------------------------------------- |
| **HeatmapLayer** | Smooth density visualization, large datasets, identifying "hot zones" |
| **HexbinLayer**  | Aggregated statistics, precise counts, discrete binning               |
| **EventLayer**   | Individual event display, small datasets, detailed tooltips           |

## HeatmapLayerConfig

```typescript
interface HeatmapLayerConfig<TData> extends BaseLayerConfig {
  // Data accessors
  x?: Accessor<TData, number>; // Default: (d) => d.coordinates?.x
  y?: Accessor<TData, number>; // Default: (d) => d.coordinates?.y
  weight?: Accessor<TData, number>; // Default: () => 1

  // Grid configuration
  gridResolution?: number; // Cells per foot (default: 2)
  bandwidth?: number; // KDE bandwidth in feet (default: 5)

  // Visual
  colorScale?: d3.ScaleSequential<string>; // Default: HOCKEY_COLOR_SCALES.heatmap
  minOpacity?: number; // Opacity at lowest density (default: 0)
  maxOpacity?: number; // Opacity at highest density (default: 0.8)

  // Threshold
  threshold?: number; // Min normalized value to render (default: 0.05)

  // Tooltip
  showTooltip?: boolean; // Default: true
  tooltip?: (value: number, nhlX: number, nhlY: number) => string;

  // Animation
  animate?: boolean; // Default: true
  animationDuration?: number; // Default: 500
  animationEasing?: AnimationEasing; // Default: "easeCubicOut"

  // Interaction
  onClick?: (
    event: MouseEvent,
    value: number,
    nhlX: number,
    nhlY: number,
  ) => void;
  onHover?: (
    event: MouseEvent,
    value: number,
    nhlX: number,
    nhlY: number,
  ) => void;
  onMouseOut?: (event: MouseEvent) => void;

  // Advanced
  customRender?: (
    context: CanvasRenderingContext2D,
    gridData: HeatmapGridData,
    dimensions: RenderDimensions,
  ) => void;
}
```

## Key Parameters

### bandwidth

Controls the "spread" of each data point's influence. Larger values create smoother, more blurred heatmaps.

```typescript
// Tight, detailed heatmap
rink.addHeatmap(shots, { bandwidth: 3 });

// Smooth, generalized heatmap
rink.addHeatmap(shots, { bandwidth: 10 });
```

### gridResolution

Controls the granularity of the underlying grid. Higher values = more detail but slower performance.

```typescript
// Fast rendering, coarser grid
rink.addHeatmap(shots, { gridResolution: 1 });

// Detailed grid, slower rendering
rink.addHeatmap(shots, { gridResolution: 4 });
```

### threshold

Minimum normalized density value (0-1) to render. Helps reduce visual noise from sparse areas.

```typescript
// Show more of the heatmap
rink.addHeatmap(shots, { threshold: 0.01 });

// Only show high-density areas
rink.addHeatmap(shots, { threshold: 0.2 });
```

### weight

Assign different weights to data points for weighted density estimation.

```typescript
// Weight by expected goals
rink.addHeatmap(shots, {
  weight: (d) => d.xG || 1,
});
```

## Examples

**Basic heatmap:**

```typescript
rink.addHeatmap(shots, { id: "shot-density" });
```

**Weighted by xG:**

```typescript
rink.addHeatmap(shots, {
  id: "xg-heatmap",
  weight: (d) => d.xG,
  bandwidth: 6,
  colorScale: d3.scaleSequential(d3.interpolateYlOrRd).domain([0, 1]),
});
```

**Custom color scale:**

```typescript
import * as d3 from "d3";

rink.addHeatmap(shots, {
  id: "custom-heatmap",
  colorScale: d3.scaleSequential(d3.interpolateViridis),
  maxOpacity: 0.9,
});
```

**High-density focus:**

```typescript
rink.addHeatmap(shots, {
  id: "hot-zones",
  threshold: 0.15,
  bandwidth: 4,
  maxOpacity: 0.85,
});
```

**Custom tooltip:**

```typescript
rink.addHeatmap(shots, {
  id: "shots",
  tooltip: (value, x, y) => `
    <strong>Density:</strong> ${value.toFixed(3)}<br/>
    <strong>Location:</strong> (${x.toFixed(1)}, ${y.toFixed(1)})
  `,
});
```

**Click handler:**

```typescript
rink.addHeatmap(shots, {
  id: "interactive",
  onClick: (event, value, x, y) => {
    console.log(`Clicked at (${x}, ${y}) with density ${value}`);
  },
});
```

## HeatmapGridData

The computed grid data can be accessed for advanced use cases:

```typescript
const layer = new HeatmapLayer(shots, { id: "density" });
rink.addLayer(layer);

const gridData = layer.getGridData();
// {
//   grid: number[][],      // 2D density values
//   width: number,         // Grid width in cells
//   height: number,        // Grid height in cells
//   cellWidth: number,     // Cell width in pixels
//   cellHeight: number,    // Cell height in pixels
//   minValue: number,
//   maxValue: number
// }
```

## Performance Considerations

- **Large datasets (1000+ points)**: KDE computation is O(n × gridCells). Consider reducing `gridResolution` or sampling your data.
- **Animation**: Set `animate: false` for instant rendering on data updates.
- **Canvas rendering**: HeatmapLayer uses canvas for performance. Tooltip interactions work via mouse position tracking.

## Inherited Methods

From [BaseLayer](/api/base-layer): `render()`, `update(data)`, `show()`, `hide()`, `destroy()`, `getConfig()`, `getData()`

## See Also

- [BaseLayerConfig](/api/base-layer#baselayerconfig) — Base configuration
- [HexbinLayer](/api/hexbin-layer) — Discrete hexagonal binning alternative
- [Accessor](/api/types#accessor), [AnimationEasing](/api/types#animationeasing) — Core types
