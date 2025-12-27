/* eslint-disable  @typescript-eslint/no-explicit-any */

/**
 * Abstract base class for all rink layers
 * Provides common functionality for rendering data on the rink
 */

import * as d3 from "d3";
import type { RenderDimensions } from "../../types";

/**
 * Base configuration for all layers
 */
export interface BaseLayerConfig {
  id: string;
  visible?: boolean;
  opacity?: number;
  className?: string;
  zIndex?: number;
}

/**
 * Abstract base class that all layers extend
 */
export abstract class BaseLayer<
  TData = any,
  TConfig extends BaseLayerConfig = BaseLayerConfig,
> {
  protected config: Required<TConfig>;
  protected data: TData[];
  protected group: d3.Selection<SVGGElement, unknown, null, undefined> | null =
    null;
  protected dimensions: RenderDimensions;

  constructor(data: TData[], config: TConfig) {
    this.data = data;
    const defaults = this.getDefaults();
    this.config = {
      ...defaults,
      ...config,
    } as Required<TConfig>;
    this.dimensions = { width: 0, height: 0, padding: 0, scale: 1 };
  }

  /**
   * Get default configuration values
   */
  protected getDefaults(): Required<TConfig> {
    return {
      visible: true,
      opacity: 1,
      className: "layer",
      zIndex: 0,
    } as Required<TConfig>;
  }

  /**
   * Initialize the layer's SVG group
   */
  initialize(
    parent: d3.Selection<SVGGElement, unknown, null, undefined>,
    dimensions: RenderDimensions,
  ): void {
    this.dimensions = dimensions;
    this.group = parent
      .append("g")
      .attr("class", this.config.className!)
      .attr("data-layer-id", this.config.id)
      .style("opacity", this.config.opacity!)
      .style("display", this.config.visible ? "block" : "none");
  }

  /**
   * Render the layer (must be implemented by subclasses)
   */
  abstract render(): void;

  /**
   * Update the layer with new data
   */
  update(data: TData[]): void {
    this.data = data;
    this.clear();
    this.render();
  }

  /**
   * Update dimensions when rink is resized
   */
  updateDimensions(dimensions: RenderDimensions): void {
    this.dimensions = dimensions;
    this.clear();
    this.render();
  }

  /**
   * Clear the layer's content
   */
  clear(): void {
    if (this.group) {
      this.group.selectAll("*").remove();
    }
  }

  /**
   * Show the layer
   */
  show(): void {
    this.config.visible = true;
    if (this.group) {
      this.group.style("display", "block");
    }
  }

  /**
   * Hide the layer
   */
  hide(): void {
    this.config.visible = false;
    if (this.group) {
      this.group.style("display", "none");
    }
  }

  /**
   * Set layer opacity
   */
  setOpacity(opacity: number): void {
    this.config.opacity = Math.max(0, Math.min(1, opacity));
    if (this.group) {
      this.group.style("opacity", this.config.opacity);
    }
  }

  /**
   * Remove the layer completely
   */
  destroy(): void {
    if (this.group) {
      this.group.remove();
      this.group = null;
    }
  }

  /**
   * Get the layer's configuration
   */
  getConfig(): Required<TConfig> {
    return { ...this.config };
  }

  /**
   * Get the layer's data
   */
  getData(): TData[] {
    return [...this.data];
  }

  /**
   * Get the layer's SVG group
   */
  getGroup(): d3.Selection<SVGGElement, unknown, null, undefined> | null {
    return this.group;
  }
}
