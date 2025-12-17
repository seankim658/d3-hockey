# Rink API

The main class for creating hockey rink visualizations.

## Constructor

```typescript
new Rink(selector: string | HTMLElement)
```

**Parameter**: CSS selector or HTMLElement for the container.

## Configuration Methods

All configuration methods return `this` for chaining. Call before `render()`.

| Method     | Signature                                                    | Default                                 | Description          |
| ---------- | ------------------------------------------------------------ | --------------------------------------- | -------------------- |
| `width`    | `width(value: number)`                                       | `800`                                   | SVG width in pixels  |
| `height`   | `height(value: number)`                                      | `400`                                   | SVG height in pixels |
| `padding`  | `padding(value: number)`                                     | `20`                                    | Padding around rink  |
| `halfRink` | `halfRink(value: boolean, end?: "offensive" \| "defensive")` | `false`                                 | Show half rink       |
| `vertical` | `vertical(value: boolean)`                                   | `false`                                 | Vertical orientation |
| `colors`   | `colors(colors: Partial<RinkColors>)`                        | See [RinkColors](/api/types#rinkcolors) | Custom colors        |

## Core Methods

### render()

Renders the rink. **Must be called before adding layers.**

```typescript
render(): this
```

### addEvents()

Adds an [EventLayer](/api/event-layer).

```typescript
addEvents<TData>(data: TData[], config?: Partial<EventLayerConfig<TData>>): this
```

### addHexbin()

Adds a [HexbinLayer](/api/hexbin-layer).

```typescript
addHexbin<TData>(data: TData[], config?: Partial<HexbinLayerConfig<TData>>): this
```

### addLayer()

Adds a custom layer extending [BaseLayer](/api/base-layer).

```typescript
addLayer(layer: BaseLayer): this
```

**Throws**: Error if `render()` hasn't been called.

## Layer Management

| Method            | Signature                                     | Description                               |
| ----------------- | --------------------------------------------- | ----------------------------------------- |
| `removeLayer`     | `removeLayer(id: string): this`               | Remove layer by ID                        |
| `showLayer`       | `showLayer(id: string): this`                 | Show hidden layer                         |
| `hideLayer`       | `hideLayer(id: string): this`                 | Hide layer                                |
| `updateLayer`     | `updateLayer<T>(id: string, data: T[]): this` | Update layer data                         |
| `getLayerManager` | `getLayerManager(): LayerManager \| null`     | Access [LayerManager](/api/layer-manager) |

## Example

```typescript
import { Rink } from "d3-hockey";

new Rink("#container")
  .width(900)
  .height(450)
  .colors({ ice: "#e3f2fd" })
  .render()
  .addEvents(shots, { id: "shots", color: "blue" })
  .addHexbin(allShots, { id: "density", opacity: 0.5 });
```

## See Also

- [RinkConfig](/api/types#rinkconfig), [RinkColors](/api/types#rinkcolors) — Type definitions
- [EventLayer](/api/event-layer), [HexbinLayer](/api/hexbin-layer) — Layer configuration
- [Examples](/examples/) — Usage examples
