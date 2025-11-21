# LayerManager API

The `LayerManager` class manages multiple layers on a rink, handling rendering order, visibility, and lifecycle. It's automatically created by the Rink class, but can be accessed for advanced layer control.

## Overview

LayerManager handles:

- Adding and removing layers
- Layer z-index ordering
- Showing and hiding layers
- Retrieving layer references
- Coordinating layer updates

## Access

Get the LayerManager from a Rink instance:

```typescript
import { Rink } from "d3-hockey";

const rink = new Rink("#container").render();
const layerManager = rink.getLayerManager();

if (layerManager) {
  // Advanced layer management
}
```

::: warning
The LayerManager is only available after the Rink has been rendered. Always check for null before using.
:::

## Class Definition

```typescript
class LayerManager {
  constructor(svg: d3.Selection<SVGSVGElement, unknown, null, undefined>);

  // Layer management
  addLayer(layer: BaseLayer): void;
  removeLayer(id: string): void;
  getLayer(id: string): BaseLayer | undefined;
  getAllLayers(): BaseLayer[];
  hasLayer(id: string): boolean;

  // Visibility control
  showLayer(id: string): void;
  hideLayer(id: string): void;

  // Ordering
  reorderLayers(layerIds: string[]): void;

  // Cleanup
  destroy(): void;
}
```

## Methods

### addLayer()

Adds a layer to the rink.

```typescript
addLayer(layer: BaseLayer): void
```

**Parameters**:

- **layer**: Layer instance to add

**Throws**: Error if a layer with the same ID already exists

**Example**:

```typescript
import { EventLayer } from "d3-hockey";

const layer = new EventLayer(data, { id: "shots" });
layerManager?.addLayer(layer);
```

::: tip
Most users should use `rink.addLayer()` or `rink.addEvents()` instead, which calls this internally.
:::

---

### removeLayer()

Removes a layer by its ID and calls its `destroy()` method.

```typescript
removeLayer(id: string): void
```

**Parameters**:

- **id**: Unique identifier of the layer to remove

**Example**:

```typescript
layerManager?.removeLayer("shots");
```

**Equivalent to**:

```typescript
rink.removeLayer("shots");
```

---

### getLayer()

Retrieves a layer instance by its ID.

```typescript
getLayer(id: string): BaseLayer | undefined
```

**Parameters**:

- **id**: Unique identifier of the layer

**Returns**: Layer instance or `undefined` if not found

**Example**:

```typescript
const shotsLayer = layerManager?.getLayer("shots");
if (shotsLayer) {
  console.log("Found shots layer:", shotsLayer.config);

  // Access layer data
  console.log("Layer data:", shotsLayer.data);

  // Update layer config
  shotsLayer.updateConfig({ opacity: 0.5 });
}
```

---

### getAllLayers()

Returns all layers managed by this LayerManager.

```typescript
getAllLayers(): BaseLayer[]
```

**Returns**: Array of all layer instances

**Example**:

```typescript
const allLayers = layerManager?.getAllLayers() || [];

console.log(`Total layers: ${allLayers.length}`);

allLayers.forEach((layer) => {
  console.log(
    `- ${layer.config.id}: ${layer.config.visible ? "visible" : "hidden"}`,
  );
});
```

---

### hasLayer()

Checks if a layer with the given ID exists.

```typescript
hasLayer(id: string): boolean
```

**Parameters**:

- **id**: Layer identifier to check

**Returns**: `true` if layer exists, `false` otherwise

**Example**:

```typescript
if (layerManager?.hasLayer("shots")) {
  console.log("Shots layer exists");
} else {
  console.log("No shots layer found");
}
```

---

### showLayer()

Makes a hidden layer visible.

```typescript
showLayer(id: string): void
```

**Parameters**:

- **id**: Layer identifier

**Example**:

```typescript
layerManager?.showLayer("shots");
```

**Equivalent to**:

```typescript
rink.showLayer("shots");
// or
const layer = layerManager?.getLayer("shots");
layer?.show();
```

---

### hideLayer()

Hides a visible layer without removing it.

```typescript
hideLayer(id: string): void
```

**Parameters**:

- **id**: Layer identifier

**Example**:

```typescript
layerManager?.hideLayer("shots");
```

**Use Case**: Temporarily hide a layer while keeping it in memory for quick toggling.

---

### reorderLayers()

Changes the rendering order of layers by setting z-index values.

```typescript
reorderLayers(layerIds: string[]): void
```

**Parameters**:

- **layerIds**: Array of layer IDs in desired order (first = bottom, last = top)

**Example**:

```typescript
// Render in this order (bottom to top):
// 1. heatmap (background)
// 2. shots (middle)
// 3. goals (foreground)
layerManager?.reorderLayers(["heatmap", "shots", "goals"]);
```

**Note**: Layers not included in the array will keep their current z-index.

---

### destroy()

Removes all layers and cleans up resources. Called automatically when the Rink is destroyed.

```typescript
destroy(): void
```

**Example**:

```typescript
// Usually called automatically, but can be called manually
layerManager?.destroy();
```

## Usage Patterns

### Layer Toggle Controls

```typescript
const rink = new Rink("#container").render();
const layerManager = rink.getLayerManager();

// Add multiple layers
rink
  .addEvents(goals, { id: "goals", color: "gold" })
  .addEvents(shots, { id: "shots", color: "blue" })
  .addEvents(blocks, { id: "blocks", color: "red" });

// Create toggle buttons
document.getElementById("toggle-goals")?.addEventListener("click", () => {
  const layer = layerManager?.getLayer("goals");
  if (layer?.config.visible) {
    layerManager?.hideLayer("goals");
  } else {
    layerManager?.showLayer("goals");
  }
});

document.getElementById("toggle-shots")?.addEventListener("click", () => {
  const layer = layerManager?.getLayer("shots");
  if (layer?.config.visible) {
    layerManager?.hideLayer("shots");
  } else {
    layerManager?.showLayer("shots");
  }
});
```

### Dynamic Layer Management

```typescript
const rink = new Rink("#container").render();
const layerManager = rink.getLayerManager();

// Add initial layer
rink.addEvents(initialShots, { id: "shots", color: "blue" });

// Later: add more layers based on user selection
function addTeamLayer(teamData: any[], teamName: string) {
  if (!layerManager?.hasLayer(teamName)) {
    rink.addEvents(teamData, {
      id: teamName,
      color: getTeamPrimaryColor(teamName),
    });
  } else {
    console.log(`Layer ${teamName} already exists`);
  }
}

// Remove team layers
function removeTeamLayer(teamName: string) {
  if (layerManager?.hasLayer(teamName)) {
    layerManager.removeLayer(teamName);
  }
}
```

### Layer Inspection

```typescript
const rink = new Rink("#container").render();
const layerManager = rink.getLayerManager();

// Add layers
rink.addEvents(goals, { id: "goals" }).addEvents(shots, { id: "shots" });

// Inspect all layers
function inspectLayers() {
  const layers = layerManager?.getAllLayers() || [];

  console.log("=== Layer Inspection ===");
  layers.forEach((layer) => {
    console.log(`Layer: ${layer.config.id}`);
    console.log(`  Visible: ${layer.config.visible}`);
    console.log(`  Opacity: ${layer.config.opacity}`);
    console.log(`  Z-Index: ${layer.config.zIndex}`);
    console.log(`  Data Points: ${layer.data.length}`);
  });
}

inspectLayers();
```

### Opacity Control

```typescript
const layerManager = rink.getLayerManager();

// Fade out a layer
function fadeOutLayer(id: string, duration: number = 1000) {
  const layer = layerManager?.getLayer(id);
  if (!layer) return;

  const startOpacity = layer.config.opacity;
  const startTime = Date.now();

  function animate() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const opacity = startOpacity * (1 - progress);

    layer.setOpacity(opacity);

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      layerManager?.hideLayer(id);
    }
  }

  animate();
}

fadeOutLayer("shots", 2000);
```

### Layer Coordination

```typescript
const layerManager = rink.getLayerManager();

// Update all layers at once
function updateAllLayers(newData: Map<string, any[]>) {
  const layers = layerManager?.getAllLayers() || [];

  layers.forEach((layer) => {
    const layerData = newData.get(layer.config.id);
    if (layerData) {
      layer.update(layerData);
    }
  });
}

// Hide all layers except one
function showOnlyLayer(id: string) {
  const layers = layerManager?.getAllLayers() || [];

  layers.forEach((layer) => {
    if (layer.config.id === id) {
      layerManager?.showLayer(id);
    } else {
      layerManager?.hideLayer(layer.config.id);
    }
  });
}

showOnlyLayer("goals");
```

### Custom Layer Ordering

```typescript
const layerManager = rink.getLayerManager();

// Add layers
rink
  .addEvents(allShots, { id: "all-shots", color: "gray", opacity: 0.3 })
  .addEvents(dangerousShots, { id: "dangerous-shots", color: "orange" })
  .addEvents(goals, { id: "goals", color: "gold" });

// Ensure goals are always on top
layerManager?.reorderLayers([
  "all-shots", // Bottom layer (background)
  "dangerous-shots", // Middle layer
  "goals", // Top layer (foreground)
]);

// Later: add another layer and maintain order
rink.addEvents(blocks, { id: "blocks", color: "red" });

layerManager?.reorderLayers([
  "all-shots",
  "blocks",
  "dangerous-shots",
  "goals",
]);
```

### Bulk Operations

```typescript
const layerManager = rink.getLayerManager();

// Hide all layers
function hideAllLayers() {
  const layers = layerManager?.getAllLayers() || [];
  layers.forEach((layer) => {
    layerManager?.hideLayer(layer.config.id);
  });
}

// Show all layers
function showAllLayers() {
  const layers = layerManager?.getAllLayers() || [];
  layers.forEach((layer) => {
    layerManager?.showLayer(layer.config.id);
  });
}

// Remove all layers
function clearAllLayers() {
  const layers = layerManager?.getAllLayers() || [];
  layers.forEach((layer) => {
    layerManager?.removeLayer(layer.config.id);
  });
}

// Set opacity for all layers
function setGlobalOpacity(opacity: number) {
  const layers = layerManager?.getAllLayers() || [];
  layers.forEach((layer) => {
    layer.setOpacity(opacity);
  });
}
```

## Advanced Example: Layer Control Panel

```typescript
import { Rink, getTeamColors } from "d3-hockey";

const rink = new Rink("#container").render();
const layerManager = rink.getLayerManager();

// Add multiple layers
rink
  .addEvents(goals, { id: "goals", color: "gold" })
  .addEvents(shots, { id: "shots", color: "blue" })
  .addEvents(blocks, { id: "blocks", color: "red" })
  .addEvents(hits, { id: "hits", color: "green" });

class LayerControlPanel {
  private container: HTMLElement;

  constructor(containerId: string) {
    this.container = document.getElementById(containerId)!;
    this.render();
  }

  private render(): void {
    const layers = layerManager?.getAllLayers() || [];

    this.container.innerHTML = `
      <div class="layer-controls">
        <h3>Layer Controls</h3>
        ${layers.map((layer) => this.renderLayerControl(layer)).join("")}
        <div class="global-controls">
          <button id="show-all">Show All</button>
          <button id="hide-all">Hide All</button>
          <button id="clear-all">Clear All</button>
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  private renderLayerControl(layer: BaseLayer): string {
    return `
      <div class="layer-control" data-layer-id="${layer.config.id}">
        <label>
          <input type="checkbox" 
                 class="layer-toggle" 
                 ${layer.config.visible ? "checked" : ""}>
          ${layer.config.id}
        </label>
        <input type="range" 
               class="layer-opacity" 
               min="0" 
               max="100" 
               value="${layer.config.opacity * 100}">
        <button class="layer-remove">Remove</button>
      </div>
    `;
  }

  private attachEventListeners(): void {
    // Toggle visibility
    this.container.querySelectorAll(".layer-toggle").forEach((checkbox) => {
      checkbox.addEventListener("change", (e) => {
        const target = e.target as HTMLInputElement;
        const layerId = target
          .closest(".layer-control")
          ?.getAttribute("data-layer-id");
        if (!layerId) return;

        if (target.checked) {
          layerManager?.showLayer(layerId);
        } else {
          layerManager?.hideLayer(layerId);
        }
      });
    });

    // Adjust opacity
    this.container.querySelectorAll(".layer-opacity").forEach((slider) => {
      slider.addEventListener("input", (e) => {
        const target = e.target as HTMLInputElement;
        const layerId = target
          .closest(".layer-control")
          ?.getAttribute("data-layer-id");
        if (!layerId) return;

        const opacity = parseInt(target.value) / 100;
        const layer = layerManager?.getLayer(layerId);
        layer?.setOpacity(opacity);
      });
    });

    // Remove layer
    this.container.querySelectorAll(".layer-remove").forEach((button) => {
      button.addEventListener("click", (e) => {
        const layerId = (e.target as HTMLElement)
          .closest(".layer-control")
          ?.getAttribute("data-layer-id");
        if (!layerId) return;

        layerManager?.removeLayer(layerId);
        this.render(); // Re-render control panel
      });
    });

    // Global controls
    document.getElementById("show-all")?.addEventListener("click", () => {
      const layers = layerManager?.getAllLayers() || [];
      layers.forEach((layer) => layerManager?.showLayer(layer.config.id));
      this.render();
    });

    document.getElementById("hide-all")?.addEventListener("click", () => {
      const layers = layerManager?.getAllLayers() || [];
      layers.forEach((layer) => layerManager?.hideLayer(layer.config.id));
      this.render();
    });

    document.getElementById("clear-all")?.addEventListener("click", () => {
      const layers = layerManager?.getAllLayers() || [];
      layers.forEach((layer) => layerManager?.removeLayer(layer.config.id));
      this.render();
    });
  }
}

// Initialize control panel
new LayerControlPanel("control-panel");
```

## Best Practices

### 1. Always Check for Null

```typescript
const layerManager = rink.getLayerManager();

if (!layerManager) {
  console.error("Rink not rendered yet");
  return;
}

// Safe to use layerManager
```

### 2. Use Unique Layer IDs

```typescript
// Good: unique IDs
rink.addEvents(data1, { id: "team-a-shots" });
rink.addEvents(data2, { id: "team-b-shots" });

// Bad: duplicate IDs (will throw error)
rink.addEvents(data1, { id: "shots" });
rink.addEvents(data2, { id: "shots" }); // Error!
```

### 3. Clean Up Resources

```typescript
// When removing a layer, resources are cleaned up automatically
layerManager?.removeLayer("my-layer");

// When destroying the rink, all layers are cleaned up
rink.destroy(); // Calls layerManager.destroy() internally
```

### 4. Use Layer References Carefully

```typescript
const layer = layerManager?.getLayer("shots");

// Layer reference can become stale if layer is removed
layerManager?.removeLayer("shots");

// Don't use the old reference
// layer.update(newData);  // May cause issues

// Always get a fresh reference
const freshLayer = layerManager?.getLayer("shots");
if (freshLayer) {
  freshLayer.update(newData);
}
```

## See Also

- [Rink API](/api/rink) - Layer methods on Rink class
- [BaseLayer API](/api/base-layer) - Creating custom layers
- [EventLayer API](/api/event-layer) - Pre-built event layer
- [Types](/api/types#baselayerconfig) - Layer configuration types
