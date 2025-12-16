import * as d3 from "d3";

type EasingFunction = (normalizedTime: number) => number;

const EASING_MAP: Record<string, EasingFunction> = {
  easeLinear: d3.easeLinear,
  easeQuad: d3.easeQuad,
  easeQuadIn: d3.easeQuadIn,
  easeQuadOut: d3.easeQuadOut,
  easeQuadInOut: d3.easeQuadInOut,
  easeCubic: d3.easeCubic,
  easeCubicIn: d3.easeCubicIn,
  easeCubicOut: d3.easeCubicOut,
  easeCubicInOut: d3.easeCubicInOut,
  easePoly: d3.easePoly,
  easePolyIn: d3.easePolyIn,
  easePolyOut: d3.easePolyOut,
  easePolyInOut: d3.easePolyInOut,
  easeSin: d3.easeSin,
  easeSinIn: d3.easeSinIn,
  easeSinOut: d3.easeSinOut,
  easeSinInOut: d3.easeSinInOut,
  easeExp: d3.easeExp,
  easeExpIn: d3.easeExpIn,
  easeExpOut: d3.easeExpOut,
  easeExpInOut: d3.easeExpInOut,
  easeCircle: d3.easeCircle,
  easeCircleIn: d3.easeCircleIn,
  easeCircleOut: d3.easeCircleOut,
  easeCircleInOut: d3.easeCircleInOut,
  easeElastic: d3.easeElastic,
  easeElasticIn: d3.easeElasticIn,
  easeElasticOut: d3.easeElasticOut,
  easeElasticInOut: d3.easeElasticInOut,
  easeBack: d3.easeBack,
  easeBackIn: d3.easeBackIn,
  easeBackOut: d3.easeBackOut,
  easeBackInOut: d3.easeBackInOut,
  easeBounce: d3.easeBounce,
  easeBounceIn: d3.easeBounceIn,
  easeBounceOut: d3.easeBounceOut,
  easeBounceInOut: d3.easeBounceInOut,
};

/**
 * Get easing function by name with type safety
 */
export function getEasingFunction(name: string): EasingFunction {
  const fn = EASING_MAP[name];
  if (fn) {
    return fn;
  }
  console.warn(`Unknown easing function: ${name}. Using easeLinear.`);
  return d3.easeLinear;
}
