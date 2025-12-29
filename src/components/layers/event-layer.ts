import * as d3 from "d3";
import { BaseLayer, BaseLayerConfig } from "./base-layer";
import type {
  Accessor,
  RenderDimensions,
  HockeyEventSymbolType,
  AnimationEasing,
} from "../../types";
import {
  defaultXAccessor,
  defaultYAccessor,
  defaultEventTypeAccessor,
} from "../../utils/accessor-utils";
import { nhlToSVG } from "../../utils/coordinate-utils";
import { getEasingFunction } from "../../utils/easing-utils";
import {
  showTooltip,
  moveTooltip,
  hideTooltip,
} from "../../utils/tooltip-utils";
import { SYMBOL_PATHS } from "../../constants";

/**
 * Context provided to customRender callback.
 */
export interface EventRenderContext<TData = unknown, TLayer = unknown> {
  position: {
    svgX: number;
    svgY: number;
    dataX: number;
    dataY: number;
  };
  data: TData;
  index: number;
  container: SVGGElement;
  layer: TLayer;
}

/**
 * Configuration for event layer rendering
 */
export interface EventLayerConfig<TData> extends BaseLayerConfig {
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

  // Interaction callbacks
  onClick?: (event: MouseEvent, data: TData, index: number) => void;
  onHover?: (event: MouseEvent, data: TData, index: number) => void;
  onMouseOut?: (event: MouseEvent, data: TData, index: number) => void;

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
    context: EventRenderContext<TData, EventLayer<TData>>,
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
export class EventLayer<TData> extends BaseLayer<
  TData,
  EventLayerConfig<TData>
> {
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
      x: defaultXAccessor,
      y: defaultYAccessor,
      eventType: defaultEventTypeAccessor,
      // Event layer defaults
      radius: 4,
      color: "#FF4C00",
      stroke: "#000000",
      strokeWidth: 1,
      showTooltip: true,
      tooltip: (d: TData) => this.defaultTooltip(d),
      onClick: () => {},
      onHover: () => {},
      onMouseOut: () => {},
      animate: true,
      animationDuration: 300,
      animationEasing: "easeCubicInOut",
      symbol: "auto",
      symbolSize: 64,
      customRender: (() => {}) as (
        selection: d3.Selection<SVGElement, TData, SVGGElement, unknown>,
        dimensions: RenderDimensions,
        context: EventRenderContext<TData, EventLayer<TData>>,
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
   * Generate a unique key for an event for D3 data binding.
   * Tries common ID fields, falls back to index-based key.
   */
  private getEventKey(d: TData, i: number): string {
    if (d === null || d === undefined) {
      return `event-${i}`;
    }

    if (typeof d === "object") {
      if ("id" in d) {
        const id = (d as Record<string, unknown>).id;
        if (typeof id === "string" || typeof id === "number") {
          return String(id);
        }
      }

      if ("eventId" in d) {
        const eventId = (d as Record<string, unknown>).eventId;
        if (typeof eventId === "string" || typeof eventId === "number") {
          return String(eventId);
        }
      }
    }

    return `event-${i}`;
  }

  /**
   * Initialize tooltip if needed
   */
  initialize(
    parent: d3.Selection<SVGGElement, unknown, null, undefined>,
    dimensions: RenderDimensions,
  ): void {
    super.initialize(parent, dimensions);
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
      .data(validEvents, (d: TData, i: number) => this.getEventKey(d, i));

    const positionMap = new Map<TData, EventRenderContext<TData>["position"]>();

    const enter = symbols
      .enter()
      .append("path")
      .attr("class", "event-symbol")
      .attr("d", (d) => this.getSymbolPath(d))
      .attr("transform", (d, i) => {
        const dataX = this.getX(d, i);
        const dataY = this.getY(d, i);
        const pos = nhlToSVG({ x: dataX, y: dataY }, this.dimensions);

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
    this.addInteractions(enter);

    if (this.hasCustomRender()) {
      enter.each((d, i, nodes) => {
        const node = nodes[i];
        const position = positionMap.get(d)!;
        const container = node.parentNode as SVGGElement;

        const context: EventRenderContext<TData, EventLayer<TData>> = {
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
        .ease(getEasingFunction(this.config.animationEasing))
        .attr("transform", (d, i) => {
          const x = this.getX(d, i);
          const y = this.getY(d, i);
          const pos = nhlToSVG({ x, y }, this.dimensions);
          return `translate(${pos.x},${pos.y}) scale(1)`;
        });
    } else {
      enter.attr("transform", (d, i) => {
        const x = this.getX(d, i);
        const y = this.getY(d, i);
        const pos = nhlToSVG({ x, y }, this.dimensions);
        return `translate(${pos.x},${pos.y}) scale(1)`;
      });
    }

    this.addInteractions(symbols);

    if (this.config.animate) {
      symbols
        .transition()
        .duration(this.config.animationDuration)
        .ease(getEasingFunction(this.config.animationEasing))
        .attr("d", (d, i) => this.getSymbolPath(d, i))
        .attr("transform", (d, i) => {
          const x = this.getX(d, i);
          const y = this.getY(d, i);
          const pos = nhlToSVG({ x, y }, this.dimensions);
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
          const pos = nhlToSVG({ x, y }, this.dimensions);
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
        .ease(getEasingFunction(this.config.animationEasing))
        .attr("transform", (d, i) => {
          const x = this.getX(d as TData, i);
          const y = this.getY(d as TData, i);
          const pos = nhlToSVG({ x, y }, this.dimensions);
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
  private addInteractions<T extends SVGElement>(
    selection: d3.Selection<T, TData, SVGGElement, unknown>,
  ): void {
    selection
      .on("mouseover", (event: MouseEvent, d: TData) => {
        const index = this.data.indexOf(d);

        if (this.config.showTooltip) {
          const content = this.config.tooltip(d, index);
          showTooltip(event, content);
        }
        this.config.onHover(event, d, index);
      })
      .on("mousemove", (event: MouseEvent) => {
        if (this.config.showTooltip) {
          moveTooltip(event);
        }
      })
      .on("mouseout", (event: MouseEvent, d: TData) => {
        const index = this.data.indexOf(d);

        if (this.config.showTooltip) {
          hideTooltip();
        }
        this.config.onMouseOut(event, d, index);
      })
      .on("click", (event: MouseEvent, d: TData) => {
        const index = this.data.indexOf(d);
        this.config.onClick(event, d, index);
      });
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
