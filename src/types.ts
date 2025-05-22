
/**
 * Point type representing a 2D point with x and y coordinates
 */
export type Point = {
  x: number;
  y: number;
};

/**
 * Curve type for categorizing the different curve implementations
 */
export enum CurveType {
  Hermite = 'hermite',
  Bezier = 'bezier',
  BSpline = 'bspline'
}

/**
 * Common props shared by all curve editors
 */
export interface CurveEditorProps {
  width?: number;
  height?: number;
}

/**
 * Matrix type for mathematical operations
 */
export type Matrix = number[][];

/**
 * Polynomial coefficients for a cubic polynomial
 */
export type CubicPolynomial = {
  a: number; // cubic coefficient
  b: number; // quadratic coefficient
  c: number; // linear coefficient
  d: number; // constant term
};

/**
 * Hermite form representation
 */
export type HermiteForm = {
  P0: Point; // start point
  P1: Point; // end point
  T0: Point; // start tangent
  T1: Point; // end tangent
};

/**
 * Bezier trimming range
 */
export type TrimRange = {
  u1: number;
  u2: number;
};

/**
 * Knot vector for B-splines
 */
export type KnotVector = number[];
