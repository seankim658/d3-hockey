# Basic Rink

Render a hockey rink with default NHL dimensions and styling.

## Simple Rink

The most basic usage - just create a rink and render it.

<ClientOnly>
  <Demo title="Basic Rink">
    <div id="basic-rink-demo" style="width: 100%; display: flex; justify-content: center;"></div>
  </Demo>
</ClientOnly>

```typescript
import { Rink } from "d3-hockey";

new Rink("#container").width(800).height(340).render();
```

## Custom Colors

Override default colors to match team branding or personal preferences.

<ClientOnly>
  <Demo title="Custom Colors">
    <div id="custom-colors-demo" style="width: 100%; display: flex; justify-content: center;"></div>
  </Demo>
</ClientOnly>

```typescript
import { Rink } from "d3-hockey";

new Rink("#container")
  .width(800)
  .height(340)
  .colors({
    ice: "#000000",
    boards: "#003e7e",
    redLine: "#c8102e",
    blueLine: "#003e7e",
  })
  .render();
```

## Half Rink

Render just the offensive or defensive zone for focused analysis.

<ClientOnly>
  <Demo title="Half Rink (Offensive)">
    <div id="half-rink-demo" style="width: 100%; display: flex; justify-content: center;"></div>
  </Demo>
</ClientOnly>

```typescript
import { Rink } from "d3-hockey";

new Rink("#container")
  .width(600)
  .height(340)
  .halfRink(true, "offensive") // or "defensive"
  .render();
```

## Custom Sizing

Adjust dimensions and padding to fit your layout requirements.

<ClientOnly>
  <Demo title="Custom Sizing">
    <div id="custom-sizing-demo" style="width: 100%; display: flex; justify-content: center;"></div>
  </Demo>
</ClientOnly>

```typescript
import { Rink } from "d3-hockey";

new Rink("#container").width(600).height(255).padding(10).render();
```

<script setup>
import { onMounted } from 'vue'

onMounted(async () => {
  const { Rink } = await import('d3-hockey')
  
  setTimeout(() => {
    // Basic Rink
    const basicContainer = document.getElementById('basic-rink-demo')
    if (basicContainer) {
      new Rink(basicContainer).width(800).height(340).render()
    }
    
    // Custom Colors
    const colorsContainer = document.getElementById('custom-colors-demo')
    if (colorsContainer) {
      new Rink(colorsContainer)
        .width(800)
        .height(340)
        .padding(20)
        .colors({
          ice: '#000000',
          boards: '#003e7e',
          redLine: '#c8102e',
          blueLine: '#003e7e',
        })
        .render()
    }
    
    // Half Rink
    const halfContainer = document.getElementById('half-rink-demo')
    if (halfContainer) {
      new Rink(halfContainer)
        .width(600)
        .height(340)
        .padding(20)
        .halfRink(true, 'offensive')
        .render()
    }

    // Custom Sizing
    const sizingContainer = document.getElementById('custom-sizing-demo')
    if (sizingContainer) {
      new Rink(sizingContainer)
        .width(600)
        .height(255)
        .padding(10)
        .render()
    }
  }, 100)
})
</script>

## Framework Usage

### React

```jsx
import { useEffect, useRef } from "react";
import { Rink } from "d3-hockey";

function HockeyRink() {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      new Rink(containerRef.current).width(800).height(340).render();
    }
  }, []);

  return <div ref={containerRef} />;
}
```

### Vue

```vue
<template>
  <div ref="container"></div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { Rink } from "d3-hockey";

const container = ref(null);

onMounted(() => {
  new Rink(container.value).width(800).height(340).render();
});
</script>
```

### Angular

```typescript
import { Component, ElementRef, ViewChild, AfterViewInit } from "@angular/core";
import { Rink } from "d3-hockey";

@Component({
  selector: "app-hockey-rink",
  template: "<div #container></div>",
})
export class HockeyRinkComponent implements AfterViewInit {
  @ViewChild("container") container!: ElementRef;

  ngAfterViewInit() {
    new Rink(this.container.nativeElement).width(800).height(340).render();
  }
}
```

### Svelte

```svelte
<script>
  import { onMount } from 'svelte';
  import { Rink } from 'd3-hockey';

  let container;

  onMount(() => {
    new Rink(container)
      .width(800)
      .height(340)
      .render();
  });
</script>

<div bind:this={container}></div>
```
