---
layout: home

hero:
  name: "d3-hockey"
  text: "Production-ready hockey visualization"
  tagline: A comprehensive D3.js library for creating beautiful, interactive hockey data visualizations with minimal effort
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: View Examples
      link: /examples/
    - theme: alt
      text: API Reference
      link: /api/

features:
  - icon: 🏒
    title: Layer-Based Architecture
    details: Build complex visualizations by stacking layers - rink rendering, shot charts, heatmaps, and custom overlays.

  - icon: ⚡
    title: Simple or Powerful
    details: Use defaults for quick visualizations, or dive deep with customizations.

  - icon: 🎯
    title: NHL API Ready
    details: Built-in support for NHL API data with automatic coordinate transformations, period handling, and event type detection.

  - icon: 🎨
    title: Ready Out of the Box
    details: Professional team colors for all 32 NHL teams, smooth animations, and sensible defaults.

  - icon: 🔧
    title: Highly Extensible
    details: Every component can be overridden and is designed to be extended. Build custom layers, create new chart types, and integrate with your existing D3 code.

  - icon: 📊
    title: Advanced Features
    details: Hexbin aggregation, custom symbols, dynamic data rendering, interactive tooltips, and more specialized hockey visualization patterns.
---

## Quick Start

Install via npm:

```bash
npm install d3-hockey d3
```

Create your first visualization:

```typescript
import { Rink } from "d3-hockey";

// Simplified shot data
const shots = [
  { coordinates: { x: 75, y: 10 }, player: "Ovechkin" },
  { coordinates: { x: 80, y: -5 }, player: "Backstrom" },
  { coordinates: { x: 70, y: 15 }, player: "Green" },
];

// Create a rink and add shot data
new Rink("#container").width(1000).height(425).render().addEvents(shots, {
  id: "shots",
  color: "#FF4C00",
  radius: 5,
});
```
