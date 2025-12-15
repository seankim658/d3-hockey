# Hexbin Layer

Visualizing shot density using hexogonal binning.

## Basic Density

The simplest usage aggregates shot locations into hexogonal bins.

<ClientOnly>
  <Demo title="Shot Density (Game 2022020195)">
    <div style="width: 100%; display: flex; flex-direction: column; gap: 1rem;">
      <div id="demo-hexbin-basic" style="width: 100%; display: flex; justify-content: center;"></div>
      <div style="text-align: center; color: #666; font-size: 0.9em;">
        Shot density for Edmonton vs Washington (Nov 7, 2022)
      </div>
    </div>
  </Demo>
</ClientOnly>

```typescript
import { Rink, NHLDataManager } from "d3-hockey";

// 1. Load Data
const manager = await NHLDataManager.fromGameId("2022020195");
const shots = manager.getAllEvents({ shotsOnly: true });

// 2. Render Rink with Hexbin Layer
new Rink("#container").render().addHexbin(shots, {
  radius: 4, // 4ft bins
  opacity: 0.8,
  aggregation: "count",
});
```

## Custom Bin Size

You can adjust the `radius` to change the granularity of the bins. Larget radii (e.g., 8ft) provide a smoother, more generalized view, while smaller radii (e.g., 2.5ft) show precise hotspots.

<ClientOnly> 
    <Demo title="Large Bins (8ft Radius)"> 
        <div id="demo-hexbin-large" style="width: 100%; display: flex; justify-content: center;"></div> 
    </Demo> 
</ClientOnly>

```typescript
new Rink("#container").render().addHexbin(shots, {
  radius: 8, // Larger 8ft bins
  opacity: 0.7,
  stroke: "#fff", // Add white borders
  strokeWidth: 1,
});
```

### Aggregation by Value

Instead of just counting shots, you can aggregate by a metric (like average shot distance, expected goals, or speed) using the `value` accessor and `aggregation: "mean"`.

<ClientOnly> 
    <Demo title="Average Shot Distance (Mean)"> 
        <div id="demo-hexbin-metric" style="width: 100%; display: flex; justify-content: center;"></div> 
    </Demo> 
</ClientOnly>

```typescript
// Calculate distance for each shot
new Rink("#container").render().addHexbin(shots, {
  radius: 5,
  // Calculate distance from center ice (0,0) as a mock metric
  value: (d) => Math.sqrt(d.coordinates.x ** 2 + d.coordinates.y ** 2),
  aggregation: "mean",
  colorScale: d3.scaleSequential(d3.interpolateViridis),
  opacity: 0.9,
});
```

<script setup>
import { onMounted } from 'vue'

onMounted(async () => {
  // Dynamic imports ensure client-side execution in VitePress
  const { Rink, NHLDataManager } = await import('d3-hockey')
  const d3 = await import('d3')
  
  // Load the sample data once for all examples
  // We handle the fetch error gracefully just in case
  let shots = [];
  try {
    const response = await fetch('/data/game-2022020195.json');
    if (response.ok) {
      const gameData = await response.json();
      // Initialize manager and extract just the shot events
      const manager = NHLDataManager.fromResponse(gameData, "2022020195");
      shots = manager.getAllEvents({ shotsOnly: true });
    }
  } catch (e) {
    console.error("Failed to load demo data:", e);
  }

  // Render charts after a brief delay to ensure DOM elements are ready
  setTimeout(() => {
    if (!shots.length) return;

    // --- Demo 1: Basic Density ---
    const basicContainer = document.getElementById('demo-hexbin-basic')
    if (basicContainer) {
      new Rink(basicContainer)
        .render()
        .addHexbin(shots, {
          radius: 4,
          opacity: 0.8,
          aggregation: "count"
        });
    }

    // --- Demo 2: Large Bins ---
    const largeContainer = document.getElementById('demo-hexbin-large')
    if (largeContainer) {
      new Rink(largeContainer)
        .render()
        .addHexbin(shots, {
          radius: 8,
          opacity: 0.7,
          stroke: "#fff",
          strokeWidth: 1
        });
    }

    // --- Demo 3: Metric (Distance) ---
    const metricContainer = document.getElementById('demo-hexbin-metric')
    if (metricContainer) {
      new Rink(metricContainer)
        .render()
        .addHexbin(shots, {
          radius: 5,
          // Calculate distance from center ice (0,0)
          value: (d) => Math.sqrt(d.coordinates.x ** 2 + d.coordinates.y ** 2),
          aggregation: "mean",
          colorScale: d3.scaleSequential(d3.interpolateViridis),
          opacity: 0.9
        });
    }
  }, 100)
})
</script>
