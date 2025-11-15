# Shot Charts

Visualize shot data with customizable markers, colors, and interactive tooltips.

## Basic Shot Chart

Plot shot locations with simple circles—the foundation of hockey analytics visualization.

<ClientOnly>
  <Demo title="Basic Shot Chart">
    <div id="demo-basic-shot-chart" style="width: 100%; display: flex; justify-content: center;"></div>
  </Demo>
</ClientOnly>

```typescript
import { Rink } from "d3-hockey";

const shots = [
  { coordinates: { x: 70, y: 15 }, player: "McDavid" },
  { coordinates: { x: 65, y: -10 }, player: "Draisaitl" },
  { coordinates: { x: 80, y: 0 }, player: "Hyman" },
];

new Rink("#container").width(800).height(340).render().addEvents(shots, {
  id: "shots",
  color: "#FF4C00",
  radius: 5,
});
```

## Different Symbol Types

Use different symbols to distinguish between event types—goals as stars, shots as circles, and blocks as crosses.

<ClientOnly>
  <Demo title="Different Symbol Types">
    <div id="demo-symbol-types" style="width: 100%; display: flex; justify-content: center;"></div>
  </Demo>
</ClientOnly>

```typescript
import { Rink, colorByCategory } from "d3-hockey";

const events = [
  { coordinates: { x: 85, y: 5 }, type: "goal", player: "Matthews" },
  { coordinates: { x: 75, y: -8 }, type: "shot", player: "Marner" },
  { coordinates: { x: 70, y: 12 }, type: "shot", player: "Nylander" },
  { coordinates: { x: 60, y: -15 }, type: "blocked", player: "Tavares" },
];

new Rink("#container")
  .width(800)
  .height(340)
  .render()
  .addEvents(events, {
    id: "events",
    color: colorByCategory("type", {
      colors: {
        goal: "#00ff00",
        shot: "#0088ff",
        blocked: "#ff6600",
      },
    }),
    symbolSize: 100,
  });
```

## Dynamic Sizing

Size events based on data properties—larger circles for higher shot danger or expected goals.

<ClientOnly>
  <Demo title="Dynamic Sizing">
    <div id="demo-dynamic-sizing" style="width: 100%; display: flex; justify-content: center;"></div>
  </Demo>
</ClientOnly>

```typescript
import { Rink, scaleRadiusByProperty } from "d3-hockey";

const shotsWithDanger = [
  { coordinates: { x: 85, y: 2 }, xG: 0.35, player: "Kane" },
  { coordinates: { x: 70, y: 15 }, xG: 0.12, player: "DeBrincat" },
  { coordinates: { x: 80, y: -5 }, xG: 0.28, player: "Toews" },
  { coordinates: { x: 55, y: 8 }, xG: 0.05, player: "Johnson" },
];

new Rink("#container")
  .width(800)
  .height(340)
  .render()
  .addEvents(shotsWithDanger, {
    id: "xg-shots",
    color: "#c8102e",
    radius: scaleRadiusByProperty("xG", {
      min: 3,
      max: 23,
      domain: [0, 1],
    }),
    opacity: 0.7,
  });
```

## Color by Data

Use color gradients to represent continuous data like shot danger or distance from goal.

<ClientOnly>
  <Demo title="Color by Data">
    <div id="demo-color-by-data" style="width: 100%; display: flex; justify-content: center;"></div>
  </Demo>
</ClientOnly>

```typescript
import { Rink, colorByProperty } from "d3-hockey";

const shots = [
  { coordinates: { x: 85, y: 3 }, xG: 0.32, player: "Pastrnak" },
  { coordinates: { x: 75, y: -12 }, xG: 0.15, player: "Marchand" },
  { coordinates: { x: 88, y: -2 }, xG: 0.38, player: "Bergeron" },
  { coordinates: { x: 65, y: 18 }, xG: 0.08, player: "Coyle" },
];

new Rink("#container")
  .width(800)
  .height(340)
  .render()
  .addEvents(shots, {
    id: "heat-shots",
    // Built-in shotQuality scale (yellow to red)
    color: colorByProperty("xG", {
      scale: "shotQuality",
      domain: [0, 0.4],
    }),
    radius: 6,
    stroke: "#fff",
    strokeWidth: 1.5,
  });
```

## Custom Tooltips

Create rich, informative tooltips with custom formatting and styling.

<ClientOnly>
  <Demo title="Custom Tooltips">
    <div id="demo-custom-tooltips" style="width: 100%; display: flex; justify-content: center;"></div>
  </Demo>
</ClientOnly>

```typescript
import { Rink, colorByCategory } from "d3-hockey";

const detailedShots = [
  {
    coordinates: { x: 82, y: 8 },
    player: "Ovechkin",
    shotType: "Wrist Shot",
    result: "Goal",
    speed: 98,
  },
  {
    coordinates: { x: 68, y: -15 },
    player: "Backstrom",
    shotType: "Snap Shot",
    result: "Save",
    speed: 85,
  },
];

new Rink("#container")
  .width(800)
  .height(340)
  .render()
  .addEvents(detailedShots, {
    id: "detailed-shots",
    color: colorByCategory("result", {
      colors: {
        Goal: "#00ff00",
        Save: "#0088ff",
      },
    }),
    radius: 5,
    tooltip: (d) => `<strong>${d.player}</strong><br/>
      ${d.shotType} - ${d.result}<br/>
      Speed: ${d.speed} MPH<br/>
      Location: (${d.coordinates.x.toFixed(1)}, ${d.coordinates.y.toFixed(1)})
    `,
  });
```

## Animation Control

Control animation timing and easing for smooth, professional transitions.

<ClientOnly>
  <Demo title="Animation Control">
    <div id="demo-animation-control" style="width: 100%; display: flex; justify-content: center;"></div>
  </Demo>
</ClientOnly>

```typescript
import { Rink } from "d3-hockey";

const shots = [
  { coordinates: { x: 75, y: 10 }, player: "Crosby" },
  { coordinates: { x: 82, y: -5 }, player: "Malkin" },
  { coordinates: { x: 68, y: 12 }, player: "Rust" },
];

new Rink("#container").width(800).height(340).render().addEvents(shots, {
  id: "animated-shots",
  color: "#FCB514",
  radius: 5,
  animate: true,
  animationDuration: 800,
  animationEasing: "easeElasticOut",
});
```

## Multiple Event Layers

Combine multiple event layers to show different data sets simultaneously—home vs. away, different periods, or multiple players.

<ClientOnly>
  <Demo title="Multiple Event Layers">
    <div id="demo-multiple-layers" style="width: 100%; display: flex; justify-content: center;"></div>
  </Demo>
</ClientOnly>

```typescript
import { Rink } from "d3-hockey";

const homeShots = [
  { coordinates: { x: 75, y: 8 }, team: "home" },
  { coordinates: { x: 82, y: -3 }, team: "home" },
  { coordinates: { x: 68, y: 15 }, team: "home" },
];

const awayShots = [
  { coordinates: { x: -78, y: -10 }, team: "away" },
  { coordinates: { x: -85, y: 5 }, team: "away" },
  { coordinates: { x: -70, y: 12 }, team: "away" },
];

const rink = new Rink("#container").width(800).height(340).render();

// Add home team shots
rink.addEvents(homeShots, {
  id: "home",
  color: "#003e7e",
  radius: 5,
  opacity: 0.7,
});

// Add away team shots
rink.addEvents(awayShots, {
  id: "away",
  color: "#c8102e",
  radius: 5,
  opacity: 0.7,
});
```

<script setup>
import { onMounted } from 'vue'

onMounted(async () => {
  const { Rink, scaleRadiusByProperty, colorByProperty, colorByCategory } = await import('d3-hockey')

  setTimeout(() => {
    // Basic Shot Chart
    const basicShots = [
      { coordinates: { x: 70, y: 15 }, player: 'McDavid' },
      { coordinates: { x: 65, y: -10 }, player: 'Draisaitl' },
      { coordinates: { x: 80, y: 0 }, player: 'Hyman' }
    ]
    const basicContainer = document.getElementById('demo-basic-shot-chart')
    if (basicContainer) {
      new Rink(basicContainer)
        .width(800).height(340)
        .render()
        .addEvents(basicShots, { id: 'shots', color: '#FF4C00', radius: 5 })
    }

    // Symbol Types
    const symbolEvents = [
      { coordinates: { x: 85, y: 5 }, type: 'goal', player: 'Matthews' },
      { coordinates: { x: 75, y: -8 }, type: 'shot', player: 'Marner' },
      { coordinates: { x: 70, y: 12 }, type: 'shot', player: 'Nylander' },
      { coordinates: { x: 60, y: -15 }, type: 'blocked', player: 'Tavares' }
    ]
    const symbolContainer = document.getElementById('demo-symbol-types')
    if (symbolContainer) {
      new Rink(symbolContainer)
        .width(800).height(340)
        .render()
        .addEvents(symbolEvents, {
          id: 'events',
          color: colorByCategory('type', {
            colors: { goal: '#00ff00', shot: '#0088ff', blocked: '#ff6600' }
          }),
          symbolSize: 100
        })
    }

    // Dynamic Sizing
    const shotsWithDanger = [
      { coordinates: { x: 85, y: 2 }, xG: 0.35, player: 'Kane' },
      { coordinates: { x: 70, y: 15 }, xG: 0.12, player: 'DeBrincat' },
      { coordinates: { x: 80, y: -5 }, xG: 0.28, player: 'Toews' },
      { coordinates: { x: 55, y: 8 }, xG: 0.05, player: 'Johnson' }
    ]
    const dynamicContainer = document.getElementById('demo-dynamic-sizing')
    if (dynamicContainer) {
      new Rink(dynamicContainer)
        .width(800).height(340)
        .render()
        .addEvents(shotsWithDanger, {
          id: 'xg-shots',
          color: '#c8102e',
          radius: scaleRadiusByProperty('xG', { min: 3, max: 23, domain: [0, 1] }),
          opacity: 0.7
        })
    }

    // Color by Data
    const heatShots = [
      { coordinates: { x: 85, y: 3 }, xG: 0.32, player: 'Pastrnak' },
      { coordinates: { x: 75, y: -12 }, xG: 0.15, player: 'Marchand' },
      { coordinates: { x: 88, y: -2 }, xG: 0.38, player: 'Bergeron' },
      { coordinates: { x: 65, y: 18 }, xG: 0.08, player: 'Coyle' }
    ]
    const colorContainer = document.getElementById('demo-color-by-data')
    if (colorContainer) {
      new Rink(colorContainer)
        .width(800).height(340)
        .render()
        .addEvents(heatShots, {
          id: 'heat-shots',
          color: colorByProperty('xG', { scale: 'shotQuality', domain: [0, 0.4] }),
          radius: 6,
          stroke: '#fff',
          strokeWidth: 1.5
        })
    }

    // Custom Tooltips
    const detailedShots = [
      { coordinates: { x: 82, y: 8 }, player: 'Ovechkin', shotType: 'Wrist Shot', result: 'Goal', speed: 98 },
      { coordinates: { x: 68, y: -15 }, player: 'Backstrom', shotType: 'Snap Shot', result: 'Save', speed: 85 }
    ]
    const tooltipContainer = document.getElementById('demo-custom-tooltips')
    if (tooltipContainer) {
      new Rink(tooltipContainer)
        .width(800).height(340)
        .render()
        .addEvents(detailedShots, {
          id: 'detailed-shots',
          color: colorByCategory('result', {
            colors: { Goal: '#00ff00', Save: '#0088ff' }
          }),
          radius: 5,
          tooltip: (d) => `
            <strong>${d.player}</strong><br/>
            ${d.shotType} - ${d.result}<br/>
            Speed: ${d.speed} MPH<br/>
            Location: (${d.coordinates.x.toFixed(1)}, ${d.coordinates.y.toFixed(1)})
          `
        })
    }

    // Animation Control
    const animatedShots = [
      { coordinates: { x: 75, y: 10 }, player: 'Crosby' },
      { coordinates: { x: 82, y: -5 }, player: 'Malkin' },
      { coordinates: { x: 68, y: 12 }, player: 'Rust' }
    ]
    const animationContainer = document.getElementById('demo-animation-control')
    if (animationContainer) {
      new Rink(animationContainer)
        .width(800).height(340)
        .render()
        .addEvents(animatedShots, {
          id: 'animated-shots',
          color: '#FCB514',
          radius: 5,
          animate: true,
          animationDuration: 800,
          animationEasing: 'easeElasticOut'
        })
    }

    // Multiple Layers
    const homeShots = [
      { coordinates: { x: 75, y: 8 }, team: 'home' },
      { coordinates: { x: 82, y: -3 }, team: 'home' },
      { coordinates: { x: 68, y: 15 }, team: 'home' }
    ]
    const awayShots = [
      { coordinates: { x: -78, y: -10 }, team: 'away' },
      { coordinates: { x: -85, y: 5 }, team: 'away' },
      { coordinates: { x: -70, y: 12 }, team: 'away' }
    ]
    const multiLayerContainer = document.getElementById('demo-multiple-layers')
    if (multiLayerContainer) {
      const multiLayerRink = new Rink(multiLayerContainer).width(800).height(340).render()
      multiLayerRink.addEvents(homeShots, { id: 'home', color: '#003e7e', radius: 5, opacity: 0.7 })
      multiLayerRink.addEvents(awayShots, { id: 'away', color: '#c8102e', radius: 5, opacity: 0.7 })
    }
  }, 100)
})
</script>
