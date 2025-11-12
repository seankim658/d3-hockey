/**
 * Event layer for rendering hockey events (shots, hits, faceoffs, etc.)
 */

import * as d3 from "d3";
import { BaseLayer, BaseLayerConfig } from "./base-layer";
import type {
  HockeyEvent,
  RenderDimensions,
  HockeyEventSymbolType,
  AnimationEasing,
} from "../../types";
import { SYMBOL_PATHS } from "../../constants";

/**
 * Configuration for event layer rendering
 */
export interface EventLayerConfig extends BaseLayerConfig {
  // Visual properties
  radius?: number | ((d: HockeyEvent) => number);
  color?: string | ((d: HockeyEvent) => string);
  stroke?: string | ((d: HockeyEvent) => string);
  strokeWidth?: number;

  // Tooltip configuration
  showTooltip?: boolean;
  tooltip?: (d: HockeyEvent) => string;

  // Animation control
  animate?: boolean;
  animationDuration?: number;
  animationEasing?: AnimationEasing;

  // Symbol configuration
  symbol?: HockeyEventSymbolType | ((d: HockeyEvent) => HockeyEventSymbolType);
  symbolSize?: number | ((d: HockeyEvent) => number);

  // Advanced customization
  customRender?: (
    selection: d3.Selection<SVGElement, HockeyEvent, SVGGElement, unknown>,
    dimensions: RenderDimensions,
  ) => void;
  customAttributes?: {
    [key: string]: string | number | ((d: HockeyEvent) => string | number);
  };

  // Legend configuration
  legendLabel?: string;
  legendColor?: string;
  legendSymbol?: HockeyEventSymbolType;
}

/**
 * Event layer class for rendering hockey events on the rink
 */
export class EventLayer extends BaseLayer<HockeyEvent, EventLayerConfig> {
  private static sharedTooltip: d3.Selection<
    HTMLDivElement,
    unknown,
    HTMLElement,
    unknown
  > | null = null;

  constructor(data: HockeyEvent[], config: EventLayerConfig) {
    super(data, config);
  }

  /**
   * Get default configuration for event layer
   */
  protected getDefaults(): Required<EventLayerConfig> {
    return {
      // Base layer defaults
      id: "event-layer",
      visible: true,
      opacity: 1,
      className: "event-layer",
      zIndex: 0,
      // Event layer defaults
      radius: 4,
      color: "#c8102e",
      stroke: "#000000",
      strokeWidth: 1,
      showTooltip: true,
      tooltip: this.defaultTooltip,
      animate: true,
      animationDuration: 300,
      animationEasing: "easeCubicInOut",
      symbol: "auto",
      symbolSize: 64,
      customRender: (() => {}) as (
        selection: d3.Selection<SVGElement, HockeyEvent, SVGGElement, unknown>,
        dimensions: RenderDimensions,
      ) => void,
      customAttributes: {},
      legendLabel: "",
      legendColor: "",
      legendSymbol: "circle",
    };
  }

  /**
   * Default tooltip formatter
   */
  private defaultTooltip(d: HockeyEvent): string {
    const parts: string[] = [];
    if (d.player) parts.push(`Player: ${d.player}`);
    if (d.team) parts.push(`Team: ${d.team}`);
    if (d.type) parts.push(`Type: ${d.type}`);
    if (d.period) parts.push(`Period: ${d.period}`);
    parts.push(
      `Location: (${d.coordinates.x.toFixed(1)}, ${d.coordinates.y.toFixed(1)})`,
    );
    return parts.join("<br/>");
  }

  /**
   * Initialize tooltip if needed
   */
  initialize(
    parent: d3.Selection<SVGGElement, unknown, null, undefined>,
    dimensions: RenderDimensions,
  ): void {
    super.initialize(parent, dimensions);

    if (this.config.showTooltip) {
      this.createTooltip();
    }
  }

  /**
   * Create tooltip element
   */
  private createTooltip(): void {
    if (!EventLayer.sharedTooltip || EventLayer.sharedTooltip.empty()) {
      EventLayer.sharedTooltip = d3
        .select<HTMLElement, unknown>("body")
        .append("div")
        .attr("class", "d3-hockey-tooltip")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("background-color", "rgba(0, 0, 0, 0.8)")
        .style("color", "#fff")
        .style("padding", "8px 12px")
        .style("border-radius", "4px")
        .style("font-size", "12px")
        .style("pointer-events", "none")
        .style("z-index", "1000")
        .style("box-shadow", "0 2px 4px rgba(0,0,0,0.2)");
    }
  }

  /**
   * Render all events on the rink
   */
  render(): void {
    if (!this.group) {
      throw new Error("Layer not initialized. Call initialize() first.");
    }

    // Filter out events with invalid coordinates
    const validEvents = this.data.filter(
      (d) =>
        d.coordinates &&
        typeof d.coordinates.x === "number" &&
        typeof d.coordinates.y === "number",
    );

    this.renderSymbols(validEvents);
  }

  /**
   * Generic symbol rendering
   */
  private renderSymbols(validEvents: HockeyEvent[]): void {
    if (!this.group) return;

    const symbols = this.group
      .selectAll<SVGPathElement, HockeyEvent>("path.event-symbol")
      .data(validEvents, (d: HockeyEvent, i: number) =>
        String(d.id ?? `event-${i}`),
      );

    const enter = symbols
      .enter()
      .append("path")
      .attr("class", "event-symbol")
      .attr("d", (d) => this.getSymbolPath(d))
      .attr("transform", (d) => {
        const pos = this.nhlToSVG(d.coordinates);
        return `translate(${pos.x},${pos.y}) scale(0)`; // Start scaled to 0 for animation
      })
      .attr("fill", this.getColor.bind(this))
      .attr("stroke", this.getStroke.bind(this))
      .attr("stroke-width", this.config.strokeWidth)
      .style("cursor", this.config.showTooltip ? "pointer" : "default");

    this.applyCustomAttributes(enter);
    this.addTooltipInteractions(enter);

    if (this.config.animate) {
      enter
        .transition()
        .duration(this.config.animationDuration)
        .ease(this.getEasing())
        .attr("transform", (d) => {
          const pos = this.nhlToSVG(d.coordinates);
          return `translate(${pos.x},${pos.y}) scale(1)`;
        });
    } else {
      enter.attr("transform", (d) => {
        const pos = this.nhlToSVG(d.coordinates);
        return `translate(${pos.x},${pos.y}) scale(1)`;
      });
    }

    this.addTooltipInteractions(symbols);

    if (this.config.animate) {
      symbols
        .transition()
        .duration(this.config.animationDuration)
        .ease(this.getEasing())
        .attr("d", (d) => this.getSymbolPath(d))
        .attr("transform", (d) => {
          const pos = this.nhlToSVG(d.coordinates);
          return `translate(${pos.x},${pos.y}) scale(1)`;
        })
        .attr("fill", this.getColor.bind(this))
        .attr("stroke", this.getStroke.bind(this));
    } else {
      symbols
        .attr("d", (d) => this.getSymbolPath(d))
        .attr("transform", (d) => {
          const pos = this.nhlToSVG(d.coordinates);
          return `translate(${pos.x},${pos.y}) scale(1)`;
        })
        .attr("fill", this.getColor.bind(this))
        .attr("stroke", this.getStroke.bind(this));
    }

    if (this.config.animate) {
      symbols
        .exit()
        .transition()
        .duration(this.config.animationDuration)
        .ease(this.getEasing())
        .attr("transform", function () {
          const datum = d3.select(this).datum() as HockeyEvent;
          const pos = (datum.coordinates.x + 100) * 1 + 0;
          const y = (42.5 - datum.coordinates.y) * 1 + 0;
          return `translate(${pos},${y}) scale(0)`;
        })
        .remove();
    } else {
      symbols.exit().remove();
    }
  }

  /**
   * Get the SVG path for a symbol
   */
  private getSymbolPath(d: HockeyEvent): string {
    const symbolType = this.getSymbol(d);
    const size = this.getSymbolSize(d);

    // Handle custom SVG paths from SYMBOL_PATHS
    if (symbolType in SYMBOL_PATHS) {
      return SYMBOL_PATHS[symbolType as keyof typeof SYMBOL_PATHS];
    }

    // Handle D3 built-in symbols
    const symbolGenerator = d3.symbol().size(size);

    switch (symbolType) {
      case "circle":
        symbolGenerator.type(d3.symbolCircle);
        break;
      case "cross":
        symbolGenerator.type(d3.symbolCross);
        break;
      case "diamond":
        symbolGenerator.type(d3.symbolDiamond);
        break;
      case "square":
        symbolGenerator.type(d3.symbolSquare);
        break;
      case "star":
        symbolGenerator.type(d3.symbolStar);
        break;
      case "triangle":
        symbolGenerator.type(d3.symbolTriangle);
        break;
      case "wye":
        symbolGenerator.type(d3.symbolWye);
        break;
      default:
        return symbolType;
    }

    return symbolGenerator() || "";
  }

  /**
   * Get symbol type for an event
   */
  private getSymbol(d: HockeyEvent): string {
    if (this.config.symbol !== this.getDefaults().symbol) {
      return typeof this.config.symbol === "function"
        ? this.config.symbol(d)
        : this.config.symbol;
    }

    return this.getDefaultSymbol(d);
  }

  /**
   * Get symbol size for an event
   */
  private getSymbolSize(d: HockeyEvent): number {
    if (this.config.radius !== this.getDefaults().radius) {
      const radius =
        typeof this.config.radius === "function"
          ? this.config.radius(d)
          : this.config.radius;
      return Math.PI * radius * radius;
    }
    return typeof this.config.symbolSize === "function"
      ? this.config.symbolSize(d)
      : this.config.symbolSize;
  }

  /**
   * Apply custom attributes to selection
   */
  private applyCustomAttributes<T extends SVGElement>(
    selection: d3.Selection<T, HockeyEvent, SVGGElement, unknown>,
  ): void {
    const { customAttributes } = this.config;

    if (!customAttributes || Object.keys(customAttributes).length === 0) {
      return;
    }

    Object.entries(customAttributes).forEach(([key, value]) => {
      if (typeof value === "function") {
        selection.attr(key, value);
      } else {
        selection.attr(key, value);
      }
    });
  }

  /**
   * Add tooltip interactions to selection
   */
  private addTooltipInteractions<T extends SVGElement>(
    selection: d3.Selection<T, HockeyEvent, SVGGElement, unknown>,
  ): void {
    if (this.config.showTooltip && EventLayer.sharedTooltip) {
      selection
        .on("mouseover", (event, d) => {
          this.showTooltip(event, d);
        })
        .on("mousemove", (event) => this.moveTooltip(event))
        .on("mouseout", () => this.hideTooltip());
    }
  }

  /**
   * Get D3 easing function from config
   */
  private getEasing(): (t: number) => number {
    const easingName = this.config.animationEasing;

    type EasingFunction = (normalizedTime: number) => number;
    type D3WithEasing = typeof d3 & Record<string, EasingFunction | unknown>;

    const easingFn = (d3 as D3WithEasing)[easingName];

    if (typeof easingFn === "function") {
      return easingFn as EasingFunction;
    }

    console.warn(`Invalid easing function: ${easingName}. Using easeLinear.`);
    return d3.easeLinear;
  }

  /**
   * Get color for an event (handles function or static value)
   */
  private getColor(d: HockeyEvent): string {
    return typeof this.config.color === "function"
      ? this.config.color(d)
      : this.config.color;
  }

  /**
   * Get stroke for an event (handles function or static value)
   */
  private getStroke(d: HockeyEvent): string {
    return typeof this.config.stroke === "function"
      ? this.config.stroke(d)
      : this.config.stroke;
  }

  /**
   * Show tooltip for an event
   */
  private showTooltip(event: MouseEvent, d: HockeyEvent): void {
    if (!EventLayer.sharedTooltip) return;

    const content = this.config.tooltip(d);
    EventLayer.sharedTooltip.html(content).style("visibility", "visible");
    this.moveTooltip(event);
  }

  /**
   * Move tooltip to mouse position
   */
  private moveTooltip(event: MouseEvent): void {
    if (!EventLayer.sharedTooltip) return;

    EventLayer.sharedTooltip
      .style("top", `${event.pageY - 10}px`)
      .style("left", `${event.pageX + 10}px`);
  }

  /**
   * Hide tooltip
   */
  private hideTooltip(): void {
    if (!EventLayer.sharedTooltip) return;
    EventLayer.sharedTooltip.style("visibility", "hidden");
  }

  /**
   * Cleanup tooltip on destroy
   */
  destroy(): void {
    super.destroy();
  }

  /**
   * Default symbol mapping for NHL event types
   */
  private static readonly EVENT_TYPE_SYMBOLS: Record<string, string> = {
    goal: "star",
    penalty: "triangle",

    // Shots
    shot: "circle",
    "shot-on-goal": "circle",
    "wrist-shot": "circle",
    "slap-shot": "circle",
    "snap-shot": "circle",
    backhand: "circle",
    "tip-in": "circle",
    deflected: "circle",

    // Blocked/Missed
    blocked: "cross",
    "blocked-shot": "cross",
    block: "cross",
    miss: "cross",
    "missed-shot": "cross",

    // Physical
    hit: "diamond",

    // Turnovers
    giveaway: "square",
    takeaway: "square",
  };

  /**
   * Get default symbol based on event type
   */
  private getDefaultSymbol(d: HockeyEvent): string {
    const eventType = (d.type || d.eventType || d.event || d.eventTypeId)
      ?.toString()
      .toLowerCase()
      .replace(/\s+/g, "-");

    if (eventType && EventLayer.EVENT_TYPE_SYMBOLS[eventType]) {
      return EventLayer.EVENT_TYPE_SYMBOLS[eventType];
    }

    return "circle";
  }
}
