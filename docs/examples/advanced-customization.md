# Advanced Customization

Learn how to create sophisticated hockey visualizations using the `customRender` hook and advanced configuration options.

## What is customRender?

The `customRender` hook gives you direct access to D3 selections and calculated position data, allowing you to add custom elements, interactions, and behaviors beyond the standard configuration.

```typescript
customRender: (selection, dimensions, context) => {
  // selection: D3 selection of event elements
  // dimensions: { scale, padding, width, height }
  // context: { position, data, index, container, layer }

  const { position, data, index, container } = context;
  // position: { svgX, svgY, dataX, dataY }
  // data: your event data
  // index: element index
  // container: parent SVG group for adding siblings
};
```

## When to Use

Use `customRender` when you need to:

- Add labels, arrows, or decorative elements
- Create composite visualizations
- Add custom interactions beyond tooltips
- Build conditional visualizations
- Connect events with lines or paths

Don't use `customRender` for:

- Simple color/size changes (use config options)
- Adding basic attributes (use `customAttributes`)
- Entirely new layer types (extend `BaseLayer`)

## Player Name Labels

Add text labels showing player names next to each event.

<ClientOnly>
  <Demo title="Player Labels">
    <div id="demo-player-labels-adv" style="width: 100%; display: flex; justify-content: center;"></div>
  </Demo>
</ClientOnly>

```typescript
import { Rink } from "d3-hockey";
import * as d3 from "d3";

const shots = [
  { coordinates: { x: 48, y: 15 }, player: "Ovechkin", type: "GOAL" },
  { coordinates: { x: 73, y: -10 }, player: "Backstrom", type: "SHOT" },
  { coordinates: { x: 70, y: 12 }, player: "Wilson", type: "SHOT" },
];

new Rink("#container").render().addEvents(shots, {
  id: "labeled",
  radius: 5,
  tooltip: (d) => `<strong>${d.player}</strong><br/>
            Event: ${d.type}<br/>
            Location (${d.coordinates.x}, ${d.coordinates.y})`,
  customRender: (selection, dimensions, context) => {
    const { position, data, container } = context;
    d3.select(container)
      .append("text")
      .attr("x", position.svgX + 10)
      .attr("y", position.svgY - 10)
      .attr("font-size", "11px")
      .attr("font-weight", "bold")
      .attr("fill", "#000")
      .text(data.player);
  },
});
```

## Speed Rings

Visualize shot speed with rings around each event.

<ClientOnly>
  <Demo title="Speed Rings">
    <div id="demo-speed-rings-adv" style="width: 100%; display: flex; justify-content: center;"></div>
  </Demo>
</ClientOnly>

```typescript
const shotsWithSpeed = [
  { coordinates: { x: 45, y: 3 }, player: "Weber", speed: 108 },
  { coordinates: { x: 55, y: -8 }, player: "Subban", speed: 95 },
  { coordinates: { x: 70, y: 12 }, player: "Gallagher", speed: 82 },
];

new Rink("#container").render().addEvents(shotsWithSpeed, {
  id: "speed",
  radius: 5,
  tooltip: (d) => `<strong>${d.player}</strong><br/>
            Speed: ${d.speed} mph<br/>
            Location: (${d.coordinates.x}, ${d.coordinates.y})`,
  customRender: (selection, dimensions, context) => {
    const { position, data, container } = context;
    const ringRadius = ((data.speed - 60) / 60) * 20;
    d3.select(container)
      .append("circle")
      .attr("cx", position.svgX)
      .attr("cy", position.svgY)
      .attr("r", ringRadius)
      .attr("fill", "none")
      .attr("stroke", "#2196F5")
      .attr("stroke-width", 1.5)
      .attr("stroke-dasharray", "3,3")
      .attr("opacity", 0.6);
  },
});
```

## Pulsating Goals

Make goals stand out with pulsating animations.

<ClientOnly>
  <Demo title="Pulsating Goals">
    <div id="demo-pulsating-adv" style="width: 100%; display: flex; justify-content: center;"></div>
  </Demo>
</ClientOnly>

```typescript
const events = [
  { coordinates: { x: 85, y: 5 }, type: "GOAL", player: "Matthews" },
  { coordinates: { x: 75, y: -8 }, type: "SHOT", player: "Marner" },
  { coordinates: { x: 70, y: 12 }, type: "SHOT", player: "Nylander" },
];

new Rink("#container").render().addEvents(events, {
  id: "pulsating-goals",
  radius: 6,
  tooltip: (d) => `<strong>${d.player}</strong><br/>
    Event: ${d.type}<br/>
    Location: (${d.coordinates.x}, ${d.coordinates.y})`,
  customRender: (selection, dimensions, context) => {
    if (context.data.type !== "GOAL") return;
    function pulse() {
      selection
        .transition()
        .duration(1000)
        .attr("opacity", 0.3)
        .transition()
        .duration(1000)
        .attr("opacity", 1)
        .on("end", pulse);
    }

    const animationDelay = context.layer.config.animate
      ? context.layer.config.animationDuration + 50
      : 0;

    setTimeout(pulse, animationDelay);
  },
});
```

## Shot Sequence

Connect shots with lines to show passing or shot sequences.

<ClientOnly>
  <Demo title="Shot Sequence">
    <div id="demo-sequence-adv" style="width: 100%; display: flex; justify-content: center;"></div>
  </Demo>
</ClientOnly>

```typescript
const sequence = [
  { coordinates: { x: 50, y: 5 }, player: "A", sequence: 1 },
  { coordinates: { x: 65, y: 10 }, player: "B", sequence: 2 },
  { coordinates: { x: 80, y: 5 }, player: "C", sequence: 3, type: "GOAL" },
];

// Store positions for connecting lines
const positions = [];

new Rink("#container").render().addEvents(sequence, {
  id: "sequence",
  color: (d) => (d.type === "GOAL" ? "#00FF00" : "#FF4C00"),
  radius: 5,
  customRender: (selection, dimensions, context) => {
    const { position, data, container, index } = context;

    // Collect positions
    positions.push({
      x: position.svgX,
      y: position.svgY,
      sequence: data.sequence,
    });

    // Draw connecting lines after last element
    if (index === sequence.length - 1) {
      const parent = d3.select(container);
      positions.sort((a, b) => a.sequence - b.sequence);

      for (let i = 0; i < positions.length - 1; i++) {
        const start = positions[i];
        const end = positions[i + 1];

        parent
          .insert("line", ":first-child")
          .attr("class", "sequence-line")
          .attr("x1", start.x)
          .attr("y1", start.y)
          .attr("x2", end.x)
          .attr("y2", end.y)
          .attr("stroke", "#2196F3")
          .attr("stroke-width", 2)
          .attr("stroke-dasharray", "5,5")
          .attr("opacity", 0.6);
      }
    }
  },
});
```

## Click Interactions

Add custom click handlers to events.

<ClientOnly>
  <Demo title="Clickable Events">
    <div style="display: block; width: 100%">
        <div id="demo-clickable-adv" style="width: 100%; display: flex; justify-content: center;"></div>
        <div id="shot-details-adv" style="margin-top: 1rem; padding: 1rem; background: #f5f5f5; border-radius: 4px; min-height: 60px;"></div>
    </div>
  </Demo>
</ClientOnly>

```typescript
const shots = [
  {
    coordinates: { x: 85, y: 5 },
    player: "Kane",
    shotType: "Wrist Shot",
    speed: 95,
  },
  {
    coordinates: { x: 75, y: -8 },
    player: "Toews",
    shotType: "Slap Shot",
    speed: 102,
  },
];

new Rink("#container").render().addEvents(shots, {
  id: "clickable",
  color: "#c8102e",
  radius: 6,
  customRender: (selection, dimensions, context) => {
    const { data, layer } = context;

    selection
      .on("click", function (event) {
        event.stopPropagation();

        // Highlight clicked element
        d3.selectAll("path.event-symbol").attr("stroke-width", 1);
        d3.select(this).attr("stroke-width", 4).attr("stroke", "#000");

        // Update details panel
        d3.select("#shot-details").html(`
          <h4 style="margin: 0 0 0.5rem 0;">${data.player}</h4>
          <p style="margin: 0;">
            <strong>Shot Type:</strong> ${data.shotType}<br/>
            <strong>Speed:</strong> ${data.speed} MPH<br/>
            <strong>Location:</strong> (${data.coordinates.x}, ${data.coordinates.y})
          </p>
        `);
      })
      .on("mouseenter", function () {
        d3.select(this).attr("opacity", 0.7);
      })
      .on("mouseleave", function () {
        d3.select(this).attr("opacity", 1);
      });
  },
});
```

## Conditional Decorations

Add different decorations based on event properties.

<ClientOnly>
  <Demo title="Conditional Decorations">
    <div id="demo-conditional-adv" style="width: 100%; display: flex; justify-content: center;"></div>
  </Demo>
</ClientOnly>

```typescript
const events = [
  { coordinates: { x: 85, y: 5 }, type: "GOAL" },
  { coordinates: { x: 75, y: -8 }, type: "SHOT" },
  { coordinates: { x: 60, y: 12 }, type: "MISSED" },
];

new Rink("#container").render().addEvents(events, {
  id: "conditional",
  color: (d) => {
    if (d.type === "GOAL") return "#00FF00";
    if (d.type === "MISSED") return "#FF6600";
    return "#0088FF";
  },
  radius: 5,
  customRender: (selection, dimensions, context) => {
    const { position, data, container } = context;
    const parent = d3.select(container);

    if (data.type === "GOAL") {
      // Add star burst for goals
      for (let i = 0; i < 8; i++) {
        const angle = i * 45 * (Math.PI / 180);
        const length = 15;

        parent
          .append("line")
          .attr("class", "goal-burst")
          .attr("x1", position.svgX)
          .attr("y1", position.svgY)
          .attr("x2", position.svgX + Math.cos(angle) * length)
          .attr("y2", position.svgY + Math.sin(angle) * length)
          .attr("stroke", "#FFD700")
          .attr("stroke-width", 2)
          .attr("opacity", 0.7);
      }
    } else if (data.type === "MISSED") {
      // Add X mark for misses
      parent
        .append("path")
        .attr("class", "miss-mark")
        .attr(
          "d",
          `M ${position.svgX - 8},${position.svgY - 8} L ${position.svgX + 8},${position.svgY + 8} M ${position.svgX - 8},${position.svgY + 8} L ${position.svgX + 8},${position.svgY - 8}`,
        )
        .attr("stroke", "#F44336")
        .attr("stroke-width", 2)
        .attr("opacity", 0.5);
    }
  },
});
```

## Heat Trails

Create heat trail effects behind events.

<ClientOnly>
  <Demo title="Heat Trails">
    <div id="demo-trails-adv" style="width: 100%; display: flex; justify-content: center;"></div>
  </Demo>
</ClientOnly>

```typescript
const shots = [
  { coordinates: { x: 85, y: 5 }, danger: 0.8 },
  { coordinates: { x: 75, y: -10 }, danger: 0.5 },
  { coordinates: { x: 60, y: 12 }, danger: 0.3 },
];

new Rink("#container").render().addEvents(shots, {
  id: "trails",
  color: "#FF4C00",
  radius: 5,
  customRender: (selection, dimensions, context) => {
    const { position, data, container } = context;
    const parent = d3.select(container);

    // Create gradient rings based on danger
    const numRings = 3;
    for (let i = 0; i < numRings; i++) {
      parent
        .insert("circle", ":first-child")
        .attr("cx", position.svgX)
        .attr("cy", position.svgY)
        .attr("r", 5 + i * 8)
        .attr("fill", "#FF4C00")
        .attr("opacity", data.danger * 0.4 - i * 0.1)
        .attr("class", "heat-trail");
    }
  },
});
```

<script setup>

import { onMounted } from 'vue'

onMounted(async () => {
  const { Rink } = await import('d3-hockey')
  const d3 = await import('d3')
  
  setTimeout(() => {
    const labelShots = [
      { coordinates: { x: 48, y: 15 }, player: 'Ovechkin', type: 'GOAL' },
      { coordinates: { x: 73, y: -10 }, player: 'Backstrom', type: 'SHOT' },
      { coordinates: { x: 70, y: 12 }, player: 'Wilson', type: 'SHOT' }
    ]
    const labelContainer = document.getElementById('demo-player-labels-adv')
    if (labelContainer) {
      new Rink(labelContainer)
        .render()
        .addEvents(labelShots, {
          id: 'labeled',
          radius: 5,
          tooltip: (d) => `<strong>${d.player}</strong><br/>
            Event: ${d.type}<br/>
            Location: (${d.coordinates.x}, ${d.coordinates.y})`,
          customRender: (selection, dimensions, context) => {
            const { position, data, container } = context
            d3.select(container)
              .append('text')
              .attr('x', position.svgX + 10)
              .attr('y', position.svgY - 10)
              .attr('font-size', '11px')
              .attr('font-weight', 'bold')
              .attr('fill', '#000')
              .text(data.player)
          }
        })
    }

    const speedShots = [
      { coordinates: { x: 45, y: 3 }, player: 'Weber', speed: 108 },
      { coordinates: { x: 55, y: -8 }, player: 'Subban', speed: 95 },
      { coordinates: { x: 70, y: 12 }, player: 'Gallagher', speed: 82 }
    ]
    const speedContainer = document.getElementById('demo-speed-rings-adv')
    if (speedContainer) {
      new Rink(speedContainer)
        .render()
        .addEvents(speedShots, {
          id: 'speed',
          radius: 5,
          tooltip: (d) => `<strong>${d.player}</strong><br/>
            Speed: ${d.speed} mph<br/>
            Location: (${d.coordinates.x}, ${d.coordinates.y})`,
          customRender: (selection, dimensions, context) => {
            const { position, data, container } = context
            const ringRadius = ((data.speed - 60) / 60) * 20
            d3.select(container)
              .append('circle')
              .attr('cx', position.svgX)
              .attr('cy', position.svgY)
              .attr('r', ringRadius)
              .attr('fill', 'none')
              .attr('stroke', '#2196F5')
              .attr('stroke-width', 1.5)
              .attr('stroke-dasharray', '3,3')
              .attr('opacity', 0.6)
          }
        })
    }

    const pulsatingEvents = [
      { coordinates: { x: 85, y: 5 }, type: 'GOAL', player: 'Matthews' },
      { coordinates: { x: 75, y: -8 }, type: 'SHOT', player: 'Marner' },
      { coordinates: { x: 70, y: 12 }, type: 'SHOT', player: 'Nylander' }
    ]
    const pulsatingContainer = document.getElementById('demo-pulsating-adv')
    if (pulsatingContainer) {
      new Rink(pulsatingContainer)
        .render()
        .addEvents(pulsatingEvents, {
          id: 'pulsating',
          radius: 6,
          tooltip: (d) => `<strong>${d.player}</strong><br/>
            Event: ${d.type}<br/>
            Location: (${d.coordinates.x}, ${d.coordinates.y})`,
          customRender: (selection, dimensions, context) => {
            if (context.data.type !== 'GOAL') return
            function pulse() {
              selection
                .transition()
                .duration(1000)
                .attr('opacity', 0.3)
                .transition()
                .duration(1000)
                .attr('opacity', 1)
                .on('end', pulse)
            }
            const animationDelay = context.layer.config.animate 
              ? context.layer.config.animationDuration + 50
              : 0;
            setTimeout(pulse, animationDelay)
          }
        })
    }

    const sequenceData = [
      { coordinates: { x: 50, y: 5 }, player: 'A', sequence: 1 },
      { coordinates: { x: 65, y: 10 }, player: 'B', sequence: 2 },
      { coordinates: { x: 80, y: 5 }, player: 'C', sequence: 3, type: 'GOAL' }
    ]
    const sequenceContainer = document.getElementById('demo-sequence-adv')
    if (sequenceContainer) {
      const positions = []
      new Rink(sequenceContainer)
        .render()
        .addEvents(sequenceData, {
          id: 'sequence',
          color: (d) => d.type === 'GOAL' ? '#00FF00' : '#FF4C00',
          radius: 5,
          customRender: (selection, dimensions, context) => {
            const { position, data, container, index } = context
            positions.push({
              x: position.svgX,
              y: position.svgY,
              sequence: data.sequence
            })
            if (index === sequenceData.length - 1) {
              const parent = d3.select(container)
              positions.sort((a, b) => a.sequence - b.sequence)
              for (let i = 0; i < positions.length - 1; i++) {
                const start = positions[i]
                const end = positions[i + 1]
                parent
                  .insert('line', ':first-child')
                  .attr('x1', start.x)
                  .attr('y1', start.y)
                  .attr('x2', end.x)
                  .attr('y2', end.y)
                  .attr('stroke', '#2196F3')
                  .attr('stroke-width', 2)
                  .attr('stroke-dasharray', '5,5')
                  .attr('opacity', 0.6)
              }
            }
          }
        })
    }

    const clickableShots = [
      { coordinates: { x: 85, y: 5 }, player: 'Kane', shotType: 'Wrist Shot', speed: 95 },
      { coordinates: { x: 75, y: -8 }, player: 'Toews', shotType: 'Slap Shot', speed: 102 }
    ]
    const clickableContainer = document.getElementById('demo-clickable-adv')
    if (clickableContainer) {
      new Rink(clickableContainer)
        .render()
        .addEvents(clickableShots, {
          id: 'clickable',
          color: '#c8102e',
          radius: 6,
          tooltip: (d) => `<strong>${d.player}</strong><br/>
            Shot Type: ${d.shotType}<br/>
            Location: (${d.coordinates.x}, ${d.coordinates.y})`,
          customRender: (selection, dimensions, context) => {
            const { data } = context
            selection
              .on('click', function(event) {
                event.stopPropagation()
                d3.selectAll('path.event-symbol').attr('stroke-width', 1)
                d3.select(this).attr('stroke-width', 4).attr('stroke', '#000')
                d3.select('#shot-details-adv').html(`
                  <div style="color: #333; font-size: 16px;">
                    <strong>${data.player}</strong> - ${data.shotType}, ${data.speed} MPH at (${data.coordinates.x}, ${data.coordinates.y})
                  </div>
                `)
              })
              .on('mouseenter', function() {
                d3.select(this).attr('opacity', 0.7)
              })
              .on('mouseleave', function() {
                d3.select(this).attr('opacity', 1)
              })
            }
        })
    }

    const conditionalEvents = [
      { coordinates: { x: 85, y: 5 }, type: 'GOAL' },
      { coordinates: { x: 75, y: -8 }, type: 'SHOT' },
      { coordinates: { x: 60, y: 12 }, type: 'MISSED' }
    ]
    const conditionalContainer = document.getElementById('demo-conditional-adv')
    if (conditionalContainer) {
      new Rink(conditionalContainer)
        .render()
        .addEvents(conditionalEvents, {
          id: 'conditional',
          color: (d) => {
            if (d.type === 'GOAL') return '#00FF00'
            if (d.type === 'MISSED') return '#FF6600'
            return '#0088FF'
          },
          radius: 5,
          customRender: (selection, dimensions, context) => {
            const { position, data, container } = context
            const parent = d3.select(container)
            if (data.type === 'GOAL') {
              for (let i = 0; i < 8; i++) {
                const angle = i * 45 * (Math.PI / 180)
                const length = 15
                parent
                  .append('line')
                  .attr('x1', position.svgX)
                  .attr('y1', position.svgY)
                  .attr('x2', position.svgX + Math.cos(angle) * length)
                  .attr('y2', position.svgY + Math.sin(angle) * length)
                  .attr('stroke', '#FFD700')
                  .attr('stroke-width', 2)
                  .attr('opacity', 0.7)
              }
            } else if (data.type === 'MISSED') {
              parent
                .append('path')
                .attr('d', `M ${position.svgX - 8},${position.svgY - 8} L ${position.svgX + 8},${position.svgY + 8} M ${position.svgX - 8},${position.svgY + 8} L ${position.svgX + 8},${position.svgY - 8}`)
                .attr('stroke', '#F44336')
                .attr('stroke-width', 2)
                .attr('opacity', 0.5)
            }
          }
        })
    }

    const trailShots = [
      { coordinates: { x: 85, y: 5 }, danger: 0.8 },
      { coordinates: { x: 75, y: -10 }, danger: 0.5 },
      { coordinates: { x: 60, y: 12 }, danger: 0.3 }
    ]
    const trailsContainer = document.getElementById('demo-trails-adv')
    if (trailsContainer) {
      new Rink(trailsContainer)
        .render()
        .addEvents(trailShots, {
          id: 'trails',
          color: '#FF4C00',
          radius: 5,
          customRender: (selection, dimensions, context) => {
            const { position, data, container } = context
            const parent = d3.select(container)
            const numRings = 3
            for (let i = 0; i < numRings; i++) {
              parent
                .insert('circle', ':first-child')
                .attr('cx', position.svgX)
                .attr('cy', position.svgY)
                .attr('r', 5 + i * 8)
                .attr('fill', '#FF4C00')
                .attr('opacity', data.danger * 0.4 - i * 0.1)
            }
          }
        })
    }
    
  }, 100)
})
</script>

## Tips & Best Practices

### Context Object

The `context` parameter provides everything you need:

```typescript
customRender: (selection, dimensions, context) => {
  const { position, data, index, container, layer } = context;

  // position.svgX/svgY - Calculated SVG pixel coordinates
  // position.dataX/dataY - Original NHL coordinates
  // data - Your event data (fully typed)
  // index - Element index in the dataset
  // container - Parent SVG group for adding siblings
  // layer - Reference to EventLayer instance
};
```

### Adding Sibling Elements

Use the `container` to add elements alongside the symbol:

```typescript
customRender: (selection, dimensions, context) => {
  d3.select(context.container)
    .append("text")
    .attr("x", context.position.svgX)
    .attr("y", context.position.svgY)
    .text(context.data.player);
};
```

### Accessing Layer Configuration

The `layer` property gives you access to all layer config:

```typescript
customRender: (selection, dimensions, context) => {
  // Access layer configuration
  const layerColor = context.layer.config.color;
  const layerRadius = context.layer.config.radius;

  // Use dimensions for scaling
  const scale = dimensions.scale;
};
```

### Performance Considerations

`customRender` is called once per element on each render:

- Keep operations efficient
- Avoid expensive calculations
- Filter early: `if (context.data.type !== "GOAL") return;`
- Consider debouncing for large datasets

## See Also

- [EventLayer API Reference](/api/event-layer)
- [Shot Charts Examples](/examples/shot-charts)
- [D3 Selection Documentation](https://d3js.org/d3-selection)
