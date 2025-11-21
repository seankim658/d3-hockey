/* eslint-disable  @typescript-eslint/no-explicit-any */

/**
 * Event layer for rendering hockey events (shots, hits, faceoffs, etc.)
 */

import * as d3 from "d3";
import { BaseLayer, BaseLayerConfig } from "./base-layer";
import type {
  Accessor,
  RenderDimensions,
  HockeyEventSymbolType,
  AnimationEasing,
  CustomRenderContext,
} from "../../types";
import { SYMBOL_PATHS } from "../../constants";

/**
 * Configuration for event layer rendering
 */
export interface EventLayerConfig<TData = any> extends BaseLayerConfig {
  // Data accessors
  x?: Accessor<TData, number>;
  y?: Accessor<TData, number>;
  eventType?: Accessor<TData, string | null>;

  // Visual properties
  radius?: number | Accessor<TData, number>;
  color?: string | Accessor<TData, string>;
  stroke?: string | Accessor<TData, string>;
  strokeWidth?: number;

  // Tooltip configuration
  showTooltip?: boolean;
  tooltip?: Accessor<TData, string>;

  // Animation control
  animate?: boolean;
  animationDuration?: number;
  animationEasing?: AnimationEasing;

  // Symbol configuration
  symbol?: HockeyEventSymbolType | Accessor<TData, HockeyEventSymbolType>;
  symbolSize?: number | Accessor<TData, number>;

  // Advanced customization
  customRender?: (
    selection: d3.Selection<SVGElement, TData, SVGGElement, unknown>,
    dimensions: RenderDimensions,
    context: CustomRenderContext<TData, EventLayer<TData>>,
  ) => void;
  customAttributes?: {
    [key: string]: string | number | Accessor<TData, string | number>;
  };

  // Legend configuration
  legendLabel?: string;
  legendColor?: string;
  legendSymbol?: HockeyEventSymbolType;
}

/**
 * Event layer class for rendering hockey events on the rink
 */
export class EventLayer<TData = any> extends BaseLayer<
  TData,
  EventLayerConfig<TData>
> {
  private static sharedTooltip: d3.Selection<
    HTMLDivElement,
    unknown,
    HTMLElement,
    unknown
  > | null = null;

  constructor(data: TData[], config: EventLayerConfig<TData>) {
    super(data, config);
  }

  /**
   * Get default configuration for event layer
   */
  protected getDefaults(): Required<EventLayerConfig<TData>> {
    return {
      // Base layer defaults
      id: "event-layer",
      visible: true,
      opacity: 1,
      className: "event-layer",
      zIndex: 0,
      x: EventLayer.defaultXAccessor,
      y: EventLayer.defaultYAccessor,
      eventType: EventLayer.defaultEventTypeAccessor,
      // Event layer defaults
      radius: 4,
      color: "#FF4C00",
      stroke: "#000000",
      strokeWidth: 1,
      showTooltip: true,
      tooltip: (d: TData) => this.defaultTooltip(d),
      animate: true,
      animationDuration: 300,
      animationEasing: "easeCubicInOut",
      symbol: "auto",
      symbolSize: 64,
      customRender: (() => {}) as (
        selection: d3.Selection<SVGElement, TData, SVGGElement, unknown>,
        dimensions: RenderDimensions,
        context: CustomRenderContext<TData, EventLayer<TData>>,
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
  private defaultTooltip = (d: TData): string => {
    const x = this.getX(d);
    const y = this.getY(d);
    const eventType = this.getEventType(d);

    const parts: string[] = [];
    if (eventType) parts.push(`Event: ${eventType}`);
    parts.push(`Location: (${x.toFixed(1)}, ${y.toFixed(1)})`);
    return parts.join("<br/>");
  };

  private static defaultXAccessor<T>(d: T): number {
    if (d && typeof d === "object") {
      const obj = d as any;
      if ("details" in obj && obj.details?.xCoord != null)
        return obj.details.xCoord;
      if ("x" in obj && obj.x != null) return obj.x;
      if ("coordinates" in obj && obj.coordinates?.x != null)
        return obj.coordinates.x;
    }
    throw new Error("Cannot extract x coordinate");
  }

  private static defaultYAccessor<T>(d: T): number {
    if (d && typeof d === "object") {
      const obj = d as any;
      if ("details" in obj && obj.details?.yCoord != null)
        return obj.details.yCoord;
      if ("y" in obj && obj.y != null) return obj.y;
      if ("coordinates" in obj && obj.coordinates?.y != null)
        return obj.coordinates.y;
    }
    throw new Error("Cannot extract y coordinate");
  }

  private static defaultEventTypeAccessor<T>(d: T): string | null {
    if (!d || typeof d !== "object") return null;
    const obj = d as any;
    if (obj.typeDescKey) return obj.typeDescKey;
    if (obj.type) return obj.type;
    if (obj.eventType) return obj.eventType;
    if (obj.event) return obj.event;
    return null;
  }

  private getX(d: TData, i: number = 0): number {
    return this.config.x!(d, i);
  }

  private getY(d: TData, i: number = 0): number {
    return this.config.y!(d, i);
  }

  private getEventType(d: TData, i: number = 0): string | null {
    return this.config.eventType!(d, i);
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
   * Check if customRender is defined and not the default empty function
   */
  private hasCustomRender(): boolean {
    const defaultRender = this.getDefaults().customRender;
    return (
      this.config.customRender !== undefined &&
      this.config.customRender !== defaultRender
    );
  }

  /**
   * Render all events on the rink
   */
  render(): void {
    if (!this.group) {
      throw new Error("Layer not initialized. Call initialize() first.");
    }

    const validEvents = this.data.filter((d, i) => {
      try {
        this.getX(d, i);
        this.getY(d, i);
        return true;
      } catch {
        return false;
      }
    });

    this.renderSymbols(validEvents);
  }

  /**
   * Generic symbol rendering
   */
  private renderSymbols(validEvents: TData[]): void {
    if (!this.group) return;

    const symbols = this.group
      .selectAll<SVGPathElement, TData>("path.event-symbol")
      .data(validEvents, (d: TData, i: number) => {
        const obj = d as any;
        return String(obj.id ?? obj.eventId ?? `event-${i}`);
      });

    const positionMap = new Map<
      TData,
      CustomRenderContext<TData>["position"]
    >();

    const enter = symbols
      .enter()
      .append("path")
      .attr("class", "event-symbol")
      .attr("d", (d) => this.getSymbolPath(d))
      .attr("transform", (d, i) => {
        const dataX = this.getX(d, i);
        const dataY = this.getY(d, i);
        const pos = this.nhlToSVG({ x: dataX, y: dataY });

        positionMap.set(d, {
          svgX: pos.x,
          svgY: pos.y,
          dataX,
          dataY,
        });

        return `translate(${pos.x},${pos.y}) scale(0)`;
      })
      .attr("fill", this.getColor.bind(this))
      .attr("stroke", this.getStroke.bind(this))
      .attr("stroke-width", this.config.strokeWidth)
      .style("cursor", this.config.showTooltip ? "pointer" : "default");

    this.applyCustomAttributes(enter);
    this.addTooltipInteractions(enter);

    if (this.hasCustomRender()) {
      enter.each((d, i, nodes) => {
        const node = nodes[i];
        const position = positionMap.get(d)!;
        const container = node.parentNode as SVGGElement;

        const context: CustomRenderContext<TData, EventLayer<TData>> = {
          position,
          data: d,
          index: i,
          container,
          layer: this,
        };

        this.config.customRender!(
          d3.select(node) as unknown as d3.Selection<
            SVGElement,
            TData,
            SVGGElement,
            unknown
          >,
          this.dimensions,
          context,
        );
      });
    }

    if (this.config.animate) {
      enter
        .transition()
        .duration(this.config.animationDuration)
        .ease(this.getEasing())
        .attr("transform", (d, i) => {
          const x = this.getX(d, i);
          const y = this.getY(d, i);
          const pos = this.nhlToSVG({ x, y });
          return `translate(${pos.x},${pos.y}) scale(1)`;
        });
    } else {
      enter.attr("transform", (d, i) => {
        const x = this.getX(d, i);
        const y = this.getY(d, i);
        const pos = this.nhlToSVG({ x, y });
        return `translate(${pos.x},${pos.y}) scale(1)`;
      });
    }

    this.addTooltipInteractions(symbols);

    if (this.config.animate) {
      symbols
        .transition()
        .duration(this.config.animationDuration)
        .ease(this.getEasing())
        .attr("d", (d, i) => this.getSymbolPath(d, i))
        .attr("transform", (d, i) => {
          const x = this.getX(d, i);
          const y = this.getY(d, i);
          const pos = this.nhlToSVG({ x, y });
          return `translate(${pos.x},${pos.y}) scale(1)`;
        })
        .attr("fill", this.getColor.bind(this))
        .attr("stroke", this.getStroke.bind(this));
    } else {
      symbols
        .attr("d", (d, i) => this.getSymbolPath(d, i))
        .attr("transform", (d, i) => {
          const x = this.getX(d, i);
          const y = this.getY(d, i);
          const pos = this.nhlToSVG({ x, y });
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
        .attr("transform", (d, i) => {
          const x = this.getX(d as TData, i);
          const y = this.getY(d as TData, i);
          const pos = this.nhlToSVG({ x, y });
          return `translate(${pos.x},${pos.y}) scale(0)`;
        })
        .remove();
    } else {
      symbols.exit().remove();
    }
  }

  /**
   * Get the SVG path for a symbol
   */
  private getSymbolPath(d: TData, i: number = 0): string {
    const symbolType = this.getSymbol(d, i);
    const size = this.getSymbolSize(d, i);

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
  private getSymbol(d: TData, i: number = 0): string {
    if (this.config.symbol !== this.getDefaults().symbol) {
      return typeof this.config.symbol === "function"
        ? this.config.symbol(d, i)
        : this.config.symbol;
    }

    return this.getDefaultSymbol(d, i);
  }

  /**
   * Get symbol size for an event
   */
  private getSymbolSize(d: TData, i: number = 0): number {
    if (this.config.radius !== this.getDefaults().radius) {
      const radius =
        typeof this.config.radius === "function"
          ? this.config.radius(d, i)
          : this.config.radius;
      return Math.PI * radius * radius;
    }
    return typeof this.config.symbolSize === "function"
      ? this.config.symbolSize(d, i)
      : this.config.symbolSize;
  }

  /**
   * Apply custom attributes to selection
   */
  private applyCustomAttributes<T extends SVGElement>(
    selection: d3.Selection<T, TData, SVGGElement, unknown>,
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
    selection: d3.Selection<T, TData, SVGGElement, unknown>,
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
  private getColor(d: TData, i: number = 0): string {
    return typeof this.config.color === "function"
      ? this.config.color(d, i)
      : this.config.color;
  }

  /**
   * Get stroke for an event (handles function or static value)
   */
  private getStroke(d: TData, i: number = 0): string {
    return typeof this.config.stroke === "function"
      ? this.config.stroke(d, i)
      : this.config.stroke;
  }

  /**
   * Show tooltip for an event
   */
  private showTooltip(event: MouseEvent, d: TData): void {
    if (!EventLayer.sharedTooltip) return;

    const content = this.config.tooltip(d, 0);
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
  private getDefaultSymbol(d: TData, i: number = 0): string {
    const eventType = this.getEventType(d, i);
    if (!eventType) return "circle";

    const normalized = eventType.toLowerCase().replace(/\s+/g, "-");

    if (EventLayer.EVENT_TYPE_SYMBOLS[normalized]) {
      return EventLayer.EVENT_TYPE_SYMBOLS[normalized];
    }

    return "circle";
  }
}
