# Heatmap Layer

Continuous density visualization using Kernel Density Estimation (KDE). Creates smooth color gradients representing data concentration, ideal for identifying "hot zones" on the ice.

## Basic Heatmap

The simplest usage creates a smooth density visualization of shot locations.

<ClientOnly>
  <Demo title="Shot Density Heatmap (Game 2022020195)">
    <div style="width: 100%; display: flex; flex-direction: column; gap: 1rem;">
      <div id="demo-heatmap-basic" style="width: 100%; display: flex; justify-content: center;"></div>
      <div style="text-align: center; color: #666; font-size: 0.9em;">
        Continuous shot density for Edmonton vs Washington (Nov 7, 2022)
      </div>
    </div>
  </Demo>
</ClientOnly>

```typescript
import { Rink, NHLDataManager } from "d3-hockey";

// 1. Load Data
const manager = await NHLDataManager.fromGameId("2022020195");
const shots = manager.getAllEvents({ shotsOnly: true });

// 2. Render Rink with Heatmap Layer
new Rink("#container").render().addHeatmap(shots, {
  bandwidth: 5, // Smoothing radius in feet
  maxOpacity: 0.8, // Peak density opacity
});
```

## Bandwidth Comparison

The `bandwidth` parameter controls how "spread out" each point's influence is. Lower values create tighter, more detailed heatmaps, while higher values create smoother, more generalized views.

<ClientOnly>
  <Demo title="Tight Bandwidth (3ft)">
    <div id="demo-heatmap-tight" style="width: 100%; display: flex; justify-content: center;"></div>
  </Demo>
</ClientOnly>

```typescript
new Rink("#container").render().addHeatmap(shots, {
  bandwidth: 3, // Tight, detailed view
  maxOpacity: 0.85,
  threshold: 0.08,
});
```

<ClientOnly>
  <Demo title="Wide Bandwidth (10ft)">
    <div id="demo-heatmap-wide" style="width: 100%; display: flex; justify-content: center;"></div>
  </Demo>
</ClientOnly>

```typescript
new Rink("#container").render().addHeatmap(shots, {
  bandwidth: 10, // Smooth, generalized view
  maxOpacity: 0.75,
});
```

## Custom Color Scales

Use D3 color scales to customize the heatmap appearance.

<ClientOnly>
  <Demo title="Viridis Color Scale">
    <div id="demo-heatmap-viridis" style="width: 100%; display: flex; justify-content: center;"></div>
  </Demo>
</ClientOnly>

```typescript
import * as d3 from "d3";

new Rink("#container").render().addHeatmap(shots, {
  bandwidth: 5,
  colorScale: d3.scaleSequential(d3.interpolateViridis),
  maxOpacity: 0.9,
});
```

<ClientOnly>
  <Demo title="Inferno Color Scale">
    <div id="demo-heatmap-inferno" style="width: 100%; display: flex; justify-content: center;"></div>
  </Demo>
</ClientOnly>

```typescript
new Rink("#container").render().addHeatmap(shots, {
  bandwidth: 5,
  colorScale: d3.scaleSequential(d3.interpolateInferno),
  maxOpacity: 0.85,
});
```

## Threshold Filtering

Use `threshold` to filter out low-density areas and focus on hot zones.

<ClientOnly>
  <Demo title="High Threshold (Hot Zones Only)">
    <div id="demo-heatmap-threshold" style="width: 100%; display: flex; justify-content: center;"></div>
  </Demo>
</ClientOnly>

```typescript
new Rink("#container").render().addHeatmap(shots, {
  bandwidth: 4,
  threshold: 0.2, // Only show top 80% density
  maxOpacity: 0.9,
});
```

## Heatmap vs Hexbin Comparison

Compare the continuous heatmap with discrete hexagonal binning.

<ClientOnly>
  <Demo title="Side-by-Side: Heatmap (left) vs Hexbin (right)">
    <div style="width: 100%; display: flex; gap: 1rem; flex-wrap: wrap; justify-content: center;">
      <div style="flex: 1; min-width: 300px;">
        <div id="demo-compare-heatmap" style="width: 100%;"></div>
        <div style="text-align: center; color: #666; font-size: 0.85em; margin-top: 0.5rem;">Heatmap (continuous)</div>
      </div>
      <div style="flex: 1; min-width: 300px;">
        <div id="demo-compare-hexbin" style="width: 100%;"></div>
        <div style="text-align: center; color: #666; font-size: 0.85em; margin-top: 0.5rem;">Hexbin (discrete)</div>
      </div>
    </div>
  </Demo>
</ClientOnly>

```typescript
// Heatmap - smooth, continuous density
new Rink("#heatmap").render().addHeatmap(shots, {
  bandwidth: 5,
  maxOpacity: 0.8,
});

// Hexbin - discrete hexagonal bins
new Rink("#hexbin").render().addHexbin(shots, {
  radius: 4,
  opacity: 0.8,
});
```

## Combined with Event Layer

Layer a heatmap beneath individual shot markers for context.

<ClientOnly>
  <Demo title="Heatmap + Shot Events">
    <div id="demo-heatmap-combined" style="width: 100%; display: flex; justify-content: center;"></div>
  </Demo>
</ClientOnly>

```typescript
new Rink("#container")
  .render()
  .addHeatmap(shots, {
    id: "density",
    bandwidth: 6,
    maxOpacity: 0.6,
    zIndex: 5,
  })
  .addEvents(goals, {
    id: "goals",
    color: "#FFD700",
    radius: 6,
    symbol: "star",
    zIndex: 10,
  });
```

<script setup>
import { onMounted } from 'vue'
import { withBase } from 'vitepress'

onMounted(async () => {
  // Dynamic imports for client-side execution
  const { Rink, NHLDataManager } = await import('d3-hockey')
  const d3 = await import('d3')
  
  // Load sample data
  let shots = [];
  let goals = [];
  try {
    const response = await fetch(withBase('/data/game-2022020195.json'));
    if (response.ok) {
      const gameData = await response.json();
      const manager = NHLDataManager.fromResponse(gameData, "2022020195");
      shots = manager.getAllEvents({ shotsOnly: true });
      goals = shots.filter(s => s.type === 'goal');
    }
  } catch (e) {
    console.error("Failed to load demo data:", e);
  }

  // Render demos after DOM is ready
  setTimeout(() => {
    if (!shots.length) return;

    // --- Demo 1: Basic Heatmap ---
    const basicContainer = document.getElementById('demo-heatmap-basic')
    if (basicContainer) {
      new Rink(basicContainer)
        .render()
        .addHeatmap(shots, {
          bandwidth: 5,
          maxOpacity: 0.8
        });
    }

    // --- Demo 2: Tight Bandwidth ---
    const tightContainer = document.getElementById('demo-heatmap-tight')
    if (tightContainer) {
      new Rink(tightContainer)
        .render()
        .addHeatmap(shots, {
          bandwidth: 3,
          maxOpacity: 0.85,
          threshold: 0.08
        });
    }

    // --- Demo 3: Wide Bandwidth ---
    const wideContainer = document.getElementById('demo-heatmap-wide')
    if (wideContainer) {
      new Rink(wideContainer)
        .render()
        .addHeatmap(shots, {
          bandwidth: 10,
          maxOpacity: 0.75
        });
    }

    // --- Demo 4: Viridis Color Scale ---
    const viridisContainer = document.getElementById('demo-heatmap-viridis')
    if (viridisContainer) {
      new Rink(viridisContainer)
        .render()
        .addHeatmap(shots, {
          bandwidth: 5,
          colorScale: d3.scaleSequential(d3.interpolateViridis),
          maxOpacity: 0.9
        });
    }

    // --- Demo 5: Inferno Color Scale ---
    const infernoContainer = document.getElementById('demo-heatmap-inferno')
    if (infernoContainer) {
      new Rink(infernoContainer)
        .render()
        .addHeatmap(shots, {
          bandwidth: 5,
          colorScale: d3.scaleSequential(d3.interpolateInferno),
          maxOpacity: 0.85
        });
    }

    // --- Demo 6: High Threshold ---
    const thresholdContainer = document.getElementById('demo-heatmap-threshold')
    if (thresholdContainer) {
      new Rink(thresholdContainer)
        .render()
        .addHeatmap(shots, {
          bandwidth: 4,
          threshold: 0.2,
          maxOpacity: 0.9
        });
    }

    // --- Demo 7: Comparison - Heatmap ---
    const compareHeatmapContainer = document.getElementById('demo-compare-heatmap')
    if (compareHeatmapContainer) {
      new Rink(compareHeatmapContainer)
        .width(400)
        .height(200)
        .render()
        .addHeatmap(shots, {
          bandwidth: 5,
          maxOpacity: 0.8
        });
    }

    // --- Demo 7: Comparison - Hexbin ---
    const compareHexbinContainer = document.getElementById('demo-compare-hexbin')
    if (compareHexbinContainer) {
      new Rink(compareHexbinContainer)
        .width(400)
        .height(200)
        .render()
        .addHexbin(shots, {
          radius: 4,
          opacity: 0.8
        });
    }

    // --- Demo 8: Combined Layers ---
    const combinedContainer = document.getElementById('demo-heatmap-combined')
    if (combinedContainer) {
      new Rink(combinedContainer)
        .render()
        .addHeatmap(shots, {
          id: 'density',
          bandwidth: 6,
          maxOpacity: 0.6,
          zIndex: 5
        })
        .addEvents(goals, {
          id: 'goals',
          color: '#FFD700',
          radius: 6,
          symbol: 'star',
          zIndex: 10
        });
    }
  }, 100)
})
</script>

## When to Use Heatmap vs Hexbin

| Feature          | Heatmap                          | Hexbin                        |
| ---------------- | -------------------------------- | ----------------------------- |
| **Visual style** | Smooth, continuous gradient      | Discrete hexagonal cells      |
| **Best for**     | Identifying general "hot zones"  | Precise counts & aggregations |
| **Performance**  | Canvas-based, handles large data | SVG-based, interactive bins   |
| **Tooltips**     | Position-based density           | Per-bin aggregated values     |
| **Aggregation**  | Density only                     | Count, mean, sum, etc.        |

## API Reference

See the full [HeatmapLayer API documentation](/api/heatmap-layer) for all configuration options.
