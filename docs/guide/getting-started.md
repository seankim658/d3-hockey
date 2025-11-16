# Getting Started

Welcome to d3-hockey! This guide will help you create your first hockey visualization in minutes.

## Installation

Install d3-hockey and its peer dependency D3.js:

::: code-group

```bash [npm]
npm install d3-hockey d3
```

```bash [yarn]
yarn add d3-hockey d3
```

```bash [pnpm]
pnpm add d3-hockey d3
```

:::

## Your First Visualization

Let's create a simple hockey rink with some shot data.

### 1. Create the rink

```typescript
import { Rink } from "d3-hockey";

// Create and render a rink
new Rink("#rink").render();
```

That's it! You now have a hockey rink.

### 2. Add shot data

Let's add some shot data to visualize:

```typescript
import { Rink } from "d3-hockey";

// Sample shot data
const shots = [
  { coordinates: { x: 75, y: 10 }, eventType: "GOAL" },
  { coordinates: { x: 80, y: -5 }, eventType: "SHOT" },
  { coordinates: { x: 70, y: 15 }, eventType: "SHOT" },
  { coordinates: { x: 85, y: 0 }, eventType: "MISSED_SHOT" },
];

// Create rink and add events
new Rink("#rink").addEvents(shots, {
  id: "shots",
  radius: 8,
  color: (d) => {
    if (d.eventType === "GOAL") return "#4CAF50";
    if (d.eventType === "SHOT") return "#2196F3";
    return "#FF9800";
  },
  opacity: 0.7,
  stroke: "#000",
  strokeWidth: 1,
});
```

## Using NHL API Data

d3-hockey has built-in support for NHL API data:

```typescript
import { Rink, parseNHLAPIResponse, flipCoordinatesByPeriod } from "d3-hockey";

// Fetch NHL data
const response = await fetch(
  "https://api-web.nhle.com/v1/gamecenter/2023020001/play-by-play",
);
const data = await response.json();

// Parse events with location data
const events = parseNHLAPIResponse(data);

// Handle coordinate flipping for different periods
const normalizedEvents = events.map((event) => ({
  ...event,
  coordinates: flipCoordinatesByPeriod(
    { x: event.coordinates.x, y: event.coordinates.y },
    event.period || 1,
  ),
}));

// Create visualization
new Rink("#rink").render().addEvents(normalizedEvents, {
  id: "nhl-events",
});
```

## Next Steps

Now that you've created your first visualization, explore these topics:

- [Core Concepts](/guide/core-concepts) - Understand the layer system
- [Creating a Rink](/guide/creating-a-rink) - All rink configuration options
- [Working with Layers](/guide/working-with-layers) - Layer types and customization
- [Examples](/examples/) - See more visualization patterns

## Need Help?

- Check out the [Examples](/examples/) for common patterns
- Read the [API Reference](/api/) for detailed documentation
- [Open an issue](https://github.com/seankim658/d3-hockey/issues) on GitHub
