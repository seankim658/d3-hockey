# d3-hockey

A D3.js library for creating interactive hockey visualizations.

## Installation

```bash
npm install d3-hockey
```

## Quick Start

```typescript
import { Rink, EventLayer } from "d3-hockey";

// Sample shot data (NHL coordinate system: center ice is 0,0)
const shots = [
  { coordinates: { x: 75, y: 10 }, type: "goal", team: "TOR" },
  { coordinates: { x: 68, y: -15 }, type: "shot-on-goal", team: "TOR" },
  { coordinates: { x: 82, y: 5 }, type: "shot-on-goal", team: "MTL" },
];

// Create a rink
const rink = new Rink("#container").width(800).height(340).draw();

// Add shot data
const shotLayer = new EventLayer(shots, {
  color: (d) => (d.type === "goal" ? "#c8102e" : "#003e7e"),
  radius: 6,
});

rink.addLayer(shotLayer);
```

## Features

- **Rink Rendering** - Full and half-rink views with accurate NHL dimensions
- **Event Layer** - Plot shots, hits, and other events with customizable symbols
- **Hexbin Layer** - Aggregate data into hexagonal bins with built-in statistics
- **Heatmap Layer** - Continuous density visualization using kernel density estimation
- **NHL API Integration** - Fetch and parse live game data directly from the NHL API
- **Coordinate Utilities** - Transform between NHL API and SVG coordinate systems
- **Team Colors** - All 32 NHL team color palettes included

## NHL API Example

```typescript
import { Rink, EventLayer, NHLDataManager, isShotEvent } from "d3-hockey";

const rink = new Rink("#container");

// Fetch game data
const manager = await NHLDataManager.fromGameId("2022020195", {
  flipCoordinates: true,
});
const shots = manager.getAllEvents({ shotsOnly: true });

// Visualize
rink.render().addEvents(shots, {
  color: colorByTeam("team"),
});
```

## Documentation

Full documentation and examples available at: **[https://seankim658.github.io/d3-hockey/](https://seankim658.github.io/d3-hockey/)**

## License

MIT
