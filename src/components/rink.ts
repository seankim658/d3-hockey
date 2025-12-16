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
import { calculateScale } from "../utils/coordinates";
import type {
  RinkConfig,
  RinkColors,
  RenderDimensions,
  HockeyEvent,
} from "../types";
import { LayerManager } from "./layers/layer-manager";
import { EventLayer, EventLayerConfig } from "./layers/event-layer";
import { HexbinLayer, HexbinLayerConfig } from "./layers/hexbin-layer";
import type { BaseLayer } from "./layers/base-layer";

/**
 * Rink class for rendering hockey rinks
 *
 * Usage:
 *   const rink = new Rink('#container')
 *     .width(1000)
 *     .height(500)
 *     .render();
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
    );
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
    const rinkWidth = LENGTH * scale;
    const rinkHeight = WIDTH * scale;
    const cornerRadius = CORNER_RADIUS * scale;

    defs
      .append("clipPath")
      .attr("id", "rink-clip")
      .append("rect")
      .attr("x", padding)
      .attr("y", padding)
      .attr("width", rinkWidth)
      .attr("height", rinkHeight)
      .attr("rx", cornerRadius)
      .attr("ry", cornerRadius);

    // Create main group for all rink elements
    svg.append("g").attr("class", "rink-group");

    this.layersGroup = svg
      .append("g")
      .attr("class", "layers-group")
      .attr("clip-path", "url(#rink-clip)");

    return svg;
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
    return (
      (nhlX + NHL_COORDS.MAX_X) * this.dimensions.scale +
      this.dimensions.padding
    );
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
   * Render the complete rink
   */
  render(): this {
    this.svg = this.createSVG();
    const group = this.getRinkGroup();

    this.drawIceSurface(group);
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
    this.drawBoards(group);

    if (this.layersGroup) {
      this.layerManager = new LayerManager(this.layersGroup, this.dimensions);
    }

    return this;
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
    const { LENGTH, WIDTH, CORNER_RADIUS } = RINK_DIMENSIONS;

    const rinkWidth = LENGTH * scale;
    const rinkHeight = WIDTH * scale;
    const cornerRadius = CORNER_RADIUS * scale;

    const x = padding;
    const y = padding;

    group
      .append("rect")
      .attr("class", "ice-surface")
      .attr("x", x)
      .attr("y", y)
      .attr("width", rinkWidth)
      .attr("height", rinkHeight)
      .attr("rx", cornerRadius)
      .attr("ry", cornerRadius)
      .attr("fill", this.config.colors.ice);
  }

  /**
   * Draw the rink boards (outline)
   * This is drawn last to cover line overflows
   */
  private drawBoards(
    group: d3.Selection<SVGGElement, unknown, null, undefined>,
  ): void {
    const { scale, padding } = this.dimensions;
    const { LENGTH, WIDTH, CORNER_RADIUS } = RINK_DIMENSIONS;

    const rinkWidth = LENGTH * scale;
    const rinkHeight = WIDTH * scale;
    const cornerRadius = CORNER_RADIUS * scale;

    const x = padding;
    const y = padding;

    group
      .append("rect")
      .attr("class", "rink-boards")
      .attr("x", x)
      .attr("y", y)
      .attr("width", rinkWidth)
      .attr("height", rinkHeight)
      .attr("rx", cornerRadius)
      .attr("ry", cornerRadius)
      .attr("fill", "none")
      .attr("stroke", this.config.colors.boards)
      .attr("stroke-width", 2);
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
    const lineWidth = this.feetToPixels(LINE_WIDTHS.BLUE_LINE);
    const offset = RINK_DIMENSIONS.BLUE_LINE_OFFSET;
    const y1 = this.getY(NHL_COORDS.MAX_Y);
    const y2 = this.getY(NHL_COORDS.MIN_Y);

    // Left blue line
    group
      .append("line")
      .attr("class", "blue-line-left")
      .attr("x1", this.getX(-offset))
      .attr("y1", y1)
      .attr("x2", this.getX(-offset))
      .attr("y2", y2)
      .attr("stroke", this.config.colors.blueLine)
      .attr("stroke-width", lineWidth);

    // Right blue line
    group
      .append("line")
      .attr("class", "blue-line-right")
      .attr("x1", this.getX(offset))
      .attr("y1", y1)
      .attr("x2", this.getX(offset))
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
    const lineWidth = this.feetToPixels(LINE_WIDTHS.GOAL_LINE);
    const offset = NHL_COORDS.MAX_X - RINK_DIMENSIONS.GOAL_LINE_OFFSET;

    const trimDistance = 5.6;
    const y1 = this.getY(NHL_COORDS.MAX_Y - trimDistance);
    const y2 = this.getY(NHL_COORDS.MIN_Y + trimDistance);

    // Left goal line
    group
      .append("line")
      .attr("class", "goal-line-left")
      .attr("x1", this.getX(-offset))
      .attr("y1", y1)
      .attr("x2", this.getX(-offset))
      .attr("y2", y2)
      .attr("stroke", this.config.colors.redLine)
      .attr("stroke-width", lineWidth);

    // Right goal line
    group
      .append("line")
      .attr("class", "goal-line-right")
      .attr("x1", this.getX(offset))
      .attr("y1", y1)
      .attr("x2", this.getX(offset))
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
   * Draw all faceoff circles
   */
  private drawFaceoffCircles(
    group: d3.Selection<SVGGElement, unknown, null, undefined>,
  ): void {
    const radius = this.feetToPixels(RINK_DIMENSIONS.FACEOFF_CIRCLE_RADIUS);
    const lineWidth = this.feetToPixels(LINE_WIDTHS.FACEOFF_CIRCLE);

    // Faceoff circle positions (X, Y in NHL coords)
    const positions: Array<[number, number, string]> = [
      // Offensive zone (right side)
      [69, 22, "offensive-right-top"],
      [69, -22, "offensive-right-bottom"],
      // Defensive zone (left side)
      [-69, 22, "defensive-left-top"],
      [-69, -22, "defensive-left-bottom"],
    ];

    positions.forEach(([x, y, className]) => {
      group
        .append("circle")
        .attr("class", `faceoff-circle ${className}`)
        .attr("cx", this.getX(x))
        .attr("cy", this.getY(y))
        .attr("r", radius)
        .attr("fill", "none")
        .attr("stroke", this.config.colors.faceoff)
        .attr("stroke-width", lineWidth);
    });
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

    // Same positions as faceoff circles
    const positions: Array<[number, number]> = [
      [69, 22],
      [69, -22],
      [-69, 22],
      [-69, -22],
    ];

    const hashStroke = this.config.colors.faceoff;

    positions.forEach(([nhlX, nhlY]) => {
      const cx = this.getX(nhlX);
      const cy = this.getY(nhlY);

      // Define the 4 'L' paths for each circle
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

      // Append all 4 hash marks
      paths.forEach((d) => {
        group
          .append("path")
          .attr("class", "faceoff-hash")
          .attr("d", d)
          .attr("fill", "none")
          .attr("stroke", hashStroke)
          .attr("stroke-width", lineWidth);
      });
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
    const {
      GOAL_LINE_OFFSET,
      GOAL_TRAPEZOID_GOAL_LINE_WIDTH,
      GOAL_TRAPEZOID_END_BOARD_WIDTH,
    } = RINK_DIMENSIONS;

    const lineWidth = this.feetToPixels(LINE_WIDTHS.GOAL_LINE); // 2 inches
    const goalLineX = NHL_COORDS.MAX_X - GOAL_LINE_OFFSET; // 89ft
    const endBoardX = NHL_COORDS.MAX_X; // 100ft
    const goalLineY = GOAL_TRAPEZOID_GOAL_LINE_WIDTH / 2; // 11ft
    const endBoardY = GOAL_TRAPEZOID_END_BOARD_WIDTH / 2; // 14ft

    // Right Trapezoid
    const r_p1 = { x: this.getX(goalLineX), y: this.getY(goalLineY) };
    const r_p2 = { x: this.getX(endBoardX), y: this.getY(endBoardY) };
    const r_p3 = { x: this.getX(endBoardX), y: this.getY(-endBoardY) };
    const r_p4 = { x: this.getX(goalLineX), y: this.getY(-goalLineY) };

    group
      .append("path")
      .attr("class", "trapezoid-right")
      .attr(
        "d",
        `M ${r_p1.x} ${r_p1.y} L ${r_p2.x} ${r_p2.y} M ${r_p3.x} ${r_p3.y} L ${r_p4.x} ${r_p4.y}`,
      )
      .attr("fill", "none")
      .attr("stroke", this.config.colors.redLine)
      .attr("stroke-width", lineWidth);

    // Left Trapezoid
    const l_p1 = { x: this.getX(-goalLineX), y: this.getY(goalLineY) };
    const l_p2 = { x: this.getX(-endBoardX), y: this.getY(endBoardY) };
    const l_p3 = { x: this.getX(-endBoardX), y: this.getY(-endBoardY) };
    const l_p4 = { x: this.getX(-goalLineX), y: this.getY(-goalLineY) };

    group
      .append("path")
      .attr("class", "trapezoid-left")
      .attr(
        "d",
        `M ${l_p1.x} ${l_p1.y} L ${l_p2.x} ${l_p2.y} M ${l_p3.x} ${l_p3.y} L ${l_p4.x} ${l_p4.y}`,
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
