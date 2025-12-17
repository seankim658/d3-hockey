# LayerManager API

Manages layer lifecycle, ordering, and visibility. Created automatically by Rink.

## Access

```typescript
const rink = new Rink("#container").render();
const layerManager = rink.getLayerManager();
```

> **Note:** Only available after `render()` is called.

## Methods

### Layer Management

| Method         | Signature                                      | Description                   |
| -------------- | ---------------------------------------------- | ----------------------------- |
| `addLayer`     | `addLayer(layer: BaseLayer): void`             | Add a layer                   |
| `removeLayer`  | `removeLayer(id: string): boolean`             | Remove layer, returns success |
| `getLayer`     | `getLayer(id: string): BaseLayer \| undefined` | Get layer by ID               |
| `getAllLayers` | `getAllLayers(): BaseLayer[]`                  | Get all layers                |
| `hasLayer`     | `hasLayer(id: string): boolean`                | Check if layer exists         |
| `getLayerIds`  | `getLayerIds(): string[]`                      | Get all layer IDs             |

### Visibility

| Method            | Signature                                            | Description             |
| ----------------- | ---------------------------------------------------- | ----------------------- |
| `showLayer`       | `showLayer(id: string): void`                        | Show a hidden layer     |
| `hideLayer`       | `hideLayer(id: string): void`                        | Hide a layer            |
| `setLayerOpacity` | `setLayerOpacity(id: string, opacity: number): void` | Set layer opacity (0-1) |

### Rendering

| Method             | Signature                                        | Description                      |
| ------------------ | ------------------------------------------------ | -------------------------------- |
| `renderAll`        | `renderAll(): void`                              | Re-render all visible layers     |
| `clearAll`         | `clearAll(): void`                               | Clear all layer content          |
| `updateDimensions` | `updateDimensions(dims: RenderDimensions): void` | Update dimensions for all layers |
| `destroy`          | `destroy(): void`                                | Remove all layers and clean up   |

## Examples

**Toggle layer:**

```typescript
const layer = layerManager?.getLayer("shots");
if (layer?.getConfig().visible) {
  layerManager?.hideLayer("shots");
} else {
  layerManager?.showLayer("shots");
}
```

**Conditional add:**

```typescript
if (!layerManager?.hasLayer("goals")) {
  rink.addEvents(goals, { id: "goals", color: "gold" });
}
```

**Iterate layers:**

```typescript
layerManager?.getAllLayers().forEach((layer) => {
  console.log(layer.getConfig().id, layer.getData().length);
});
```

## Notes

- Layers are sorted by `zIndex` (lower = rendered first/behind)
- Duplicate IDs will replace the existing layer (with warning)
- Most users should use `rink.addLayer()`, `rink.removeLayer()`, etc. which delegate to LayerManager

## See Also

- [Rink](/api/rink) — Layer convenience methods
- [BaseLayer](/api/base-layer) — Creating custom layers
