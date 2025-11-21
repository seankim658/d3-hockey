# BaseLayer API

The `BaseLayer` abstract class is the foundation for all visualization layers in d3-hockey. Extend this class to create custom layers with specialized rendering logic.

## Overview

BaseLayer provides:

- Layer lifecycle management (initialize, render, update, destroy)
- Data binding and updates
- Visibility and opacity control
- z-index ordering
- Automatic re-rendering on configuration changes

## When to Use BaseLayer

Use BaseLayer when:

- The pre-built layers don't meet your needs
- You need custom rendering logic beyond symbols
- You're building specialized visualizations (heatmaps, flow fields, etc.)
- You want complete control over D3 rendering

**For most use cases**, [EventLayer](/api/event-layer) provides everything you need.

## Abstract Class Definition

```typescript
abstract class BaseLayer<
  TData = any,
  TConfig extends BaseLayerConfig = BaseLayerConfig,
> {
  protected data: TData[];
  protected config: Required<TConfig>;
  protected container: d3.Selection<
    SVGGElement,
    unknown,
    null,
    undefined
  > | null;
  protected dimensions: RenderDimensions | null;

  constructor(data: TData[], config: TConfig);

  // Abstract method - MUST be implemented
  abstract render(
    container: d3.Selection<SVGGElement, unknown, null, undefined>,
    dimensions: RenderDimensions,
  ): void;

  // Lifecycle methods
  initialize(
    container: d3.Selection<SVGGElement, unknown, null, undefined>,
    dimensions: RenderDimensions,
  ): void;

  update(data: TData[]): void;
  destroy(): void;

  // Visibility control
  show(): void;
  hide(): void;
  setOpacity(opacity: number): void;

  // Configuration
  updateConfig(config: Partial<TConfig>): void;

  // Protected helpers
  protected getDefaults(): Required<TConfig>;
  protected mergeConfig(config: TConfig): Required<TConfig>;
}
```

## Configuration

### BaseLayerConfig

Every custom layer extends this base configuration:

```typescript
interface BaseLayerConfig {
  id: string; // Required: unique layer identifier
  visible?: boolean; // Default: true
  opacity?: number; // Default: 1 (0-1 range)
  zIndex?: number; // Default: 0 (rendering order)
  className?: string; // Default: "layer"
}
```

## Creating a Custom Layer

### Step 1: Define Your Config Interface

Extend `BaseLayerConfig` with your custom options:

```typescript
import { BaseLayer, BaseLayerConfig, RenderDimensions } from "d3-hockey";
import type { Selection } from "d3";

interface HeatmapLayerConfig extends BaseLayerConfig {
  cellSize?: number;
  colorScale?: string[];
  threshold?: number;
}
```

### Step 2: Create Your Layer Class

```typescript
class HeatmapLayer<TData = any> extends BaseLayer<TData, HeatmapLayerConfig> {
  // Provide default configuration
  protected getDefaults(): Required<HeatmapLayerConfig> {
    return {
      // Base layer defaults
      id: "heatmap",
      visible: true,
      opacity: 1,
      zIndex: 0,
      className: "heatmap-layer",

      // Custom defaults
      cellSize: 10,
      colorScale: ["#f7fbff", "#08519c"],
      threshold: 5,
    };
  }

  // REQUIRED: Implement the render method
  render(
    container: Selection<SVGGElement, unknown, null, undefined>,
    dimensions: RenderDimensions,
  ): void {
    // Your custom rendering logic here
    this.renderHeatmap(container, dimensions);
  }

  // Your custom methods
  private renderHeatmap(
    container: Selection<SVGGElement, unknown, null, undefined>,
    dimensions: RenderDimensions,
  ): void {
    // Create a grid of cells
    const cells = container
      .selectAll<SVGRectElement, TData>(".heatmap-cell")
      .data(this.data);

    // Enter new cells
    cells
      .enter()
      .append("rect")
      .attr("class", "heatmap-cell")
      .merge(cells) // Merge with existing
      .attr("x", (d, i) => (i % 20) * this.config.cellSize)
      .attr("y", (d, i) => Math.floor(i / 20) * this.config.cellSize)
      .attr("width", this.config.cellSize)
      .attr("height", this.config.cellSize)
      .attr("fill", (d) => this.getCellColor(d))
      .attr("opacity", this.config.opacity);

    // Remove old cells
    cells.exit().remove();
  }

  private getCellColor(d: TData): string {
    // Your color logic
    return "#08519c";
  }
}
```

### Step 3: Use Your Layer

```typescript
import { Rink } from "d3-hockey";

const heatmapData = [
  /* your data */
];

const heatmapLayer = new HeatmapLayer(heatmapData, {
  id: "my-heatmap",
  cellSize: 15,
  colorScale: ["white", "red"],
});

const rink = new Rink("#container").render().addLayer(heatmapLayer);
```

## Lifecycle Methods

### initialize()

Called automatically when the layer is added to a rink. Sets up the container and dimensions.

```typescript
initialize(
  container: d3.Selection<SVGGElement, unknown, null, undefined>,
  dimensions: RenderDimensions
): void
```

**Usually you don't need to override this**, but you can if you need custom initialization:

```typescript
initialize(
  container: d3.Selection<SVGGElement, unknown, null, undefined>,
  dimensions: RenderDimensions
): void {
  super.initialize(container, dimensions);

  // Your custom initialization
  console.log("Layer initialized!");
  this.setupEventHandlers();
}
```

---

### render()

**REQUIRED**: Implement this method with your rendering logic.

```typescript
abstract render(
  container: d3.Selection<SVGGElement, unknown, null, undefined>,
  dimensions: RenderDimensions
): void;
```

**Called**:

- After `initialize()`
- After `update(data)`
- After `updateConfig(config)`

**Best Practices**:

- Use D3's enter-update-exit pattern
- Clean up old elements
- Use `this.data` and `this.config`
- Respect `this.config.opacity` and `this.config.visible`

---

### update()

Updates the layer's data and triggers re-render.

```typescript
update(data: TData[]): void
```

**Example Usage**:

```typescript
// From outside the layer
rink.updateLayer("my-layer", newData);

// The layer's update() method is called internally
```

You can override for custom update logic:

```typescript
update(data: TData[]): void {
  this.data = data;
  this.preprocessData();  // Custom preprocessing
  if (this.container && this.dimensions) {
    this.render(this.container, this.dimensions);
  }
}
```

---

### destroy()

Cleans up the layer and removes all DOM elements.

```typescript
destroy(): void
```

**Called when**:

- Layer is removed via `removeLayer()`
- Rink is destroyed

Override for custom cleanup:

```typescript
destroy(): void {
  this.removeEventListeners();
  super.destroy();
}
```

## Visibility Control

### show() / hide()

Toggle layer visibility without removing it.

```typescript
show(): void    // Make visible
hide(): void    // Make invisible
```

**Internal Implementation**:

```typescript
show(): void {
  this.config.visible = true;
  if (this.container) {
    this.container.style("display", null);
  }
}

hide(): void {
  this.config.visible = false;
  if (this.container) {
    this.container.style("display", "none");
  }
}
```

---

### setOpacity()

Adjusts layer opacity.

```typescript
setOpacity(opacity: number): void
```

**Example**:

```typescript
layer.setOpacity(0.5); // 50% transparent
```

## Configuration Management

### updateConfig()

Updates layer configuration and triggers re-render.

```typescript
updateConfig(config: Partial<TConfig>): void
```

**Example**:

```typescript
heatmapLayer.updateConfig({
  cellSize: 20,
  colorScale: ["blue", "red"],
});
// Layer automatically re-renders with new config
```

---

### getDefaults()

**REQUIRED**: Provide default configuration values.

```typescript
protected getDefaults(): Required<TConfig>
```

This method is called during construction to establish defaults for any config properties not provided by the user.

## Protected Properties

These are available in your custom layer:

```typescript
protected data: TData[];              // Current data array
protected config: Required<TConfig>;  // Merged configuration
protected container: d3.Selection | null;  // SVG container group
protected dimensions: RenderDimensions | null;  // Rendering dimensions
```

## Advanced Examples

### Vector Field Layer

```typescript
interface VectorFieldConfig extends BaseLayerConfig {
  arrowSize?: number;
  gridSize?: number;
}

class VectorFieldLayer extends BaseLayer<VectorData, VectorFieldConfig> {
  protected getDefaults(): Required<VectorFieldConfig> {
    return {
      id: "vector-field",
      visible: true,
      opacity: 1,
      zIndex: 0,
      className: "vector-field",
      arrowSize: 10,
      gridSize: 20,
    };
  }

  render(
    container: Selection<SVGGElement>,
    dimensions: RenderDimensions,
  ): void {
    const arrows = container
      .selectAll<SVGLineElement, VectorData>(".flow-arrow")
      .data(this.data);

    arrows
      .enter()
      .append("line")
      .attr("class", "flow-arrow")
      .merge(arrows)
      .attr("x1", (d) => this.getX(d.start))
      .attr("y1", (d) => this.getY(d.start))
      .attr("x2", (d) => this.getX(d.end))
      .attr("y2", (d) => this.getY(d.end))
      .attr("stroke", "#333")
      .attr("stroke-width", 2)
      .attr("marker-end", "url(#arrowhead)");

    arrows.exit().remove();
  }

  private getX(coord: NHLCoordinate): number {
    // Use coordinate transformation utilities
    return coord.x * this.dimensions!.scale + this.dimensions!.padding;
  }

  private getY(coord: NHLCoordinate): number {
    return coord.y * this.dimensions!.scale + this.dimensions!.padding;
  }
}
```

### Animated Layer

```typescript
class AnimatedTrailLayer extends BaseLayer<TrailPoint, TrailConfig> {
  private animation: d3.Timer | null = null;

  render(
    container: Selection<SVGGElement>,
    dimensions: RenderDimensions,
  ): void {
    // Initial render
    this.renderTrail(container, dimensions);

    // Start animation
    this.startAnimation();
  }

  private startAnimation(): void {
    let t = 0;
    this.animation = d3.timer(() => {
      t += 0.01;
      this.updateTrailPosition(t);
      if (t >= 1) {
        this.animation?.stop();
      }
    });
  }

  destroy(): void {
    this.animation?.stop();
    super.destroy();
  }
}
```

### Interactive Layer

```typescript
class InteractiveZoneLayer extends BaseLayer<Zone, ZoneConfig> {
  render(
    container: Selection<SVGGElement>,
    dimensions: RenderDimensions,
  ): void {
    const zones = container
      .selectAll<SVGRectElement, Zone>(".zone")
      .data(this.data);

    zones
      .enter()
      .append("rect")
      .attr("class", "zone")
      .merge(zones)
      .attr("x", (d) => d.x)
      .attr("y", (d) => d.y)
      .attr("width", (d) => d.width)
      .attr("height", (d) => d.height)
      .attr("fill", (d) => d.color)
      .attr("opacity", this.config.opacity)
      .style("cursor", "pointer")
      .on("mouseenter", (event, d) => this.handleZoneEnter(d))
      .on("mouseleave", (event, d) => this.handleZoneLeave(d))
      .on("click", (event, d) => this.handleZoneClick(d));

    zones.exit().remove();
  }

  private handleZoneEnter(zone: Zone): void {
    console.log("Entered zone:", zone.name);
  }

  private handleZoneLeave(zone: Zone): void {
    console.log("Left zone:", zone.name);
  }

  private handleZoneClick(zone: Zone): void {
    console.log("Clicked zone:", zone.name);
  }
}
```

## Best Practices

### 1. Use the Enter-Update-Exit Pattern

```typescript
render(container: Selection<SVGGElement>, dimensions: RenderDimensions): void {
  const selection = container
    .selectAll<SVGElement, TData>(".my-element")
    .data(this.data);

  // Enter: new elements
  const enter = selection
    .enter()
    .append("circle")
    .attr("class", "my-element");

  // Update: merge enter + existing
  enter
    .merge(selection)
    .attr("cx", d => this.getX(d))
    .attr("cy", d => this.getY(d));

  // Exit: remove old elements
  selection.exit().remove();
}
```

### 2. Respect Configuration

Always respect `visible` and `opacity`:

```typescript
render(container: Selection<SVGGElement>, dimensions: RenderDimensions): void {
  if (!this.config.visible) {
    container.style("display", "none");
    return;
  }

  container.style("display", null);

  // Apply opacity to your elements
  selection.attr("opacity", this.config.opacity);
}
```

### 3. Clean Up Resources

```typescript
destroy(): void {
  // Stop animations
  this.animation?.stop();

  // Remove event listeners
  this.removeListeners();

  // Call super to clean up DOM
  super.destroy();
}
```

### 4. Use Coordinate Utilities

```typescript
import { nhlToSVG } from "d3-hockey";

render(container: Selection<SVGGElement>, dimensions: RenderDimensions): void {
  selection
    .attr("cx", d => {
      const svgCoords = nhlToSVG(d.coordinates, dimensions);
      return svgCoords.x;
    });
}
```

## Testing Your Layer

```typescript
// Create test data
const testData = [
  { id: 1, coordinates: { x: 50, y: 10 } },
  { id: 2, coordinates: { x: -50, y: -10 } },
];

// Create layer
const layer = new MyCustomLayer(testData, {
  id: "test-layer",
  myCustomOption: 42,
});

// Add to rink
const rink = new Rink("#container").render().addLayer(layer);

// Test updates
setTimeout(() => {
  layer.update(newTestData);
}, 1000);

// Test config updates
setTimeout(() => {
  layer.updateConfig({ myCustomOption: 100 });
}, 2000);
```

## See Also

- [EventLayer API](/api/event-layer) - Pre-built event visualization layer
- [LayerManager API](/api/layer-manager) - Managing multiple layers
- [Rink API](/api/rink#addlayer) - Adding custom layers to rink
- [Types](/api/types#baselayerconfig) - BaseLayerConfig type definition
- [D3 Documentation](https://d3js.org/) - D3.js reference
