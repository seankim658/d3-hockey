/* eslint-disable  @typescript-eslint/no-explicit-any */

import * as d3 from "d3";
import type { Accessor } from "../types";

/**
 * Options for property-based scaling
 */
export interface ScaleOptions {
  // Output range
  min?: number;
  max?: number;
  // Input domain (if not provided, will be calculated from data)
  domain?: [number, number];
  // Clamp values outside domain
  clamp?: boolean;
}

/**
 * Options for radius scaling by property
 * Default values: min=3, max=20
 */
export interface RadiusScaleOptions extends ScaleOptions {
  min?: number;
  max?: number;
}

/**
 * Options for opacity scaling by property
 * Default values: min=0.3, max=1
 */
export interface OpacityScaleOptions extends ScaleOptions {
  min?: number;
  max?: number;
}

/**
 * Create a radius scaling function based on a data property
 *
 * @example
 * ```ts
 * // Scale radius by xG from 3 to 20 pixels
 * radius: scaleRadiusByProperty('xG', { min: 3, max: 20, domain: [0, 0.5] })
 *
 * // Auto-calculate domain from data
 * radius: scaleRadiusByProperty('shotDanger')
 * ```
 */
export function scaleRadiusByProperty<TData = any>(
  property: string | Accessor<TData, number>,
  options: RadiusScaleOptions = {},
): Accessor<TData, number> {
  const { min = 3, max = 20, domain, clamp = true } = options;

  return (d: TData): number => {
    const value =
      typeof property === "string" ? (d as any)[property] : property(d, 0);

    if (typeof value !== "number" || isNaN(value)) {
      return min;
    }

    // If domain is provided, use it
    if (domain) {
      const scale = d3
        .scaleLinear()
        .domain(domain)
        .range([min, max])
        .clamp(clamp);
      return scale(value);
    }

    // Otherwise just do simple linear mapping
    // Assumes value is already normalized (0-1) or in reasonable range
    return min + value * (max - min);
  };
}

/**
 * Create an opacity scaling function based on a data property
 *
 * @example
 * ```ts
 * // Scale opacity by shot danger
 * opacity: scaleOpacityByProperty('danger', { min: 0.3, max: 1 })
 *
 * // Use with domain
 * opacity: scaleOpacityByProperty('xG', { domain: [0, 0.5] })
 * ```
 */
export function scaleOpacityByProperty<TData = any>(
  property: string | Accessor<TData, number>,
  options: OpacityScaleOptions = {},
): Accessor<TData, number> {
  const { min = 0.3, max = 1.0, domain, clamp = true } = options;

  return (d: TData): number => {
    const value =
      typeof property === "string" ? (d as any)[property] : property(d, 0);

    if (typeof value !== "number" || isNaN(value)) {
      return min;
    }

    // Ensure opacity is in valid range
    const clampedMin = Math.max(0, Math.min(1, min));
    const clampedMax = Math.max(0, Math.min(1, max));

    if (domain) {
      const scale = d3
        .scaleLinear()
        .domain(domain)
        .range([clampedMin, clampedMax])
        .clamp(clamp);
      return scale(value);
    }

    return clampedMin + value * (clampedMax - clampedMin);
  };
}

/**
 * Create a general numeric scaling function based on a data property
 * Useful for custom attributes that need scaling
 *
 * @example
 * ```ts
 * // Scale stroke width by importance
 * strokeWidth: scaleByProperty('importance', { min: 1, max: 5, domain: [0, 10] })
 * ```
 */
export function scaleByProperty<TData = any>(
  property: string | Accessor<TData, number>,
  options: ScaleOptions = {},
): Accessor<TData, number> {
  const { min = 0, max = 1, domain, clamp = true } = options;

  return (d: TData): number => {
    const value =
      typeof property === "string" ? (d as any)[property] : property(d, 0);

    if (typeof value !== "number" || isNaN(value)) {
      return min;
    }

    if (domain) {
      const scale = d3
        .scaleLinear()
        .domain(domain)
        .range([min, max])
        .clamp(clamp);
      return scale(value);
    }

    return min + value * (max - min);
  };
}

/**
 * Create a square root scaling function for radius (common for area-based sizing)
 *
 * @example
 * ```ts
 * // Scale radius so that area is proportional to xG
 * radius: scaleSqrtByProperty('xG', { min: 3, max: 20, domain: [0, 0.5] })
 * ```
 */
export function scaleSqrtByProperty<TData = any>(
  property: string | Accessor<TData, number>,
  options: RadiusScaleOptions = {},
): Accessor<TData, number> {
  const { min = 3, max = 20, domain, clamp = true } = options;

  return (d: TData): number => {
    const value =
      typeof property === "string" ? (d as any)[property] : property(d, 0);

    if (typeof value !== "number" || isNaN(value)) {
      return min;
    }

    if (domain) {
      const scale = d3
        .scaleSqrt()
        .domain(domain)
        .range([min, max])
        .clamp(clamp);
      return scale(value);
    }

    // Simple sqrt scaling
    return min + Math.sqrt(value) * (max - min);
  };
}

/**
 * Create a logarithmic scaling function
 * Useful for data with large ranges or exponential distributions
 *
 * @example
 * ```ts
 * // Scale radius logarithmically for data with wide range
 * radius: scaleLogByProperty('distance', { min: 2, max: 15, domain: [1, 100] })
 * ```
 */
export function scaleLogByProperty<TData = any>(
  property: string | Accessor<TData, number>,
  options: ScaleOptions = {},
): Accessor<TData, number> {
  const { min = 1, max = 10, domain = [1, 100], clamp = true } = options;

  return (d: TData): number => {
    const value =
      typeof property === "string" ? (d as any)[property] : property(d, 0);

    if (typeof value !== "number" || isNaN(value) || value <= 0) {
      return min;
    }

    const scale = d3.scaleLog().domain(domain).range([min, max]).clamp(clamp);

    return scale(value);
  };
}

/**
 * Create a threshold-based scaling function
 * Maps discrete value ranges to specific outputs
 *
 * @example
 * ```ts
 * // Different sizes for different danger levels
 * radius: scaleByThresholds('xG', {
 *   thresholds: [0.1, 0.2, 0.3],
 *   outputs: [3, 6, 10, 15] // 4 outputs for 3 thresholds
 * })
 * ```
 */
export function scaleByThresholds<TData = any>(
  property: string | Accessor<TData, number>,
  options: {
    thresholds: number[];
    outputs: number[];
  },
): Accessor<TData, number> {
  const { thresholds, outputs } = options;

  if (outputs.length !== thresholds.length + 1) {
    throw new Error(
      `Outputs length (${outputs.length}) must be thresholds length + 1 (${thresholds.length + 1})`,
    );
  }

  const scale = d3
    .scaleThreshold<number, number>()
    .domain(thresholds)
    .range(outputs);

  return (d: TData): number => {
    const value =
      typeof property === "string" ? (d as any)[property] : property(d, 0);

    if (typeof value !== "number" || isNaN(value)) {
      return outputs[0];
    }

    return scale(value);
  };
}
