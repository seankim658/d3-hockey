/* eslint-disable  @typescript-eslint/no-explicit-any */

import * as d3 from "d3";
import { hexbin, type HexbinBin } from "d3-hexbin";
import { BaseLayer, BaseLayerConfig } from "./base-layer";
import { defaultXAccessor, defaultYAccessor } from "../../utils/accessor-utils";
import {
  showTooltip,
  moveTooltip,
  hideTooltip,
} from "../../utils/tooltip-utils";
import { getEasingFunction } from "../../utils/easing-utils";
import { Accessor, RenderDimensions, AnimationEasing } from "../../types";
import { nhlToSVG } from "../../utils/coordinate-utils";
import { HOCKEY_COLOR_SCALES } from "../../utils/color-utils";

/**
 * Aggregation function type for custom aggregations
 */
export type AggregationFunction<TData> = (
  values: number[],
  dataPoints: TData[],
) => number;

/**
 * Built-in aggregation types
 */
export type BuiltInAggregation =
  | "count"
  | "mean"
  | "sum"
  | "min"
  | "max"
  | "median";

/**
 * Context passed to customRender function
 */
export interface HexbinRenderContext<TData> {
  bin: HexbinBin<[number, number, TData]>;
  value: number;
  index: number;
  position: {
    svgX: number;
    svgY: number;
  };
  container: SVGGElement;
  layer: HexbinLayer<TData>;
}

/**
 * Configuration for Hexbin Layer
 */
export interface HexbinLayerConfig<TData> extends BaseLayerConfig {
  // Data Accessors
  x?: Accessor<TData, number>;
  y?: Accessor<TData, number>;

  // Hexagon Properties
  radius?: number; // Radius of the bin grid in feet
  radiusScale?: [number, number]; // Min/Max radius for the drawn hexagons (for sizing by count)

  // Aggregation Logic
  value?: Accessor<TData, number>;
  aggregation?: BuiltInAggregation | AggregationFunction<TData>;

  // Visuals
  colorScale?: d3.ScaleSequential<string> | d3.ScaleLinear<string, string>;
  stroke?:
    | string
    | ((bin: HexbinBin<[number, number, TData]>, i: number) => string);
  strokeWidth?: number;

  // Tooltip
  showTooltip?: boolean;
  tooltip?: (bin: HexbinBin<[number, number, TData]>, value: number) => string;

  // Animation
  animate?: boolean;
  animationDuration?: number;
  animationEasing?: AnimationEasing;

  // Interaction
  onClick?: (
    event: MouseEvent,
    bin: HexbinBin<[number, number, TData]>,
    value: number,
  ) => void;
  onHover?: (
    event: MouseEvent,
    bin: HexbinBin<[number, number, TData]>,
    value: number,
  ) => void;
  onMouseOut?: (
    event: MouseEvent,
    bin: HexbinBin<[number, number, TData]>,
    value: number,
  ) => void;

  // Advanced Customization
  customRender?: (
    selection: d3.Selection<
      SVGPathElement,
      HexbinBin<[number, number, TData]>,
      SVGGElement,
      unknown
    >,
    dimensions: RenderDimensions,
    context: HexbinRenderContext<TData>,
  ) => void;

  customAttributes?: {
    [key: string]:
      | string
      | number
      | ((
          bin: HexbinBin<[number, number, TData]>,
          value: number,
          index: number,
        ) => string | number);
  };
}

/**
 * Hexagonal Binning Layer
 */
export class HexbinLayer<TData = any> extends BaseLayer<
  TData,
  HexbinLayerConfig<TData>
> {
  /**
   * Get aggregation function from config (handles built-in or custom)
   */
  private getAggregationFn(): AggregationFunction<TData> {
    const { aggregation } = this.config;

    if (typeof aggregation === "function") {
      return aggregation;
    }

    switch (aggregation) {
      case "mean":
        return (values) => d3.mean(values) || 0;
      case "sum":
        return (values) => d3.sum(values) || 0;
      case "min":
        return (values) => d3.min(values) || 0;
      case "max":
        return (values) => d3.max(values) || 0;
      case "median":
        return (values) => d3.median(values) || 0;
      case "count":
      default:
        return (values, dataPoints) => dataPoints.length;
    }
  }

  protected getDefaults(): Required<HexbinLayerConfig<TData>> {
    return {
      // BaseLayer defaults
      id: "hexbin-layer",
      visible: true,
      opacity: 0.8,
      zIndex: 10,
      className: "hexbin-layer",

      // Standardized Data Defaults
      x: defaultXAccessor,
      y: defaultYAccessor,

      // Hexbin specific defaults
      radius: 4, // 4 feet radius for grid
      radiusScale: [0, 0], // If [0,0], drawn radius equals grid radius. If set (e.g. [2, 5]), scales based on value.
      value: () => 1, // Default value is 1 (for counting)
      aggregation: "count",

      // Visual defaults
      colorScale: HOCKEY_COLOR_SCALES.heatmap,
      stroke: "none",
      strokeWidth: 0.5,

      // Tooltip
      showTooltip: true,
      tooltip: (bin, value) => this.defaultTooltip(bin, value),

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
      customAttributes: {},
    };
  }

  initialize(
    parent: d3.Selection<SVGGElement, unknown, null, undefined>,
    dimensions: RenderDimensions,
  ): void {
    super.initialize(parent, dimensions);
  }

  render(): void {
    if (!this.group) {
      throw new Error("HexbinLayer not initialized. Call initialize() first.");
    }

    const { scale, width, height, padding } = this.dimensions;
    const {
      radius,
      radiusScale: rScaleRange,
      colorScale,
      stroke,
      strokeWidth,
      opacity,
      animate,
      animationDuration,
      animationEasing,
    } = this.config;

    // 1. Prepare Data: Map to SVG coordinates
    const points = this.data
      .map((d, i) => {
        try {
          const nhlX = this.config.x(d, i);
          const nhlY = this.config.y(d, i);

          const svgPos = nhlToSVG({ x: nhlX, y: nhlY }, this.dimensions);
          return [svgPos.x, svgPos.y, d] as [number, number, TData];
        } catch {
          return null;
        }
      })
      .filter((p): p is [number, number, TData] => p !== null);

    // 2. Setup Hexbin Generator
    const hexRadiusPx = radius * scale;

    const hexbinGenerator = hexbin<[number, number, TData]>()
      .x((d) => d[0])
      .y((d) => d[1])
      .radius(hexRadiusPx)
      .extent([
        [padding, padding],
        [width - padding, height - padding],
      ]);

    const bins = hexbinGenerator(points);

    // 3. Calculate Aggregate Values per Bin
    const binValues = new Map<HexbinBin<[number, number, TData]>, number>();
    const aggregationFn = this.getAggregationFn();

    bins.forEach((bin) => {
      const dataPoints = bin.map((p) => p[2]);
      const values = dataPoints.map((d, i) => this.config.value(d, i));
      const val = aggregationFn(values, dataPoints);
      binValues.set(bin, val);
    });

    // 4. Update Color Scale & Radius Scale
    const allValues = Array.from(binValues.values());
    const domain = d3.extent(allValues) as [number, number];

    // Safety check for empty data
    if (domain[0] === undefined) domain[0] = 0;
    if (domain[1] === undefined) domain[1] = 0;

    const activeColorScale = colorScale.copy().domain(domain);

    // If radius scaling is enabled (range is not [0,0]), setup that scale
    let activeRadiusScale: d3.ScaleLinear<number, number> | null = null;
    if (rScaleRange && (rScaleRange[0] > 0 || rScaleRange[1] > 0)) {
      activeRadiusScale = d3
        .scaleSqrt()
        .domain(domain)
        .range([rScaleRange[0] * scale, rScaleRange[1] * scale])
        .clamp(true);
    }

    // 5. Render Hexagons using D3 Join
    const easing = getEasingFunction(animationEasing);

    // Helper to generate path
    const getPath = (d: HexbinBin<[number, number, TData]>) => {
      if (activeRadiusScale) {
        const val = binValues.get(d) || 0;
        return hexbinGenerator.hexagon(activeRadiusScale(val));
      }
      return hexbinGenerator.hexagon();
    };

    const paths = this.group
      .selectAll<SVGPathElement, HexbinBin<TData>>("path")
      .data(bins, (d) => `${d.x},${d.y}`);

    const enter = paths
      .enter()
      .append("path")
      .attr("class", "hexbin-cell")
      .attr("transform", (d: any) => `translate(${d.x},${d.y}) scale(0)`)
      .attr("fill", (d) => activeColorScale(binValues.get(d)!))
      .attr("stroke", (d, i) =>
        typeof stroke === "function" ? stroke(d, i) : stroke,
      )
      .attr("stroke-width", strokeWidth)
      .style("cursor", this.config.showTooltip ? "pointer" : "default")
      .attr("d", (d) => getPath(d));

    // Add interactions
    this.addInteractions(enter, binValues);
    this.addInteractions(paths, binValues);

    if (this.hasCustomRender()) {
      enter.each((d, i, nodes) => {
        const node = nodes[i];
        const context: HexbinRenderContext<TData> = {
          bin: d,
          value: binValues.get(d) || 0,
          index: i,
          position: {
            svgX: d.x,
            svgY: d.y,
          },
          container: node.parentNode as SVGGElement,
          layer: this,
        };

        this.config.customRender!(
          d3.select(node) as unknown as d3.Selection<
            SVGPathElement,
            HexbinBin<[number, number, TData]>,
            SVGGElement,
            unknown
          >,
          this.dimensions,
          context,
        );
      });
    }

    if (animate) {
      enter
        .transition()
        .duration(animationDuration)
        .ease(easing)
        .attr("transform", (d) => `translate(${d.x},${d.y}) scale(1)`)
        .attr("opacity", opacity);

      paths
        .transition()
        .duration(animationDuration)
        .ease(easing)
        .attr("d", (d) => getPath(d))
        .attr("transform", (d) => `translate(${d.x},${d.y}) scale(1)`)
        .attr("fill", (d) => activeColorScale(binValues.get(d)!))
        .attr("opacity", opacity);

      paths
        .exit()
        .transition()
        .duration(animationDuration)
        .ease(easing)
        .attr("transform", (d: any) => `translate(${d.x},${d.y}) scale(0)`)
        .remove();
    } else {
      enter
        .attr("transform", (d) => `translate(${d.x},${d.y}) scale(1)`)
        .attr("opacity", opacity);

      paths
        .attr("d", (d) => getPath(d))
        .attr("transform", (d) => `translate(${d.x},${d.y}) scale(1)`)
        .attr("fill", (d) => activeColorScale(binValues.get(d)!))
        .attr("opacity", opacity);

      paths.exit().remove();
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
   * Apply custom attributes to selection
   */
  private applyCustomAttributes(
    selection: d3.Selection<
      SVGPathElement,
      HexbinBin<[number, number, TData]>,
      SVGGElement,
      unknown
    >,
    valueMap: Map<HexbinBin<[number, number, TData]>, number>,
  ): void {
    const { customAttributes } = this.config;

    if (!customAttributes || Object.keys(customAttributes).length === 0) {
      return;
    }

    Object.entries(customAttributes).forEach(([key, value]) => {
      if (typeof value === "function") {
        selection.attr(key, (d, i) => value(d, valueMap.get(d) || 0, i));
      } else {
        selection.attr(key, value);
      }
    });
  }

  private addInteractions(
    selection: d3.Selection<
      SVGPathElement,
      HexbinBin<[number, number, TData]>,
      SVGGElement,
      unknown
    >,
    binValues: Map<HexbinBin<[number, number, TData]>, number>,
  ): void {
    selection
      .on(
        "mouseover",
        (event: MouseEvent, bin: HexbinBin<[number, number, TData]>) => {
          const value = binValues.get(bin) || 0;
          if (this.config.showTooltip) {
            const content = this.config.tooltip(bin, value);
            showTooltip(event, content);
          }
          this.config.onHover(event, bin, value);
        },
      )
      .on("mousemove", (event: MouseEvent) => {
        if (this.config.showTooltip) {
          moveTooltip(event);
        }
      })
      .on(
        "mouseout",
        (event: MouseEvent, bin: HexbinBin<[number, number, TData]>) => {
          const value = binValues.get(bin) || 0;
          if (this.config.showTooltip) {
            hideTooltip();
          }
          this.config.onMouseOut(event, bin, value);
        },
      )
      .on(
        "click",
        (event: MouseEvent, bin: HexbinBin<[number, number, TData]>) => {
          const value = binValues.get(bin) || 0;
          this.config.onClick(event, bin, value);
        },
      );
  }

  private defaultTooltip(
    bin: HexbinBin<[number, number, TData]>,
    value: number,
  ): string {
    const { aggregation } = this.config;
    let label = "Value";

    if (typeof aggregation === "string") {
      const labels: Record<BuiltInAggregation, string> = {
        count: "Count",
        mean: "Average",
        sum: "Sum",
        min: "Minimum",
        max: "Maximum",
        median: "Median",
      };
      label = labels[aggregation] || "Value";
    }

    return `
      <strong>${label}:</strong> ${value.toFixed(2)}<br/>
      <span style="font-size: 0.9em; color: #ccc">${bin.length} events</span>
    `;
  }
}
