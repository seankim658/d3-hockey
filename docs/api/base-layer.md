# BaseLayer API

Abstract base class for creating custom visualization layers.

## When to Use

Use BaseLayer when the existing layers don't meet your needs.

## BaseLayerConfig

```typescript
interface BaseLayerConfig {
  id: string; // Required: unique identifier
  visible?: boolean; // Default: true
  opacity?: number; // Default: 1 (0-1)
  zIndex?: number; // Default: 0
  className?: string; // Default: "layer"
}
```

## Class Definition

```typescript
abstract class BaseLayer<TData, TConfig extends BaseLayerConfig> {
  protected data: TData[];
  protected config: Required<TConfig>;
  protected group: d3.Selection<SVGGElement> | null;
  protected dimensions: RenderDimensions;

  constructor(data: TData[], config: TConfig);

  // Must implement
  abstract render(): void;

  // Lifecycle
  initialize(
    parent: d3.Selection<SVGGElement>,
    dimensions: RenderDimensions,
  ): void;
  update(data: TData[]): void;
  updateDimensions(dimensions: RenderDimensions): void;
  clear(): void;
  destroy(): void;

  // Visibility
  show(): void;
  hide(): void;
  setOpacity(opacity: number): void;

  // Accessors
  getConfig(): Required<TConfig>;
  getData(): TData[];
  getGroup(): d3.Selection<SVGGElement> | null;

  // Helpers
  protected getDefaults(): Required<TConfig>;
  protected nhlToSVG(coord: NHLCoordinate): { x: number; y: number };
}
```

## Creating a Custom Layer

```typescript
import { BaseLayer, BaseLayerConfig, RenderDimensions } from "d3-hockey";
import * as d3 from "d3";

interface MyLayerConfig extends BaseLayerConfig {
  cellSize?: number;
  color?: string;
}

class MyLayer extends BaseLayer<MyData, MyLayerConfig> {
  protected getDefaults(): Required<MyLayerConfig> {
    return {
      ...super.getDefaults(),
      cellSize: 10,
      color: "#ff0000",
    };
  }

  render(): void {
    if (!this.group) return;

    const { scale, padding } = this.dimensions;

    this.group
      .selectAll("circle")
      .data(this.data)
      .join("circle")
      .attr("cx", (d) => {
        const pos = this.nhlToSVG(d.coordinates);
        return pos.x;
      })
      .attr("cy", (d) => {
        const pos = this.nhlToSVG(d.coordinates);
        return pos.y;
      })
      .attr("r", this.config.cellSize)
      .attr("fill", this.config.color);
  }
}
```

## Usage

```typescript
const layer = new MyLayer(data, { id: "my-layer", cellSize: 8 });
rink.addLayer(layer);
```

## Lifecycle

1. `constructor()` — Store data, merge config with defaults
2. `initialize()` — Called by LayerManager, creates SVG group
3. `render()` — Your rendering logic (called after initialize)
4. `update(data)` — Replace data and re-render
5. `destroy()` — Clean up SVG elements

## See Also

- [EventLayer](/api/event-layer), [HexbinLayer](/api/hexbin-layer) — Built-in layers
- [LayerManager](/api/layer-manager) — Layer lifecycle management
