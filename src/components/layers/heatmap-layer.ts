/* eslint-disable @typescript-eslint/no-explicit-any */

import * as d3 from "d3";
import { BaseLayer, BaseLayerConfig } from "./base-layer";
import { defaultXAccessor, defaultYAccessor } from "../../utils/accessor-utils";
import {
  showTooltip,
  moveTooltip,
  hideTooltip,
} from "../../utils/tooltip-utils";
import { getEasingFunction } from "../../utils/easing-utils";
import { svgToNHL, nhlToSVG } from "../../utils/coordinate-utils";
import type { Accessor, RenderDimensions, AnimationEasing } from "../../types";
import { HOCKEY_COLOR_SCALES } from "../../utils/color-utils";

/**
 * Grid data computed from KDE
 */
export interface HeatmapGridData {
  grid: number[][];
  width: number;
  height: number;
  cellWidth: number;
  cellHeight: number;
  minValue: number;
  maxValue: number;
}

/**
 * Context passed to customRender function
 */
export interface HeatmapRenderContext<TData> {
  gridData: HeatmapGridData;
  layer: HeatmapLayer<TData>;
}

/**
 * Configuration for Heatmap Layer
 */
export interface HeatmapLayerConfig<TData> extends BaseLayerConfig {
  // Data Accessors
  x?: Accessor<TData, number>;
  y?: Accessor<TData, number>;
  weight?: Accessor<TData, number>;

  // Grid Configuration
  gridResolution?: number; // Cells per foot (default: 2 = 0.5ft cells)
  bandwidth?: number; // KDE bandwidth in feet (default: 5)

  // Visual
  colorScale?: d3.ScaleSequential<string>;
  minOpacity?: number; // Opacity for lowest density (default: 0)
  maxOpacity?: number; // Opacity for highest density (default: 0.8)

  // Thresholds
  threshold?: number; // Min normalized value to render (0-1, default: 0.05)

  // Tooltip
  showTooltip?: boolean;
  tooltip?: (value: number, nhlX: number, nhlY: number) => string;

  // Animation
  animate?: boolean;
  animationDuration?: number;
  animationEasing?: AnimationEasing;

  // Interaction
  onClick?: (
    event: MouseEvent,
    value: number,
    nhlX: number,
    nhlY: number,
  ) => void;
  onHover?: (
    event: MouseEvent,
    value: number,
    nhlX: number,
    nhlY: number,
  ) => void;
  onMouseOut?: (event: MouseEvent) => void;

  // Advanced Customization
  customRender?: (
    context: CanvasRenderingContext2D,
    gridData: HeatmapGridData,
    dimensions: RenderDimensions,
  ) => void;
}

/**
 * Continuous density visualization using Kernel Density Estimation
 */
export class HeatmapLayer<TData = any> extends BaseLayer<
  TData,
  HeatmapLayerConfig<TData>
> {
  private canvas: HTMLCanvasElement | null = null;
  private foreignObject: d3.Selection<
    SVGForeignObjectElement,
    unknown,
    null,
    undefined
  > | null = null;
  private gridData: HeatmapGridData | null = null;

  // Computed canvas dimensions (available area without padding)
  private canvasWidth: number = 0;
  private canvasHeight: number = 0;

  protected getDefaults(): Required<HeatmapLayerConfig<TData>> {
    return {
      // BaseLayer defaults
      id: "heatmap-layer",
      visible: true,
      opacity: 0.7,
      zIndex: 5,
      className: "heatmap-layer",

      // Data accessors
      x: defaultXAccessor,
      y: defaultYAccessor,
      weight: () => 1,

      // Grid configuration
      gridResolution: 2,
      bandwidth: 5,

      // Visual
      colorScale: HOCKEY_COLOR_SCALES.heatmap,
      minOpacity: 0,
      maxOpacity: 0.8,

      // Threshold
      threshold: 0.05,

      // Tooltip
      showTooltip: true,
      tooltip: (value: number) => this.defaultTooltip(value),

      // Animation
      animate: true,
      animationDuration: 500,
      animationEasing: "easeCubicOut",

      // Interaction
      onClick: () => {},
      onHover: () => {},
      onMouseOut: () => {},

      // Custom
      customRender: () => {},
    };
  }

  /**
   * Default tooltip formatter
   */
  private defaultTooltip(value: number): string {
    return `<strong>Density:</strong> ${value.toFixed(3)}`;
  }

  /**
   * Initialize the layer
   */
  initialize(
    parent: d3.Selection<SVGGElement, unknown, null, undefined>,
    dimensions: RenderDimensions,
  ): void {
    super.initialize(parent, dimensions);
    this.computeCanvasDimensions();
  }

  /**
   * Compute canvas dimensions from RenderDimensions.
   * The canvas represents the drawable rink area WITHOUT padding.
   */
  private computeCanvasDimensions(): void {
    const { width, height, padding } = this.dimensions;
    this.canvasWidth = width - 2 * padding;
    this.canvasHeight = height - 2 * padding;
  }

  /**
   * Convert NHL coordinates to canvas coordinates.
   *
   * Uses BaseLayer's nhlToSVG() and subtracts padding since the canvas
   * is positioned inside the padded SVG area.
   */
  private nhlToCanvas(nhlX: number, nhlY: number): { x: number; y: number } {
    const { padding } = this.dimensions;
    const svgCoord = nhlToSVG(
      {
        x: nhlX,
        y: nhlY,
      },
      this.dimensions,
    );
    return {
      x: svgCoord.x - padding,
      y: svgCoord.y - padding,
    };
  }

  /**
   * Convert canvas coordinates to NHL coordinates.
   */
  private canvasToNHL(
    canvasX: number,
    canvasY: number,
  ): { x: number; y: number } {
    const { padding } = this.dimensions;
    // Canvas is inside the padded area, so add padding to get SVG coords
    const svgX = canvasX + padding;
    const svgY = canvasY + padding;
    return svgToNHL({ x: svgX, y: svgY }, this.dimensions);
  }

  /**
   * Main render method
   */
  render(): void {
    if (!this.group) {
      throw new Error("HeatmapLayer not initialized. Call initialize() first.");
    }

    this.computeCanvasDimensions();
    this.gridData = this.computeKDE();
    this.renderCanvas(this.gridData);
    this.setupInteractions();
  }

  /**
   * Compute Kernel Density Estimation grid
   */
  private computeKDE(): HeatmapGridData {
    const { gridResolution, bandwidth, weight } = this.config;
    const { scale } = this.dimensions;

    const width = this.canvasWidth;
    const height = this.canvasHeight;

    // Calculate grid dimensions
    const cellSize = scale / gridResolution;
    const gridWidth = Math.ceil(width / cellSize);
    const gridHeight = Math.ceil(height / cellSize);

    // Initialize grid with zeros
    const grid: number[][] = Array(gridHeight)
      .fill(null)
      .map(() => Array(gridWidth).fill(0));

    // Convert data points to canvas coordinates
    const points = this.data
      .map((d, i) => {
        try {
          const nhlX = this.config.x(d, i);
          const nhlY = this.config.y(d, i);
          const canvasPos = this.nhlToCanvas(nhlX, nhlY);
          const w = weight(d, i);
          return { x: canvasPos.x, y: canvasPos.y, weight: w };
        } catch {
          return null;
        }
      })
      .filter((p): p is { x: number; y: number; weight: number } => p !== null);

    if (points.length === 0) {
      return {
        grid,
        width: gridWidth,
        height: gridHeight,
        cellWidth: cellSize,
        cellHeight: cellSize,
        minValue: 0,
        maxValue: 0,
      };
    }

    // KDE parameters
    const bandwidthPx = bandwidth * scale;
    const sigma = bandwidthPx / 3;
    const sigmaSq2 = 2 * sigma * sigma;

    // Apply Gaussian kernel for each grid cell
    for (let gy = 0; gy < gridHeight; gy++) {
      for (let gx = 0; gx < gridWidth; gx++) {
        const cellX = gx * cellSize + cellSize / 2;
        const cellY = gy * cellSize + cellSize / 2;

        let density = 0;
        for (const point of points) {
          const dx = cellX - point.x;
          const dy = cellY - point.y;
          const distSq = dx * dx + dy * dy;
          const kernel = Math.exp(-distSq / sigmaSq2);
          density += kernel * point.weight;
        }
        grid[gy][gx] = density;
      }
    }

    // Find min/max for normalization
    let minValue = Infinity;
    let maxValue = -Infinity;
    for (let gy = 0; gy < gridHeight; gy++) {
      for (let gx = 0; gx < gridWidth; gx++) {
        const val = grid[gy][gx];
        if (val > 0 && val < minValue) minValue = val;
        if (val > maxValue) maxValue = val;
      }
    }

    if (minValue === Infinity) minValue = 0;
    if (maxValue === -Infinity) maxValue = 0;

    return {
      grid,
      width: gridWidth,
      height: gridHeight,
      cellWidth: cellSize,
      cellHeight: cellSize,
      minValue,
      maxValue,
    };
  }

  /**
   * Render the heatmap to a canvas element
   */
  private renderCanvas(gridData: HeatmapGridData): void {
    if (!this.group) return;

    const width = this.canvasWidth;
    const height = this.canvasHeight;

    const {
      colorScale,
      threshold,
      minOpacity,
      maxOpacity,
      animate,
      animationDuration,
      animationEasing,
    } = this.config;

    // Create canvas if it doesn't exist
    if (!this.canvas) {
      this.foreignObject = this.group
        .append("foreignObject")
        .attr("width", width)
        .attr("height", height)
        .attr("class", "heatmap-canvas-container");

      this.canvas = document.createElement("canvas");
      this.canvas.width = width;
      this.canvas.height = height;
      this.canvas.style.width = `${width}px`;
      this.canvas.style.height = `${height}px`;
      this.foreignObject.node()?.appendChild(this.canvas);
    } else {
      // Update canvas size if dimensions changed
      if (this.canvas.width !== width || this.canvas.height !== height) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.canvas.style.width = `${width}px`;
        this.canvas.style.height = `${height}px`;
        this.foreignObject?.attr("width", width).attr("height", height);
      }
    }

    const ctx = this.canvas.getContext("2d");
    if (!ctx) return;

    const { grid, cellWidth, cellHeight, maxValue } = gridData;
    const activeColorScale = colorScale.copy().domain([0, maxValue]);

    ctx.clearRect(0, 0, width, height);
    if (maxValue === 0) return;

    const drawFrame = (progress: number) => {
      ctx.clearRect(0, 0, width, height);

      for (let y = 0; y < grid.length; y++) {
        for (let x = 0; x < grid[y].length; x++) {
          const value = grid[y][x];
          const normalized = value / maxValue;

          if (normalized < threshold) continue;

          const color = d3.color(activeColorScale(value));
          if (!color) continue;

          const targetAlpha =
            minOpacity + (maxOpacity - minOpacity) * normalized;
          color.opacity = targetAlpha * progress;

          ctx.fillStyle = color.toString();
          ctx.fillRect(
            x * cellWidth,
            y * cellHeight,
            cellWidth + 0.5,
            cellHeight + 0.5,
          );
        }
      }
    };

    if (animate && animationDuration > 0) {
      const easing = getEasingFunction(animationEasing);
      const startTime = performance.now();

      const animateFrame = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const rawProgress = Math.min(elapsed / animationDuration, 1);
        const progress = easing(rawProgress);

        drawFrame(progress);

        if (rawProgress < 1) {
          requestAnimationFrame(animateFrame);
        }
      };

      requestAnimationFrame(animateFrame);
    } else {
      drawFrame(1);
    }
  }

  /**
   * Setup mouse interactions for tooltips
   */
  private setupInteractions(): void {
    if (!this.canvas || !this.gridData) return;

    const {
      showTooltip: enableTooltip,
      tooltip,
      onClick,
      onHover,
      onMouseOut,
      threshold,
    } = this.config;

    const getValueAtPosition = (
      event: MouseEvent,
    ): { value: number; nhlX: number; nhlY: number } | null => {
      if (!this.canvas || !this.gridData) return null;

      const rect = this.canvas.getBoundingClientRect();
      const displayX = event.clientX - rect.left;
      const displayY = event.clientY - rect.top;

      // Account for CSS scaling
      const scaleFactorX = this.canvas.width / rect.width;
      const scaleFactorY = this.canvas.height / rect.height;

      const canvasX = displayX * scaleFactorX;
      const canvasY = displayY * scaleFactorY;

      // Convert to grid coordinates
      const gridX = Math.floor(canvasX / this.gridData.cellWidth);
      const gridY = Math.floor(canvasY / this.gridData.cellHeight);

      // Bounds check
      if (
        gridX < 0 ||
        gridX >= this.gridData.width ||
        gridY < 0 ||
        gridY >= this.gridData.height
      ) {
        return null;
      }

      const value = this.gridData.grid[gridY][gridX];

      const nhlCoords = this.canvasToNHL(canvasX, canvasY);

      return { value, nhlX: nhlCoords.x, nhlY: nhlCoords.y };
    };

    this.canvas.addEventListener("mousemove", (event: MouseEvent) => {
      const result = getValueAtPosition(event);
      if (!result) {
        if (enableTooltip) hideTooltip();
        return;
      }

      const { value, nhlX, nhlY } = result;
      const normalizedValue = this.gridData
        ? value / this.gridData.maxValue
        : 0;

      if (enableTooltip && normalizedValue >= threshold) {
        const content = tooltip(value, nhlX, nhlY);
        showTooltip(event, content);
        moveTooltip(event);
      } else if (enableTooltip) {
        hideTooltip();
      }

      onHover(event, value, nhlX, nhlY);
    });

    this.canvas.addEventListener("mouseout", (event: MouseEvent) => {
      if (enableTooltip) hideTooltip();
      onMouseOut(event);
    });

    this.canvas.addEventListener("click", (event: MouseEvent) => {
      const result = getValueAtPosition(event);
      if (result) {
        onClick(event, result.value, result.nhlX, result.nhlY);
      }
    });

    this.canvas.style.cursor = enableTooltip ? "crosshair" : "default";
  }

  /**
   * Update with new data
   */
  update(data: TData[]): void {
    this.data = data;
    this.clear();
    this.render();
  }

  /**
   * Update dimensions (called when rink resizes)
   */
  updateDimensions(dimensions: RenderDimensions): void {
    super.updateDimensions(dimensions);
    this.computeCanvasDimensions();
  }

  /**
   * Clear the layer
   */
  clear(): void {
    if (this.canvas) {
      const ctx = this.canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      }
    }
    this.gridData = null;
  }

  /**
   * Destroy the layer and clean up
   */
  destroy(): void {
    if (this.canvas) {
      const oldCanvas = this.canvas;
      this.canvas = null;
      oldCanvas.remove();
    }
    if (this.foreignObject) {
      this.foreignObject.remove();
      this.foreignObject = null;
    }
    this.gridData = null;
    super.destroy();
  }

  /**
   * Get the computed grid data (useful for advanced use cases)
   */
  getGridData(): HeatmapGridData | null {
    return this.gridData;
  }

  /**
   * Check if customRender is defined
   */
  private hasCustomRender(): boolean {
    const defaultRender = this.getDefaults().customRender;
    return (
      this.config.customRender !== undefined &&
      this.config.customRender !== defaultRender
    );
  }
}
