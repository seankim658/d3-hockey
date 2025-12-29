import * as d3 from "d3";
import type { Accessor } from "../types";
import { extractNumericValue } from "./accessor-utils";

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
 */
export function scaleRadiusByProperty<TData>(
  property: string | Accessor<TData, number>,
  options: RadiusScaleOptions = {},
): Accessor<TData, number> {
  const { min = 3, max = 20, domain, clamp = true } = options;

  return (d: TData, i: number): number => {
    const value = extractNumericValue(d, property, i);
    if (value === undefined || isNaN(value)) {
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
 */
export function scaleOpacityByProperty<TData>(
  property: string | Accessor<TData, number>,
  options: OpacityScaleOptions = {},
): Accessor<TData, number> {
  const { min = 0.3, max = 1.0, domain, clamp = true } = options;

  return (d: TData, i: number): number => {
    const value = extractNumericValue(d, property, i);
    if (value === undefined || isNaN(value)) {
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
 */
export function scaleByProperty<TData>(
  property: string | Accessor<TData, number>,
  options: ScaleOptions = {},
): Accessor<TData, number> {
  const { min = 0, max = 1, domain, clamp = true } = options;

  return (d: TData, i: number): number => {
    const value = extractNumericValue(d, property, i);
    if (value === undefined || isNaN(value)) {
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
 */
export function scaleSqrtByProperty<TData>(
  property: string | Accessor<TData, number>,
  options: RadiusScaleOptions = {},
): Accessor<TData, number> {
  const { min = 3, max = 20, domain, clamp = true } = options;

  return (d: TData, i: number): number => {
    const value = extractNumericValue(d, property, i);
    if (value === undefined || isNaN(value)) {
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
 */
export function scaleLogByProperty<TData>(
  property: string | Accessor<TData, number>,
  options: ScaleOptions = {},
): Accessor<TData, number> {
  const { min = 1, max = 10, domain = [1, 100], clamp = true } = options;

  return (d: TData, i: number): number => {
    const value = extractNumericValue(d, property, i);
    if (value === undefined || isNaN(value) || value <= 0) {
      return min;
    }

    const scale = d3.scaleLog().domain(domain).range([min, max]).clamp(clamp);

    return scale(value);
  };
}

/**
 * Create a threshold-based scaling function
 * Maps discrete value ranges to specific outputs
 */
export function scaleByThresholds<TData>(
  property: string | Accessor<TData, number>,
  options: {
    thresholds: number[];
    outputs: number[];
    fallback?: number;
  },
): Accessor<TData, number> {
  const { thresholds, outputs, fallback = outputs[0] ?? 0 } = options;

  return (d: TData, i: number): number => {
    const value = extractNumericValue(d, property, i);
    if (value === undefined || isNaN(value)) {
      return fallback;
    }

    const scale = d3
      .scaleThreshold<number, number>()
      .domain(thresholds)
      .range(outputs);

    return scale(value);
  };
}
