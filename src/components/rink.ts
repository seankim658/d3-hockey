/* eslint-disable  @typescript-eslint/no-explicit-any */

/**
 * Rink renderer component
 * Draws NHL regulation hockey rink with all markings
 */

import * as d3 from "d3";
import {
  RINK_DIMENSIONS,
  NHL_COORDS,
  DEFAULT_SVG,
  RINK_COLORS,
  LINE_WIDTHS,
} from "../constants";
import { calculateScale } from "../utils/coordinate-utils";
import type { RinkConfig, RinkColors, RenderDimensions } from "../types";
import { LayerManager } from "./layers/layer-manager";
import { EventLayer, EventLayerConfig } from "./layers/event-layer";
import { HexbinLayer, HexbinLayerConfig } from "./layers/hexbin-layer";
import { HeatmapLayer, HeatmapLayerConfig } from "./layers/heatmap-layer";
import type { BaseLayer } from "./layers/base-layer";

/**
 * Rink class for rendering hockey rinks
 */
export class Rink {
  private container: d3.Selection<HTMLElement, unknown, null, undefined>;
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined> | null =
    null;
  private config: Required<Omit<RinkConfig, "colors">> & { colors: RinkColors };
  private dimensions: RenderDimensions;
  private layerManager: LayerManager | null = null;
  private layersGroup: d3.Selection<
    SVGGElement,
    unknown,
    null,
    undefined
  > | null = null;
  private static instanceCounter = 0;
  private clipPathId: string;

  /**
   * Create a new Rink renderer
   * @param selector - CSS selector or HTMLElement for container
   */
  constructor(selector: string | HTMLElement) {
    const element =
      typeof selector === "string"
        ? document.querySelector<HTMLElement>(selector)
        : selector;

    if (!element) {
      throw new Error(`Container not found: ${selector}`);
    }

    this.container = d3.select(element);

    // Initialize with default configuration
    this.config = {
      width: DEFAULT_SVG.WIDTH,
      height: DEFAULT_SVG.HEIGHT,
      padding: DEFAULT_SVG.PADDING,
      halfRink: false,
      halfRinkEnd: "offensive",
      vertical: false,
      colors: {
        ice: RINK_COLORS.ICE,
        boards: RINK_COLORS.BOARDS,
        redLine: RINK_COLORS.RED_LINE,
        blueLine: RINK_COLORS.BLUE_LINE,
        faceoff: RINK_COLORS.FACEOFF,
        centerSpot: RINK_COLORS.CENTER_SPOT,
        crease: RINK_COLORS.CREASE,
        line: RINK_COLORS.LINE,
      },
    };

    // Calculate initial dimensions
    this.dimensions = calculateScale(
      this.config.width,
      this.config.height,
      this.config.padding,
      this.config.halfRink,
      this.config.vertical,
    );

    Rink.instanceCounter++;
    this.clipPathId = `rink-clip-${Rink.instanceCounter}`;
  }

  /**
   * Set the width of the SVG canvas
   */
  width(value: number): this {
    this.config.width = value;
    this.updateDimensions();
    return this;
  }

  /**
   * Set the height of the SVG canvas
   */
  height(value: number): this {
    this.config.height = value;
    this.updateDimensions();
    return this;
  }

  /**
   * Set the padding around the rink
   */
  padding(value: number): this {
    this.config.padding = value;
    this.updateDimensions();
    return this;
  }

  /**
   * Enable/disable half rink mode
   */
  halfRink(value: boolean, end: "offensive" | "defensive" = "offensive"): this {
    this.config.halfRink = value;
    this.config.halfRinkEnd = end;
    this.updateDimensions();
    return this;
  }

  /**
   * Enable/disable vertical orientation
   */
  vertical(value: boolean): this {
    this.config.vertical = value;
    this.updateDimensions();
    return this;
  }

  /**
   * Set custom colors
   */
  colors(colors: Partial<RinkColors>): this {
    this.config.colors = { ...this.config.colors, ...colors };
    return this;
  }

  /**
   * Update dimensions when config changes
   */
  private updateDimensions(): void {
    this.dimensions = calculateScale(
      this.config.width,
      this.config.height,
      this.config.padding,
      this.config.halfRink,
      this.config.vertical,
    );

    if (this.layerManager) {
      this.layerManager.updateDimensions(this.dimensions);
    }
  }

  /**
   * Create or update the SVG element
   */
  private createSVG(): d3.Selection<SVGSVGElement, unknown, null, undefined> {
    this.container.select("svg").remove();

    const svg = this.container
      .append("svg")
      .attr("width", this.config.width)
      .attr("height", this.config.height)
      .attr("viewBox", `0 0 ${this.config.width} ${this.config.height}`)
      .attr("xmlns", "http://www.w3.org/2000/svg");

    const defs = svg.append("defs");

    const { scale, padding } = this.dimensions;
    const { LENGTH, WIDTH, CORNER_RADIUS } = RINK_DIMENSIONS;

    const rinkLengthFt = this.config.halfRink ? LENGTH / 2 : LENGTH;
    const rinkLengthPx = rinkLengthFt * scale;
    const rinkWidthPx = WIDTH * scale;
    const cornerRadius = CORNER_RADIUS * scale;

    const svgCenterX = this.config.width / 2;
    const svgCenterY = this.config.height / 2;
    const rinkCenterX = padding + rinkLengthPx / 2;
    const rinkCenterY = padding + rinkWidthPx / 2;

    const clipPath = defs.append("clipPath").attr("id", this.clipPathId);

    if (this.config.vertical) {
      const clipX = padding;
      const clipY = padding;

      if (this.config.halfRink) {
        this.createVerticalHalfRinkClipPath(
          clipPath,
          rinkWidthPx,
          rinkLengthPx,
          cornerRadius,
          clipX,
          clipY,
        );
      } else {
        clipPath
          .append("rect")
          .attr("x", clipX)
          .attr("y", clipY)
          .attr("width", rinkWidthPx)
          .attr("height", rinkLengthPx)
          .attr("rx", cornerRadius)
          .attr("ry", cornerRadius);
      }

      const mainGroup = svg.append("g").attr("class", "rink-main-group");
      mainGroup.attr(
        "transform",
        `translate(${svgCenterX}, ${svgCenterY}) rotate(-90) translate(${-rinkCenterX}, ${-rinkCenterY})`,
      );
      mainGroup.append("g").attr("class", "rink-group");
      this.layersGroup = mainGroup
        .append("g")
        .attr("class", "layers-group")
        .attr("clip-path", `url(#${this.clipPathId})`);
    } else {
      const clipX = padding;
      const clipY = padding;

      if (this.config.halfRink) {
        this.createHalfRinkClipPath(
          clipPath,
          rinkLengthPx,
          rinkWidthPx,
          cornerRadius,
          clipX,
          clipY,
        );
      } else {
        clipPath
          .append("rect")
          .attr("x", clipX)
          .attr("y", clipY)
          .attr("width", rinkLengthPx)
          .attr("height", rinkWidthPx)
          .attr("rx", cornerRadius)
          .attr("ry", cornerRadius);
      }

      const mainGroup = svg.append("g").attr("class", "rink-main-group");
      const dx = svgCenterX - rinkCenterX;
      const dy = svgCenterY - rinkCenterY;
      if (dx !== 0 || dy !== 0) {
        mainGroup.attr("transform", `translate(${dx}, ${dy})`);
      }
      mainGroup.append("g").attr("class", "rink-group");
      this.layersGroup = mainGroup
        .append("g")
        .attr("class", "layers-group")
        .attr("clip-path", `url(#${this.clipPathId})`);
    }

    return svg;
  }

  /**
   * Create clip path for vertical half rink (rounded top or bottom)
   */
  private createVerticalHalfRinkClipPath(
    clipPath: d3.Selection<SVGClipPathElement, unknown, null, undefined>,
    width: number,
    height: number,
    cornerRadius: number,
    x: number,
    y: number,
  ): void {
    const isOffensive = this.config.halfRinkEnd === "offensive";

    if (isOffensive) {
      // Rounded top, flat bottom
      const path = `
      M ${x + cornerRadius} ${y}
      L ${x + width - cornerRadius} ${y}
      Q ${x + width} ${y} ${x + width} ${y + cornerRadius}
      L ${x + width} ${y + height}
      L ${x} ${y + height}
      L ${x} ${y + cornerRadius}
      Q ${x} ${y} ${x + cornerRadius} ${y}
      Z
    `;
      clipPath.append("path").attr("d", path);
    } else {
      // Flat top, rounded bottom
      const path = `
      M ${x} ${y}
      L ${x + width} ${y}
      L ${x + width} ${y + height - cornerRadius}
      Q ${x + width} ${y + height} ${x + width - cornerRadius} ${y + height}
      L ${x + cornerRadius} ${y + height}
      Q ${x} ${y + height} ${x} ${y + height - cornerRadius}
      L ${x} ${y}
      Z
    `;
      clipPath.append("path").attr("d", path);
    }
  }

  /**
   * Create clip path for half rink (one end rounded, one end flat)
   */
  private createHalfRinkClipPath(
    clipPath: d3.Selection<SVGClipPathElement, unknown, null, undefined>,
    rinkWidth: number,
    rinkHeight: number,
    cornerRadius: number,
    x: number,
    y: number,
  ): void {
    if (this.config.halfRinkEnd === "offensive") {
      // Offensive end: flat left edge (center ice), rounded right corners
      const path = `
        M ${x} ${y}
        L ${x + rinkWidth - cornerRadius} ${y}
        Q ${x + rinkWidth} ${y} ${x + rinkWidth} ${y + cornerRadius}
        L ${x + rinkWidth} ${y + rinkHeight - cornerRadius}
        Q ${x + rinkWidth} ${y + rinkHeight} ${x + rinkWidth - cornerRadius} ${y + rinkHeight}
        L ${x} ${y + rinkHeight}
        Z
      `;
      clipPath.append("path").attr("d", path);
    } else {
      // Defensive end: rounded left corners, flat right edge (center ice)
      const path = `
        M ${x + cornerRadius} ${y}
        L ${x + rinkWidth} ${y}
        L ${x + rinkWidth} ${y + rinkHeight}
        L ${x + cornerRadius} ${y + rinkHeight}
        Q ${x} ${y + rinkHeight} ${x} ${y + rinkHeight - cornerRadius}
        L ${x} ${y + cornerRadius}
        Q ${x} ${y} ${x + cornerRadius} ${y}
        Z
      `;
      clipPath.append("path").attr("d", path);
    }
  }

  /**
   * Get the main rink group
   */
  private getRinkGroup(): d3.Selection<SVGGElement, unknown, null, undefined> {
    if (!this.svg) {
      throw new Error("SVG not initialized. Call render() first.");
    }
    return this.svg.select<SVGGElement>(".rink-group");
  }

  /**
   * Convert feet to pixels using current scale
   */
  private feetToPixels(feet: number): number {
    return feet * this.dimensions.scale;
  }

  /**
   * Get X coordinate in SVG space (from center-origin NHL coords)
   */
  private getX(nhlX: number): number {
    const { scale, padding } = this.dimensions;
    if (this.config.halfRink && this.config.halfRinkEnd === "offensive") {
      return nhlX * scale + padding;
    }

    return (nhlX + NHL_COORDS.MAX_X) * scale + padding;
  }

  /**
   * Get Y coordinate in SVG space (from center-origin NHL coords)
   */
  private getY(nhlY: number): number {
    return (
      (NHL_COORDS.MAX_Y - nhlY) * this.dimensions.scale +
      this.dimensions.padding
    );
  }

  /**
   * Get the rink dimensions in pixels based on current config
   */
  private getRinkPixelDimensions(): { width: number; height: number } {
    const { scale } = this.dimensions;
    const length = this.config.halfRink
      ? RINK_DIMENSIONS.LENGTH / 2
      : RINK_DIMENSIONS.LENGTH;

    return {
      width: length * scale,
      height: RINK_DIMENSIONS.WIDTH * scale,
    };
  }

  /**
   * Render the complete rink
   */
  render(): this {
    this.svg = this.createSVG();
    const group = this.getRinkGroup();

    this.drawIceSurface(group);

    if (this.config.halfRink) {
      this.drawHalfRinkElements(group);
    } else {
      this.drawFullRinkElements(group);
    }

    this.drawBoards(group);

    if (this.layersGroup) {
      this.layerManager = new LayerManager(this.layersGroup, this.dimensions);
    }

    return this;
  }

  /**
   * Draw all elements for a full rink
   */
  private drawFullRinkElements(
    group: d3.Selection<SVGGElement, unknown, null, undefined>,
  ): void {
    this.drawCenterLine(group);
    this.drawBlueLines(group);
    this.drawGoalLines(group);
    this.drawTrapezoids(group);
    this.drawCenterCircle(group);
    this.drawFaceoffCircles(group);
    this.drawFaceoffHashes(group);
    this.drawFaceoffDots(group);
    this.drawGoalCreases(group);
    this.drawGoals(group);
  }

  /**
   * Draw all elements for a half rink
   */
  private drawHalfRinkElements(
    group: d3.Selection<SVGGElement, unknown, null, undefined>,
  ): void {
    const isOffensive = this.config.halfRinkEnd === "offensive";
    const sign = isOffensive ? 1 : -1;

    const blueLineX = sign * RINK_DIMENSIONS.BLUE_LINE_OFFSET;
    this.drawBlueLine(group, blueLineX);

    const goalLineX =
      sign * (NHL_COORDS.MAX_X - RINK_DIMENSIONS.GOAL_LINE_OFFSET);
    this.drawGoalLine(group, goalLineX);
    this.drawTrapezoid(group, isOffensive ? "right" : "left");

    this.drawHalfCenterCircle(group);

    const faceoffX = sign * 69;
    this.drawFaceoffCircle(group, faceoffX, 22);
    this.drawFaceoffCircle(group, faceoffX, -22);

    this.drawFaceoffHashSet(group, faceoffX, 22);
    this.drawFaceoffHashSet(group, faceoffX, -22);

    this.drawFaceoffDot(group, faceoffX, 22, "zone-top");
    this.drawFaceoffDot(group, faceoffX, -22, "zone-bottom");
    this.drawFaceoffDot(group, sign * 20, 22, "neutral-top");
    this.drawFaceoffDot(group, sign * 20, -22, "neutral-bottom");

    const creaseX = goalLineX;
    this.drawGoalCrease(group, creaseX, 0, isOffensive ? "right" : "left");
    this.drawGoal(
      group,
      creaseX,
      0,
      isOffensive ? "right" : "left",
      this.feetToPixels(RINK_DIMENSIONS.GOAL_WIDTH),
      this.feetToPixels(RINK_DIMENSIONS.GOAL_DEPTH),
    );
  }

  /**
   * Add a custom layer to the rink
   */
  addLayer(layer: BaseLayer): this {
    if (!this.layerManager) {
      throw new Error("Rink not rendered. Call render() first.");
    }
    this.layerManager.addLayer(layer);
    layer.render();
    return this;
  }

  /**
   * Add an event layer
   */
  addEvents<TData = any>(
    data: TData[],
    config?: Partial<EventLayerConfig<TData>>,
  ): this {
    const layerConfig: EventLayerConfig<TData> = {
      id: config?.id || "event",
      ...config,
    };

    const eventLayer = new EventLayer(data, layerConfig);
    return this.addLayer(eventLayer);
  }

  /**
   * Add a hexbin layer
   */
  addHexbin<TData = any>(
    data: TData[],
    config?: Partial<HexbinLayerConfig<TData>>,
  ): this {
    const layerConfig: HexbinLayerConfig<TData> = {
      id: config?.id || "hexbin-layer",
      ...config,
    };

    const layer = new HexbinLayer(data, layerConfig);
    return this.addLayer(layer);
  }

  /**
   * Add a heatmap layer
   */
  addHeatmap<TData = any>(
    data: TData[],
    config?: Partial<HeatmapLayerConfig<TData>>,
  ): this {
    const layerConfig: HeatmapLayerConfig<TData> = {
      id: config?.id || "heatmap",
      ...config,
    };

    const layer = new HeatmapLayer(data, layerConfig);
    return this.addLayer(layer);
  }

  /**
   * Remove a layer by ID
   */
  removeLayer(id: string): this {
    if (this.layerManager) {
      this.layerManager.removeLayer(id);
    }
    return this;
  }

  /**
   * Show a layer by ID
   */
  showLayer(id: string): this {
    if (this.layerManager) {
      this.layerManager.showLayer(id);
    }
    return this;
  }

  /**
   * Hide a layer by ID
   */
  hideLayer(id: string): this {
    if (this.layerManager) {
      this.layerManager.hideLayer(id);
    }
    return this;
  }

  /**
   * Update a layer's data
   */
  updateLayer<TData = unknown>(id: string, data: TData[]): this {
    if (this.layerManager) {
      const layer = this.layerManager.getLayer(id);
      if (layer) {
        layer.update(data);
      }
    }
    return this;
  }

  /**
   * Get layer manager (for advanced usage)
   */
  getLayerManager(): LayerManager | null {
    return this.layerManager;
  }

  /**
   * Draw the ice surface (the white base)
   */
  private drawIceSurface(
    group: d3.Selection<SVGGElement, unknown, null, undefined>,
  ): void {
    const { scale, padding } = this.dimensions;
    const { width: rinkWidth, height: rinkHeight } =
      this.getRinkPixelDimensions();
    const cornerRadius = RINK_DIMENSIONS.CORNER_RADIUS * scale;

    if (this.config.halfRink) {
      this.drawHalfRinkShape(
        group,
        "ice-surface",
        rinkWidth,
        rinkHeight,
        cornerRadius,
        padding,
        {
          fill: this.config.colors.ice,
        },
      );
    } else {
      group
        .append("rect")
        .attr("class", "ice-surface")
        .attr("x", padding)
        .attr("y", padding)
        .attr("width", rinkWidth)
        .attr("height", rinkHeight)
        .attr("rx", cornerRadius)
        .attr("ry", cornerRadius)
        .attr("fill", this.config.colors.ice);
    }
  }

  /**
   * Draw the rink boards (outline)
   */
  private drawBoards(
    group: d3.Selection<SVGGElement, unknown, null, undefined>,
  ): void {
    const { scale, padding } = this.dimensions;
    const { width: rinkWidth, height: rinkHeight } =
      this.getRinkPixelDimensions();
    const cornerRadius = RINK_DIMENSIONS.CORNER_RADIUS * scale;

    if (this.config.halfRink) {
      this.drawHalfRinkShape(
        group,
        "rink-boards",
        rinkWidth,
        rinkHeight,
        cornerRadius,
        padding,
        {
          fill: "none",
          stroke: this.config.colors.boards,
          strokeWidth: 2,
        },
      );
    } else {
      group
        .append("rect")
        .attr("class", "rink-boards")
        .attr("x", padding)
        .attr("y", padding)
        .attr("width", rinkWidth)
        .attr("height", rinkHeight)
        .attr("rx", cornerRadius)
        .attr("ry", cornerRadius)
        .attr("fill", "none")
        .attr("stroke", this.config.colors.boards)
        .attr("stroke-width", 2);
    }
  }

  /**
   * Helper to draw half rink shape (used for ice and boards)
   */
  private drawHalfRinkShape(
    group: d3.Selection<SVGGElement, unknown, null, undefined>,
    className: string,
    width: number,
    height: number,
    cornerRadius: number,
    padding: number,
    style: { fill?: string; stroke?: string; strokeWidth?: number },
  ): void {
    const x = padding;
    const y = padding;
    let path: string;

    // For boards (stroke only), use open path without center ice edge
    const isBoards = style.fill === "none" && style.stroke;

    if (this.config.halfRinkEnd === "offensive") {
      if (isBoards) {
        // Open path - no left edge (center ice)
        path = `
        M ${x} ${y}
        L ${x + width - cornerRadius} ${y}
        A ${cornerRadius} ${cornerRadius} 0 0 1 ${x + width} ${y + cornerRadius}
        L ${x + width} ${y + height - cornerRadius}
        A ${cornerRadius} ${cornerRadius} 0 0 1 ${x + width - cornerRadius} ${y + height}
        L ${x} ${y + height}
      `;
      } else {
        // Closed path for ice surface
        path = `
        M ${x} ${y}
        L ${x + width - cornerRadius} ${y}
        A ${cornerRadius} ${cornerRadius} 0 0 1 ${x + width} ${y + cornerRadius}
        L ${x + width} ${y + height - cornerRadius}
        A ${cornerRadius} ${cornerRadius} 0 0 1 ${x + width - cornerRadius} ${y + height}
        L ${x} ${y + height}
        Z
      `;
      }
    } else {
      if (isBoards) {
        // Open path - no right edge (center ice)
        path = `
        M ${x + width} ${y}
        L ${x + cornerRadius} ${y}
        A ${cornerRadius} ${cornerRadius} 0 0 0 ${x} ${y + cornerRadius}
        L ${x} ${y + height - cornerRadius}
        A ${cornerRadius} ${cornerRadius} 0 0 0 ${x + cornerRadius} ${y + height}
        L ${x + width} ${y + height}
      `;
      } else {
        // Closed path for ice surface
        path = `
        M ${x + cornerRadius} ${y}
        L ${x + width} ${y}
        L ${x + width} ${y + height}
        L ${x + cornerRadius} ${y + height}
        A ${cornerRadius} ${cornerRadius} 0 0 1 ${x} ${y + height - cornerRadius}
        L ${x} ${y + cornerRadius}
        A ${cornerRadius} ${cornerRadius} 0 0 1 ${x + cornerRadius} ${y}
        Z
      `;
      }
    }

    const element = group
      .append("path")
      .attr("class", className)
      .attr("d", path);

    if (style.fill) element.attr("fill", style.fill);
    if (style.stroke) element.attr("stroke", style.stroke);
    if (style.strokeWidth) element.attr("stroke-width", style.strokeWidth);
  }

  /**
   * Draw the center red line
   */
  private drawCenterLine(
    group: d3.Selection<SVGGElement, unknown, null, undefined>,
  ): void {
    const lineWidth = this.feetToPixels(LINE_WIDTHS.RED_LINE);
    const x = this.getX(0);
    const y1 = this.getY(NHL_COORDS.MAX_Y);
    const y2 = this.getY(NHL_COORDS.MIN_Y);

    group
      .append("line")
      .attr("class", "center-line")
      .attr("x1", x)
      .attr("y1", y1)
      .attr("x2", x)
      .attr("y2", y2)
      .attr("stroke", this.config.colors.redLine)
      .attr("stroke-width", lineWidth);
  }

  /**
   * Draw the blue lines
   */
  private drawBlueLines(
    group: d3.Selection<SVGGElement, unknown, null, undefined>,
  ): void {
    const offset = RINK_DIMENSIONS.BLUE_LINE_OFFSET;
    this.drawBlueLine(group, -offset);
    this.drawBlueLine(group, offset);
  }

  /**
   * Draw a single blue line
   */
  private drawBlueLine(
    group: d3.Selection<SVGGElement, unknown, null, undefined>,
    nhlX: number,
  ): void {
    const lineWidth = this.feetToPixels(LINE_WIDTHS.BLUE_LINE);
    const y1 = this.getY(NHL_COORDS.MAX_Y);
    const y2 = this.getY(NHL_COORDS.MIN_Y);

    group
      .append("line")
      .attr("class", "blue-line")
      .attr("x1", this.getX(nhlX))
      .attr("y1", y1)
      .attr("x2", this.getX(nhlX))
      .attr("y2", y2)
      .attr("stroke", this.config.colors.blueLine)
      .attr("stroke-width", lineWidth);
  }

  /**
   * Draw the goal lines
   */
  private drawGoalLines(
    group: d3.Selection<SVGGElement, unknown, null, undefined>,
  ): void {
    const offset = NHL_COORDS.MAX_X - RINK_DIMENSIONS.GOAL_LINE_OFFSET;
    this.drawGoalLine(group, -offset);
    this.drawGoalLine(group, offset);
  }

  /**
   * Draw a single goal line
   */
  private drawGoalLine(
    group: d3.Selection<SVGGElement, unknown, null, undefined>,
    nhlX: number,
  ): void {
    const lineWidth = this.feetToPixels(LINE_WIDTHS.GOAL_LINE);

    // Calculate trim based on where goal line intersects rounded corner
    const cornerRadius = RINK_DIMENSIONS.CORNER_RADIUS; // 28 feet
    const cornerCenterX = NHL_COORDS.MAX_X - cornerRadius; // 72 feet from center
    const distFromCornerCenter = Math.abs(nhlX) - cornerCenterX;

    let trimDistance = 0;
    if (distFromCornerCenter > 0) {
      // Goal line is in the corner curve region
      const arcOffsetY = Math.sqrt(
        cornerRadius * cornerRadius -
          distFromCornerCenter * distFromCornerCenter,
      );
      trimDistance = cornerRadius - arcOffsetY;
    }

    const y1 = this.getY(NHL_COORDS.MAX_Y - trimDistance);
    const y2 = this.getY(NHL_COORDS.MIN_Y + trimDistance);

    group
      .append("line")
      .attr("class", "goal-line")
      .attr("x1", this.getX(nhlX))
      .attr("y1", y1)
      .attr("x2", this.getX(nhlX))
      .attr("y2", y2)
      .attr("stroke", this.config.colors.redLine)
      .attr("stroke-width", lineWidth);
  }

  /**
   * Draw the center circle
   */
  private drawCenterCircle(
    group: d3.Selection<SVGGElement, unknown, null, undefined>,
  ): void {
    const radius = this.feetToPixels(RINK_DIMENSIONS.CENTER_CIRCLE_RADIUS);
    const lineWidth = this.feetToPixels(LINE_WIDTHS.FACEOFF_CIRCLE);

    group
      .append("circle")
      .attr("class", "center-circle")
      .attr("cx", this.getX(0))
      .attr("cy", this.getY(0))
      .attr("r", radius)
      .attr("fill", "none")
      .attr("stroke", this.config.colors.blueLine)
      .attr("stroke-width", lineWidth);

    // Center faceoff dot
    this.drawFaceoffDot(
      group,
      0,
      0,
      "center-dot",
      this.config.colors.centerSpot || this.config.colors.blueLine,
    );
  }

  /**
   * Draw half center circle (semicircle at edge for half rink)
   */
  private drawHalfCenterCircle(
    group: d3.Selection<SVGGElement, unknown, null, undefined>,
  ): void {
    const radius = this.feetToPixels(RINK_DIMENSIONS.CENTER_CIRCLE_RADIUS);
    const lineWidth = this.feetToPixels(LINE_WIDTHS.FACEOFF_CIRCLE);

    const cx = this.getX(0);
    const cy = this.getY(0);

    // For offensive half: draw right semicircle (from -90° to 90°)
    // For defensive half: draw left semicircle (from 90° to 270°)
    const isOffensive = this.config.halfRinkEnd === "offensive";
    const startAngle = isOffensive ? -Math.PI / 2 : Math.PI / 2;
    const endAngle = isOffensive ? Math.PI / 2 : (3 * Math.PI) / 2;

    const startX = cx + radius * Math.cos(startAngle);
    const startY = cy + radius * Math.sin(startAngle);
    const endX = cx + radius * Math.cos(endAngle);
    const endY = cy + radius * Math.sin(endAngle);

    const sweepFlag = isOffensive ? 1 : 1;

    group
      .append("path")
      .attr("class", "center-circle-half")
      .attr(
        "d",
        `M ${startX} ${startY} A ${radius} ${radius} 0 0 ${sweepFlag} ${endX} ${endY}`,
      )
      .attr("fill", "none")
      .attr("stroke", this.config.colors.blueLine)
      .attr("stroke-width", lineWidth);
  }

  /**
   * Draw all faceoff circles
   */
  private drawFaceoffCircles(
    group: d3.Selection<SVGGElement, unknown, null, undefined>,
  ): void {
    const positions: Array<[number, number]> = [
      [69, 22],
      [69, -22],
      [-69, 22],
      [-69, -22],
    ];

    positions.forEach(([x, y]) => {
      this.drawFaceoffCircle(group, x, y);
    });
  }

  /**
   * Draw a single faceoff circle
   */
  private drawFaceoffCircle(
    group: d3.Selection<SVGGElement, unknown, null, undefined>,
    nhlX: number,
    nhlY: number,
  ): void {
    const radius = this.feetToPixels(RINK_DIMENSIONS.FACEOFF_CIRCLE_RADIUS);
    const lineWidth = this.feetToPixels(LINE_WIDTHS.FACEOFF_CIRCLE);

    group
      .append("circle")
      .attr("class", "faceoff-circle")
      .attr("cx", this.getX(nhlX))
      .attr("cy", this.getY(nhlY))
      .attr("r", radius)
      .attr("fill", "none")
      .attr("stroke", this.config.colors.faceoff)
      .attr("stroke-width", lineWidth);
  }

  /**
   * Draw all faceoff dots
   */
  private drawFaceoffDots(
    group: d3.Selection<SVGGElement, unknown, null, undefined>,
  ): void {
    // Faceoff dot positions matching the circles
    const positions: Array<[number, number, string]> = [
      // Offensive zone
      [69, 22, "offensive-right-top-dot"],
      [69, -22, "offensive-right-bottom-dot"],
      // Defensive zone
      [-69, 22, "defensive-left-top-dot"],
      [-69, -22, "defensive-left-bottom-dot"],
      // Neutral zone
      [20, 22, "neutral-right-top-dot"],
      [20, -22, "neutral-right-bottom-dot"],
      [-20, 22, "neutral-left-top-dot"],
      [-20, -22, "neutral-left-bottom-dot"],
    ];

    positions.forEach(([x, y, className]) => {
      this.drawFaceoffDot(group, x, y, className);
    });
  }

  /**
   * Draw a single faceoff dot
   */
  private drawFaceoffDot(
    group: d3.Selection<SVGGElement, unknown, null, undefined>,
    x: number,
    y: number,
    className: string,
    color?: string,
  ): void {
    const radius = this.feetToPixels(RINK_DIMENSIONS.FACEOFF_DOT_RADIUS / 12);

    group
      .append("circle")
      .attr("class", `faceoff-dot ${className}`)
      .attr("cx", this.getX(x))
      .attr("cy", this.getY(y))
      .attr("r", radius)
      .attr("fill", color || this.config.colors.faceoff);
  }

  /**
   * Draw faceoff circle hash marks ('L' shapes)
   */
  private drawFaceoffHashes(
    group: d3.Selection<SVGGElement, unknown, null, undefined>,
  ): void {
    const positions: Array<[number, number]> = [
      [69, 22],
      [69, -22],
      [-69, 22],
      [-69, -22],
    ];

    positions.forEach(([nhlX, nhlY]) => {
      this.drawFaceoffHashSet(group, nhlX, nhlY);
    });
  }

  /**
   * Draw hash marks for a single faceoff circle
   */
  private drawFaceoffHashSet(
    group: d3.Selection<SVGGElement, unknown, null, undefined>,
    nhlX: number,
    nhlY: number,
  ): void {
    const {
      FACEOFF_HASH_MAIN_LEG,
      FACEOFF_HASH_CROSS_LEG,
      FACEOFF_HASH_Y_OFFSET,
      FACEOFF_HASH_X_OFFSET,
    } = RINK_DIMENSIONS;

    const lineWidth = this.feetToPixels(LINE_WIDTHS.FACEOFF_CIRCLE);
    const mainLeg_px = this.feetToPixels(FACEOFF_HASH_MAIN_LEG);
    const crossLeg_px = this.feetToPixels(FACEOFF_HASH_CROSS_LEG);
    const xOff_px = this.feetToPixels(FACEOFF_HASH_X_OFFSET);
    const yOff_px = this.feetToPixels(FACEOFF_HASH_Y_OFFSET);

    const cx = this.getX(nhlX);
    const cy = this.getY(nhlY);

    // Four 'L' shapes around the faceoff dot
    const paths = [
      // Top-left 'L'
      `M ${cx - xOff_px} ${cy - yOff_px} L ${cx - xOff_px} ${cy - yOff_px - mainLeg_px} M ${cx - xOff_px} ${cy - yOff_px} L ${cx - xOff_px - crossLeg_px} ${cy - yOff_px}`,
      // Top-right 'L'
      `M ${cx + xOff_px} ${cy - yOff_px} L ${cx + xOff_px} ${cy - yOff_px - mainLeg_px} M ${cx + xOff_px} ${cy - yOff_px} L ${cx + xOff_px + crossLeg_px} ${cy - yOff_px}`,
      // Bottom-left 'L'
      `M ${cx - xOff_px} ${cy + yOff_px} L ${cx - xOff_px} ${cy + yOff_px + mainLeg_px} M ${cx - xOff_px} ${cy + yOff_px} L ${cx - xOff_px - crossLeg_px} ${cy + yOff_px}`,
      // Bottom-right 'L'
      `M ${cx + xOff_px} ${cy + yOff_px} L ${cx + xOff_px} ${cy + yOff_px + mainLeg_px} M ${cx + xOff_px} ${cy + yOff_px} L ${cx + xOff_px + crossLeg_px} ${cy + yOff_px}`,
    ];

    paths.forEach((d) => {
      group
        .append("path")
        .attr("class", "faceoff-hash")
        .attr("d", d)
        .attr("fill", "none")
        .attr("stroke", this.config.colors.faceoff)
        .attr("stroke-width", lineWidth);
    });
  }

  /**
   * Draw goal creases
   */
  private drawGoalCreases(
    group: d3.Selection<SVGGElement, unknown, null, undefined>,
  ): void {
    const goalLineOffset = NHL_COORDS.MAX_X - RINK_DIMENSIONS.GOAL_LINE_OFFSET;

    // Left crease (defensive zone)
    this.drawGoalCrease(group, -goalLineOffset, 0, "left");

    // Right crease (offensive zone)
    this.drawGoalCrease(group, goalLineOffset, 0, "right");
  }

  /**
   * Draw a single goal crease (semi-circular)
   */
  private drawGoalCrease(
    group: d3.Selection<SVGGElement, unknown, null, undefined>,
    x: number,
    y: number,
    side: "left" | "right",
  ): void {
    const cx = this.getX(x);
    const cy = this.getY(y);

    const creaseRadius_px = this.feetToPixels(RINK_DIMENSIONS.CREASE_RADIUS); // 6ft
    const baseHalfWidth_px = this.feetToPixels(4); // 8ft total width = 4ft on each side
    const legLength_px = this.feetToPixels(4); // 4ft straight legs

    let d: string;

    if (side === "left") {
      // Path for the LEFT crease (points right)
      const legX = cx + legLength_px;
      const topY = cy - baseHalfWidth_px;
      const bottomY = cy + baseHalfWidth_px;

      d =
        `M ${cx}, ${topY}` + // 1. Start at top-front (on goal line)
        ` L ${legX}, ${topY}` + // 2. Line to top-back
        // 3. Arc down to bottom-back (A rx,ry x-axis-rotation large-arc-flag sweep-flag x,y)
        ` A ${creaseRadius_px}, ${creaseRadius_px} 0 0 1 ${legX}, ${bottomY}` +
        ` L ${cx}, ${bottomY}` + // 4. Line to bottom-front
        ` Z`; // 5. Close path (back to start)
    } else {
      // Path for the RIGHT crease (points left)
      const legX = cx - legLength_px;
      const topY = cy - baseHalfWidth_px;
      const bottomY = cy + baseHalfWidth_px;

      d =
        `M ${cx}, ${topY}` + // 1. Start at top-front (on goal line)
        ` L ${legX}, ${topY}` + // 2. Line to top-back
        // 3. Arc down to bottom-back
        ` A ${creaseRadius_px}, ${creaseRadius_px} 0 0 0 ${legX}, ${bottomY}` +
        ` L ${cx}, ${bottomY}` + // 4. Line to bottom-front
        ` Z`; // 5. Close path
    }

    // Add the new path to the SVG
    group
      .append("path")
      .attr("class", `goal-crease ${side}`)
      .attr("d", d)
      // No transform is needed since 'd' uses absolute coordinates
      .attr("fill", this.config.colors.crease)
      .attr("stroke", this.config.colors.faceoff)
      .attr("stroke-width", this.feetToPixels(LINE_WIDTHS.GOAL_LINE));
  }

  /**
   * Draw goals (the actual goal structures)
   */
  private drawGoals(
    group: d3.Selection<SVGGElement, unknown, null, undefined>,
  ): void {
    const goalLineOffset = NHL_COORDS.MAX_X - RINK_DIMENSIONS.GOAL_LINE_OFFSET;
    const goalWidth = this.feetToPixels(RINK_DIMENSIONS.GOAL_WIDTH);
    const goalDepth = this.feetToPixels(RINK_DIMENSIONS.GOAL_DEPTH);

    this.drawGoal(group, -goalLineOffset, 0, "left", goalWidth, goalDepth);
    this.drawGoal(group, goalLineOffset, 0, "right", goalWidth, goalDepth);
  }

  /**
   * Draw a single goal structure
   */
  private drawGoal(
    group: d3.Selection<SVGGElement, unknown, null, undefined>,
    x: number,
    y: number,
    side: "left" | "right",
    width: number,
    depth: number,
  ): void {
    const goalX = this.getX(x);
    const goalY = this.getY(y);
    const halfWidth = width / 2;

    // Goal extends behind the goal line (toward the boards)
    const depthDirection = side === "left" ? -depth : depth;

    // Goal posts (two vertical lines)
    const topPostY = goalY - halfWidth;
    const bottomPostY = goalY + halfWidth;

    // Left post
    group
      .append("line")
      .attr("class", `goal-post ${side} top`)
      .attr("x1", goalX)
      .attr("y1", topPostY)
      .attr("x2", goalX + depthDirection)
      .attr("y2", topPostY)
      .attr("stroke", this.config.colors.faceoff)
      .attr("stroke-width", 2);

    // Right post
    group
      .append("line")
      .attr("class", `goal-post ${side} bottom`)
      .attr("x1", goalX)
      .attr("y1", bottomPostY)
      .attr("x2", goalX + depthDirection)
      .attr("y2", bottomPostY)
      .attr("stroke", this.config.colors.faceoff)
      .attr("stroke-width", 2);

    // Back bar
    group
      .append("line")
      .attr("class", `goal-bar ${side}`)
      .attr("x1", goalX + depthDirection)
      .attr("y1", topPostY)
      .attr("x2", goalX + depthDirection)
      .attr("y2", bottomPostY)
      .attr("stroke", this.config.colors.faceoff)
      .attr("stroke-width", 2);

    // Goal posts (circles at goal line)
    group
      .append("circle")
      .attr("class", `goal-post-circle ${side} top`)
      .attr("cx", goalX)
      .attr("cy", topPostY)
      .attr("r", 1.5)
      .attr("fill", this.config.colors.faceoff);

    group
      .append("circle")
      .attr("class", `goal-post-circle ${side} bottom`)
      .attr("cx", goalX)
      .attr("cy", bottomPostY)
      .attr("r", 1.5)
      .attr("fill", this.config.colors.faceoff);
  }

  /**
   * Draw the goalie restricted area trapezoids
   */
  private drawTrapezoids(
    group: d3.Selection<SVGGElement, unknown, null, undefined>,
  ): void {
    this.drawTrapezoid(group, "left");
    this.drawTrapezoid(group, "right");
  }

  /**
   * Draw a single trapezoid
   */
  private drawTrapezoid(
    group: d3.Selection<SVGGElement, unknown, null, undefined>,
    side: "left" | "right",
  ): void {
    const {
      GOAL_LINE_OFFSET,
      GOAL_TRAPEZOID_GOAL_LINE_WIDTH,
      GOAL_TRAPEZOID_END_BOARD_WIDTH,
    } = RINK_DIMENSIONS;

    const lineWidth = this.feetToPixels(LINE_WIDTHS.GOAL_LINE);
    const goalLineX = NHL_COORDS.MAX_X - GOAL_LINE_OFFSET;
    const endBoardX = NHL_COORDS.MAX_X;
    const goalLineY = GOAL_TRAPEZOID_GOAL_LINE_WIDTH / 2;
    const endBoardY = GOAL_TRAPEZOID_END_BOARD_WIDTH / 2;

    const sign = side === "right" ? 1 : -1;

    const p1 = { x: this.getX(sign * goalLineX), y: this.getY(goalLineY) };
    const p2 = { x: this.getX(sign * endBoardX), y: this.getY(endBoardY) };
    const p3 = { x: this.getX(sign * endBoardX), y: this.getY(-endBoardY) };
    const p4 = { x: this.getX(sign * goalLineX), y: this.getY(-goalLineY) };

    group
      .append("path")
      .attr("class", `trapezoid-${side}`)
      .attr(
        "d",
        `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y} M ${p3.x} ${p3.y} L ${p4.x} ${p4.y}`,
      )
      .attr("fill", "none")
      .attr("stroke", this.config.colors.redLine)
      .attr("stroke-width", lineWidth);
  }

  /**
   * Get the SVG element (useful for adding custom layers)
   */
  getSVG(): d3.Selection<SVGSVGElement, unknown, null, undefined> | null {
    return this.svg;
  }

  /**
   * Get the current configuration
   */
  getConfig(): Required<Omit<RinkConfig, "colors">> & { colors: RinkColors } {
    return { ...this.config };
  }

  /**
   * Get the current dimensions
   */
  getDimensions(): RenderDimensions {
    return { ...this.dimensions };
  }
}
