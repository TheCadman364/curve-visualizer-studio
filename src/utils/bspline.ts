
import { KnotVector, Point } from "../types";

/**
 * Cox-de Boor recursion formula for B-spline basis functions
 * @param i - Index of control point
 * @param k - Degree of the basis function
 * @param u - Parameter value
 * @param knots - Knot vector
 * @returns Value of the basis function
 */
export function coxDeBoor(i: number, k: number, u: number, knots: KnotVector): number {
  // Base case for recursion (degree 0)
  if (k === 0) {
    if ((knots[i] <= u && u < knots[i + 1]) || 
        (u === knots[knots.length - 1] && i === knots.length - k - 2)) {
      return 1;
    }
    return 0;
  }
  
  // Compute the divided differences
  let term1 = 0;
  let term2 = 0;
  
  // First term: (u - t_i)/(t_{i+k} - t_i) * N_{i,k-1}(u)
  const denom1 = knots[i + k] - knots[i];
  if (denom1 !== 0) {
    term1 = ((u - knots[i]) / denom1) * coxDeBoor(i, k - 1, u, knots);
  }
  
  // Second term: (t_{i+k+1} - u)/(t_{i+k+1} - t_{i+1}) * N_{i+1,k-1}(u)
  const denom2 = knots[i + k + 1] - knots[i + 1];
  if (denom2 !== 0) {
    term2 = ((knots[i + k + 1] - u) / denom2) * coxDeBoor(i + 1, k - 1, u, knots);
  }
  
  return term1 + term2;
}

/**
 * Evaluate a point on a B-spline curve
 * @param controlPoints - Array of control points
 * @param degree - Degree of the B-spline
 * @param u - Parameter value
 * @param knots - Knot vector
 * @returns Point on the B-spline curve
 */
export function evaluateBSpline(
  controlPoints: Point[],
  degree: number,
  u: number,
  knots: KnotVector
): Point {
  let x = 0;
  let y = 0;
  
  for (let i = 0; i < controlPoints.length; i++) {
    const basis = coxDeBoor(i, degree, u, knots);
    x += controlPoints[i].x * basis;
    y += controlPoints[i].y * basis;
  }
  
  return { x, y };
}

/**
 * Generate points along a B-spline curve
 * @param controlPoints - Array of control points
 * @param degree - Degree of the B-spline
 * @param knots - Knot vector
 * @param numPoints - Number of points to generate
 * @returns Array of points along the curve
 */
export function generateBSplineCurvePoints(
  controlPoints: Point[],
  degree: number,
  knots: KnotVector,
  numPoints: number
): Point[] {
  const curvePoints: Point[] = [];
  
  // Parameter range is from knots[degree] to knots[knots.length - degree - 1]
  const startParam = knots[degree];
  const endParam = knots[knots.length - degree - 1];
  
  for (let i = 0; i <= numPoints; i++) {
    const u = startParam + (i / numPoints) * (endParam - startParam);
    curvePoints.push(evaluateBSpline(controlPoints, degree, u, knots));
  }
  
  return curvePoints;
}

/**
 * Calculate the derivative of a B-spline curve
 * @param controlPoints - Array of control points
 * @param degree - Degree of the B-spline
 * @param u - Parameter value
 * @param knots - Knot vector
 * @returns Tangent vector at the point
 */
export function bsplineDerivative(
  controlPoints: Point[],
  degree: number,
  u: number,
  knots: KnotVector
): Point {
  const n = controlPoints.length - 1;
  
  // For degree 1 or higher
  if (degree >= 1) {
    // Compute derivative control points
    const derivCtrlPts: Point[] = [];
    for (let i = 0; i < n; i++) {
      const factor = (degree) / (knots[i + degree + 1] - knots[i + 1]);
      derivCtrlPts.push({
        x: factor * (controlPoints[i + 1].x - controlPoints[i].x),
        y: factor * (controlPoints[i + 1].y - controlPoints[i].y)
      });
    }
    
    // Evaluate derivative curve at u
    return evaluateBSpline(derivCtrlPts, degree - 1, u, knots.slice(1, -1));
  }
  
  // If degree is 0, derivative is 0
  return { x: 0, y: 0 };
}

/**
 * Generate a uniform knot vector
 * @param n - Number of control points
 * @param k - Degree of the B-spline
 * @returns Uniform knot vector
 */
export function generateUniformKnots(n: number, k: number): KnotVector {
  const knots: KnotVector = [];
  const numKnots = n + k + 1;
  
  // Add k+1 zeros at the beginning
  for (let i = 0; i <= k; i++) {
    knots.push(0);
  }
  
  // Add internal knots
  for (let i = 1; i < n - k; i++) {
    knots.push(i / (n - k));
  }
  
  // Add k+1 ones at the end
  for (let i = 0; i <= k; i++) {
    knots.push(1);
  }
  
  return knots;
}

/**
 * Calculate basis function values for plotting
 * @param degree - Degree of the B-spline
 * @param knots - Knot vector
 * @param numPoints - Number of points to evaluate
 * @returns 2D array of basis function values for each control point
 */
export function calculateBasisFunctions(
  numControlPoints: number,
  degree: number,
  knots: KnotVector,
  numPoints: number
): number[][] {
  const basisValues: number[][] = [];
  
  // Parameter range is from knots[degree] to knots[knots.length - degree - 1]
  const startParam = knots[degree];
  const endParam = knots[knots.length - degree - 1];
  
  // For each control point
  for (let i = 0; i < numControlPoints; i++) {
    const values: number[] = [];
    
    // Calculate basis function values at each parameter
    for (let j = 0; j <= numPoints; j++) {
      const u = startParam + (j / numPoints) * (endParam - startParam);
      values.push(coxDeBoor(i, degree, u, knots));
    }
    
    basisValues.push(values);
  }
  
  return basisValues;
}

/**
 * Validate a knot vector
 * @param knots - Knot vector to validate
 * @param n - Number of control points
 * @param k - Degree
 * @returns Whether the knot vector is valid
 */
export function validateKnots(knots: KnotVector, n: number, k: number): boolean {
  // Check length
  if (knots.length !== n + k + 1) {
    return false;
  }
  
  // Check knots are non-decreasing
  for (let i = 0; i < knots.length - 1; i++) {
    if (knots[i] > knots[i + 1]) {
      return false;
    }
  }
  
  return true;
}
