# Rink API

The `Rink` class is the main entry point for creating hockey rink visualizations. It handles rendering the rink surface, managing layers, and providing a convenient API for adding data visualizations.

## Constructor

```typescript
new Rink(container: string | HTMLElement, config?: RinkConfig)
```

### Parameters

- **container**: CSS selector string (e.g., `"#rink"`) or HTMLElement where the rink will be rendered
- **config**: Optional configuration object for customizing the rink appearance

### Example

```typescript
import { Rink } from "d3-hockey";

// Simple rink with defaults
const rink = new Rink("#container");

// Customized rink
const customRink = new Rink("#container", {
  width: 900,
  height: 450,
  padding: 40,
  colors: {
    ice: "#f0f8ff",
    redLine: "#c8102e",
  },
});
```

## Configuration

### RinkConfig

```typescript
interface RinkConfig {
  // Dimensions
  width?: number; // SVG width in pixels (default: 800)
  height?: number; // SVG height in pixels (default: 400)
  padding?: number; // Padding around rink in pixels (default: 20)

  // Layout options
  halfRink?: boolean; // Show half rink instead of full (default: false)
  halfRinkEnd?: "offensive" | "defensive"; // Which half to show (default: "offensive")
  vertical?: boolean; // Rotate rink vertically (default: false)

  // Colors
  colors?: RinkColors; // Override default colors
}
```

### RinkColors

```typescript
interface RinkColors {
  ice: string; // Ice surface color (default: "#ffffff")
  boards: string; // Board outline color (default: "#000000")
  redLine: string; // Center and goal lines (default: "#c8102e")
  blueLine: string; // Blue lines (default: "#003e7e")
  faceoff: string; // Faceoff circles (default: "#c8102e")
  crease: string; // Goal crease color (default: "#7fd3ff")
  line: string; // Default line color (default: "#000000")
}
```

## Methods

### render()

Renders the rink to the DOM. This must be called before adding any layers.

```typescript
render(): this
```

**Returns**: The Rink instance (chainable)

**Example**:

```typescript
const rink = new Rink("#container").render();
```

---

### addLayer()

Adds a custom layer to the rink. For advanced usage when you want full control over layer creation.

```typescript
addLayer(layer: BaseLayer): this
```

**Parameters**:

- **layer**: A custom layer instance extending `BaseLayer`

**Returns**: The Rink instance (chainable)

**Example**:

```typescript
import { Rink, BaseLayer } from "d3-hockey";

class MyCustomLayer extends BaseLayer {
  render(container, dimensions) {
    // Custom rendering logic
  }
}

const customLayer = new MyCustomLayer(data, config);
rink.addLayer(customLayer);
```

---

### addEvents()

Convenience method to add an event layer (shots, hits, etc.) to the rink. This is the most common way to add data visualizations.

```typescript
addEvents<TData = any>(
  data: TData[],
  config?: EventLayerConfig<TData>
): this
```

**Parameters**:

- **data**: Array of event data to visualize
- **config**: Optional EventLayer configuration

**Returns**: The Rink instance (chainable)

**Example**:

```typescript
const shots = [
  { coordinates: { x: 75, y: 10 }, player: "Ovechkin", type: "GOAL" },
  { coordinates: { x: 80, y: -5 }, player: "Backstrom", type: "SHOT" },
];

rink.addEvents(shots, {
  id: "shots",
  color: "#FF4C00",
  radius: 5,
  tooltip: (d) => `${d.player}: ${d.type}`,
});
```

**See Also**: [EventLayer API](/api/event-layer) for full configuration options

---

### removeLayer()

Removes a layer from the rink by its ID.

```typescript
removeLayer(id: string): this
```

**Parameters**:

- **id**: The unique identifier of the layer to remove

**Returns**: The Rink instance (chainable)

**Example**:

```typescript
rink.removeLayer("shots");
```

---

### showLayer()

Makes a hidden layer visible.

```typescript
showLayer(id: string): this
```

**Parameters**:

- **id**: The unique identifier of the layer to show

**Returns**: The Rink instance (chainable)

**Example**:

```typescript
rink.showLayer("shots");
```

---

### hideLayer()

Hides a visible layer without removing it.

```typescript
hideLayer(id: string): this
```

**Parameters**:

- **id**: The unique identifier of the layer to hide

**Returns**: The Rink instance (chainable)

**Example**:

```typescript
rink.hideLayer("shots");
```

---

### updateLayer()

Updates the data of an existing layer.

```typescript
updateLayer(id: string, data: any[]): this
```

**Parameters**:

- **id**: The unique identifier of the layer to update
- **data**: New data array for the layer

**Returns**: The Rink instance (chainable)

**Example**:

```typescript
const newShots = [{ coordinates: { x: 70, y: 12 }, player: "Kane" }];

rink.updateLayer("shots", newShots);
```

---

### getLayerManager()

Returns the LayerManager instance for advanced layer control.

```typescript
getLayerManager(): LayerManager | null
```

**Returns**: The LayerManager instance or null if the rink hasn't been rendered

**Example**:

```typescript
const layerManager = rink.getLayerManager();
if (layerManager) {
  const allLayers = layerManager.getAllLayers();
  console.log("Current layers:", allLayers);
}
```

**See Also**: [LayerManager API](/api/layer-manager) for advanced layer management

## Usage Examples

### Basic Shot Chart

```typescript
import { Rink } from "d3-hockey";

const shots = [
  { coordinates: { x: 75, y: 10 } },
  { coordinates: { x: 80, y: -5 } },
  { coordinates: { x: 68, y: 15 } },
];

new Rink("#container").render().addEvents(shots, {
  id: "shots",
  color: "#FF4C00",
  radius: 5,
});
```

### Multiple Layers

```typescript
const homeShots = [
  { coordinates: { x: 75, y: 8 }, team: "home" },
  { coordinates: { x: 82, y: -3 }, team: "home" },
];

const awayShots = [
  { coordinates: { x: -78, y: -10 }, team: "away" },
  { coordinates: { x: -85, y: 5 }, team: "away" },
];

const rink = new Rink("#container").render();

rink
  .addEvents(homeShots, {
    id: "home-shots",
    color: "#003e7e",
    radius: 5,
    opacity: 0.7,
  })
  .addEvents(awayShots, {
    id: "away-shots",
    color: "#c8102e",
    radius: 5,
    opacity: 0.7,
  });
```

### Half Rink

```typescript
new Rink("#container", {
  halfRink: true,
  halfRinkEnd: "offensive",
  width: 600,
  height: 600,
}).render();
```

### Custom Colors

```typescript
new Rink("#container", {
  colors: {
    ice: "#e3f2fd",
    blueLine: "#1565c0",
    redLine: "#d32f2f",
    boards: "#424242",
  },
}).render();
```

### Dynamic Layer Management

```typescript
const rink = new Rink("#container").render();

// Add initial layer
rink.addEvents(initialShots, { id: "shots", color: "#FF4C00" });

// Later: update the data
setTimeout(() => {
  rink.updateLayer("shots", newShots);
}, 2000);

// Toggle visibility
document.getElementById("toggleButton")?.addEventListener("click", () => {
  const layerManager = rink.getLayerManager();
  const layer = layerManager?.getLayer("shots");

  if (layer?.config.visible) {
    rink.hideLayer("shots");
  } else {
    rink.showLayer("shots");
  }
});
```

### Vertical Orientation

```typescript
// Useful for mobile displays or specific layouts
new Rink("#container", {
  vertical: true,
  width: 400,
  height: 800,
}).render();
```

## Method Chaining

All Rink methods (except `getLayerManager()`) return the Rink instance, allowing for fluent method chaining:

```typescript
new Rink("#container", { width: 900, height: 450 })
  .render()
  .addEvents(goals, { id: "goals", color: "gold", radius: 8 })
  .addEvents(shots, { id: "shots", color: "blue", radius: 4 })
  .addEvents(blocks, { id: "blocks", color: "red", radius: 3 });
```

## See Also

- [EventLayer API](/api/event-layer) - Event layer configuration and customization
- [BaseLayer API](/api/base-layer) - Creating custom layers
- [LayerManager API](/api/layer-manager) - Advanced layer management
- [Types](/api/types) - RinkConfig and RinkColors type definitions
- [Examples](/examples/) - More usage examples
