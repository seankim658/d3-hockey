/**
 * Layer manager for handling multiple layers on a rink
 * Manages layer ordering, updates, and lifecycle
 */

import * as d3 from "d3";
import { BaseLayer } from "./base-layer";
import type { RenderDimensions } from "../../types";

/**
 * Manages all layers on a rink visualization
 */
export class LayerManager {
  private layers: Map<string, BaseLayer> = new Map();
  private container: d3.Selection<SVGGElement, unknown, null, undefined>;
  private dimensions: RenderDimensions;

  constructor(
    container: d3.Selection<SVGGElement, unknown, null, undefined>,
    dimensions: RenderDimensions,
  ) {
    this.container = container;
    this.dimensions = dimensions;
  }

  /**
   * Add a layer to the manager
   */
  addLayer(layer: BaseLayer): void {
    const config = layer.getConfig();

    if (this.layers.has(config.id)) {
      console.warn(
        `Layer with id "${config.id}" already exists. Replacing it.`,
      );
      this.removeLayer(config.id);
    }

    layer.initialize(this.container, this.dimensions);
    this.layers.set(config.id, layer);
    this.sortLayers();
  }

  /**
   * Remove a layer by ID
   */
  removeLayer(id: string): boolean {
    const layer = this.layers.get(id);
    if (layer) {
      layer.destroy();
      this.layers.delete(id);
      return true;
    }
    return false;
  }

  /**
   * Get a layer by ID
   */
  getLayer(id: string): BaseLayer | undefined {
    return this.layers.get(id);
  }

  /**
   * Check if a layer exists
   */
  hasLayer(id: string): boolean {
    return this.layers.has(id);
  }

  /**
   * Get all layer IDs
   */
  getLayerIds(): string[] {
    return Array.from(this.layers.keys());
  }

  /**
   * Render all visible layers
   */
  renderAll(): void {
    this.layers.forEach((layer) => {
      if (layer.getConfig().visible) {
        layer.render();
      }
    });
  }

  /**
   * Clear all layers
   */
  clearAll(): void {
    this.layers.forEach((layer) => layer.clear());
  }

  /**
   * Update dimensions for all layers (called on resize)
   */
  updateDimensions(dimensions: RenderDimensions): void {
    this.dimensions = dimensions;
    this.layers.forEach((layer) => {
      layer.updateDimensions(dimensions);
    });
  }

  /**
   * Show a layer by ID
   */
  showLayer(id: string): void {
    const layer = this.layers.get(id);
    if (layer) {
      layer.show();
    }
  }

  /**
   * Hide a layer by ID
   */
  hideLayer(id: string): void {
    const layer = this.layers.get(id);
    if (layer) {
      layer.hide();
    }
  }

  /**
   * Set opacity for a layer
   */
  setLayerOpacity(id: string, opacity: number): void {
    const layer = this.layers.get(id);
    if (layer) {
      layer.setOpacity(opacity);
    }
  }

  /**
   * Sort layers by z-index
   */
  private sortLayers(): void {
    const sortedLayers = Array.from(this.layers.values()).sort((a, b) => {
      const aZ = a.getConfig().zIndex || 0;
      const bZ = b.getConfig().zIndex || 0;
      return aZ - bZ;
    });

    sortedLayers.forEach((layer) => {
      const group = layer.getGroup();
      if (group && group.node()) {
        // Re-append to change order
        this.container.node()?.appendChild(group.node()!);
      }
    });
  }

  /**
   * Remove all layers
   */
  destroy(): void {
    this.layers.forEach((layer) => layer.destroy());
    this.layers.clear();
  }
}
