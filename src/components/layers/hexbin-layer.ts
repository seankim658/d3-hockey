/* eslint-disable  @typescript-eslint/no-explicit-any */

import * as d3 from "d3";
import { hexbin, type HexbinBin } from "d3-hexbin";
import { BaseLayer, BaseLayerConfig } from "./base-layer";
import { Accessor, RenderDimensions, AnimationEasing } from "../../types";
import { HOCKEY_COLOR_SCALES } from "../../utils/color-utils";

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
  aggregation?: "count" | "mean" | "sum";

  // Visuals
  colorScale?: d3.ScaleSequential<string> | d3.ScaleLinear<string, string>;
  stroke?: string | ((bin: HexbinBin<TData>, i: number) => string);
  strokeWidth?: number;

  // Tooltip
  showTooltip?: boolean;
  tooltip?: (bin: HexbinBin<TData>, value: number) => string;

  // Animation
  animate?: boolean;
  animationDuration?: number;
  animationEasing?: AnimationEasing;

  // Interaction
  onClick?: (event: MouseEvent, bin: HexbinBin<TData>) => void;
  onHover?: (event: MouseEvent, bin: HexbinBin<TData>) => void;

  // Advanced Customization
  customRender?: (
    selection: d3.Selection<
      SVGPathElement,
      HexbinBin<TData>,
      SVGGElement,
      unknown
    >,
    dimensions: RenderDimensions,
    context: {
      bin: HexbinBin<TData>;
      x: number;
      y: number;
      value: number;
    },
  ) => void;
}

/**
 * Hexagonal Binning Layer
 */
export class HexbinLayer<TData = any> extends BaseLayer<
  TData,
  HexbinLayerConfig<TData>
> {
  private static sharedTooltip: d3.Selection<
    HTMLDivElement,
    unknown,
    HTMLElement,
    unknown
  > | null = null;

  /**
   * Standardized X Accessor
   */
  private static defaultXAccessor<T>(d: T): number {
    if (d && typeof d === "object") {
      const obj = d as any;
      if ("details" in obj && obj.details?.xCoord != null)
        return obj.details.xCoord; // Raw NHL API
      if ("x" in obj && obj.x != null) return obj.x; // Flat object
      if ("coordinates" in obj && obj.coordinates?.x != null)
        return obj.coordinates.x; // Standard HockeyEvent
    }
    throw new Error("Cannot extract x coordinate from data point");
  }

  /**
   * Standardized Y Accessor
   */
  private static defaultYAccessor<T>(d: T): number {
    if (d && typeof d === "object") {
      const obj = d as any;
      if ("details" in obj && obj.details?.yCoord != null)
        return obj.details.yCoord;
      if ("y" in obj && obj.y != null) return obj.y;
      if ("coordinates" in obj && obj.coordinates?.y != null)
        return obj.coordinates.y;
    }
    throw new Error("Cannot extract y coordinate from data point");
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
      x: HexbinLayer.defaultXAccessor,
      y: HexbinLayer.defaultYAccessor,

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

      // Custom
      customRender: () => {},
    };
  }

  initialize(
    parent: d3.Selection<SVGGElement, unknown, null, undefined>,
    dimensions: RenderDimensions,
  ): void {
    super.initialize(parent, dimensions);
    if (this.config.showTooltip) {
      this.createTooltip();
    }
  }

  private createTooltip(): void {
    if (!HexbinLayer.sharedTooltip || HexbinLayer.sharedTooltip.empty()) {
      HexbinLayer.sharedTooltip = d3
        .select<HTMLElement, unknown>("body")
        .append("div")
        .attr("class", "d3-hockey-tooltip hexbin-tooltip")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("background-color", "rgba(0, 0, 0, 0.9)")
        .style("color", "#fff")
        .style("padding", "8px 12px")
        .style("border-radius", "4px")
        .style("font-size", "12px")
        .style("pointer-events", "none")
        .style("z-index", "1000")
        .style("box-shadow", "0 4px 6px rgba(0,0,0,0.3)");
    }
  }

  render(): void {
    if (!this.group) return;

    const { scale, width, height } = this.dimensions;
    const {
      radius,
      radiusScale: rScaleRange,
      colorScale,
      aggregation,
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

          const svgPos = this.nhlToSVG({ x: nhlX, y: nhlY });
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
        [0, 0],
        [width, height],
      ]);

    const bins = hexbinGenerator(points);

    // 3. Calculate Aggregate Values per Bin
    // We attach the calculated value to the bin array for easy access later
    const binValues = new Map<HexbinBin<TData>, number>();

    bins.forEach((bin) => {
      const values = bin.map((p) => this.config.value(p[2], 0));
      let val = 0;
      if (aggregation === "mean") {
        val = d3.mean(values) || 0;
      } else if (aggregation === "sum") {
        val = d3.sum(values) || 0;
      } else {
        val = bin.length; // Default count
      }
      binValues.set(bin, val);
    });

    // 4. Update Color Scale & Radius Scale
    const allValues = Array.from(binValues.values());
    const domain = d3.extent(allValues) as [number, number];

    // Safety check for empty data
    if (domain[0] === undefined) domain[0] = 0;
    if (domain[1] === undefined) domain[1] = 0;

    const activeColorScale = colorScale.copy()
      ? (colorScale as any).copy().domain(domain)
      : colorScale.domain(domain);

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
    const easing = (d3 as any)[animationEasing] || d3.easeCubicOut;

    // Helper to generate path
    const getPath = (d: HexbinBin<TData>) => {
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
      .attr("transform", (d) => `translate(${d.x},${d.y}) scale(0)`)
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

    // Run Custom Render if provided
    if (this.config.customRender) {
      enter.each((d, i, nodes) => {
        this.config.customRender!(d3.select(nodes[i]), this.dimensions, {
          bin: d,
          x: d.x,
          y: d.y,
          value: binValues.get(d) || 0,
        });
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
        .attr("transform", (d) => `translate(${d.x},${d.y}) scale(0)`)
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

  private addInteractions(
    selection: d3.Selection<SVGPathElement, HexbinBin<TData>, any, any>,
    valueMap: Map<HexbinBin<TData>, number>,
  ) {
    if (this.config.showTooltip) {
      selection
        .on("mouseover", (event, d) => {
          const val = valueMap.get(d) || 0;
          this.showTooltip(event, d, val);
          this.config.onHover(event, d);
          d3.select(event.currentTarget).raise(); // Bring to front
        })
        .on("mousemove", (event) => this.moveTooltip(event))
        .on("mouseout", (event, d) => {
          this.hideTooltip();
        })
        .on("click", (event, d) => this.config.onClick(event, d));
    }
  }

  private defaultTooltip(bin: HexbinBin<TData>, value: number): string {
    const { aggregation } = this.config;
    let label = "Count";
    if (aggregation === "mean") label = "Average";
    if (aggregation === "sum") label = "Sum";

    return `
        <strong>${label}:</strong> ${value.toFixed(2)}<br/>
        <span style="font-size: 0.9em; color: #ccc">${bin.length} events</span>
      `;
  }

  private showTooltip(
    event: MouseEvent,
    bin: HexbinBin<TData>,
    value: number,
  ): void {
    if (!HexbinLayer.sharedTooltip) return;
    const content = this.config.tooltip(bin, value);
    HexbinLayer.sharedTooltip.html(content).style("visibility", "visible");
    this.moveTooltip(event);
  }

  private moveTooltip(event: MouseEvent): void {
    if (!HexbinLayer.sharedTooltip) return;
    HexbinLayer.sharedTooltip
      .style("top", `${event.pageY - 10}px`)
      .style("left", `${event.pageX + 10}px`);
  }

  private hideTooltip(): void {
    if (!HexbinLayer.sharedTooltip) return;
    HexbinLayer.sharedTooltip.style("visibility", "hidden");
  }
}
