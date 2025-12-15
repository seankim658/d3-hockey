import { defineConfig } from "vitepress";
import { resolve } from "path";

export default defineConfig({
  title: "d3-hockey",
  description:
    "A comprehensive D3.js library for hockey data visualization with customizable rink rendering, shot charts, heatmaps, and interactive overlays",
  base: "/",

  themeConfig: {
    nav: [
      { text: "Home", link: "/" },
      { text: "Guide", link: "/guide/getting-started" },
      { text: "Examples", link: "/examples/" },
      { text: "API", link: "/api/" },
      {
        text: "v0.1.0",
        items: [
          { text: "Changelog", link: "/changelog" },
          { text: "GitHub", link: "https://github.com/seankim658/d3-hockey" },
        ],
      },
    ],

    sidebar: {
      "/guide/": [
        {
          text: "Getting Started",
          items: [
            { text: "Introduction", link: "/guide/getting-started" },
            { text: "Installation", link: "/guide/installation" },
            { text: "Core Concepts", link: "/guide/core-concepts" },
          ],
        },
        {
          text: "Components",
          items: [
            { text: "Rink Configuration", link: "/guide/rink-configuration" },
            { text: "Working with Layers", link: "/guide/working-with-layers" },
          ],
        },
      ],
      "/examples/": [
        { text: "Overview", link: "/examples/" },
        {
          text: "Basic Examples",
          items: [
            { text: "Basic Rink", link: "/examples/basic-rink" },
            { text: "Shot Charts", link: "/examples/shot-charts" },
            { text: "Hexbin Charts", link: "/examples/hexbin-layer" },
          ],
        },
        {
          text: "Advanced Examples",
          items: [
            {
              text: "Custom Render",
              link: "/examples/advanced-customization/",
            },
            { text: "NHL API Data", link: "/examples/nhl-api-data/" },
          ],
        },
      ],
      "/api/": [
        {
          text: "API Reference",
          items: [
            { text: "Overview", link: "/api/" },
            { text: "Rink", link: "/api/rink" },
            { text: "EventLayer", link: "/api/event-layer" },
            { text: "BaseLayer", link: "/api/base-layer" },
            { text: "LayerManager", link: "/api/layer-manager" },
            { text: "Utilities", link: "/api/utilities" },
            { text: "Types", link: "/api/types" },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: "github", link: "https://github.com/seankim658/d3-hockey" },
      { icon: "npm", link: "https://www.npmjs.com/package/d3-hockey" },
    ],
  },

  vite: {
    resolve: {
      alias: {
        "d3-hockey": resolve(__dirname, "../../src/index.ts"),
      },
    },
    optimizeDeps: {
      include: ["d3"],
    },
    ssr: {
      noExternal: ["d3-hockey"],
    },
  },

  markdown: {
    theme: {
      light: "github-light",
      dark: "github-dark",
    },
  },
});
