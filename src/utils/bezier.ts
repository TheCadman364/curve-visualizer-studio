
import { Point, TrimRange } from "../types";
import { bezierToPowerMatrix, multiplyVector, subdivisionMatrix } from "./matrices";

/**
 * Calculates the Bernstein basis polynomial
 * @param i - Index
 * @param n - Degree of the polynomial
 * @param u - Parameter value (0 to 1)
 * @returns Value of the Bernstein basis function
 */
export function bernstein(i: number, n: number, u: number): number {
  if (i < 0 || i > n) return 0;
  
  // Calculate binomial coefficient
  const binCoeff = binomial(n, i);
  
  // Calculate (1-u)^(n-i) * u^i
  return binCoeff * Math.pow(1 - u, n - i) * Math.pow(u, i);
}

/**
 * Calculates the binomial coefficient (n choose k)
 * @param n - Upper value
 * @param k - Lower value
 * @returns Binomial coefficient value
 */
export function binomial(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  
  let result = 1;
  for (let i = 1; i <= k; i++) {
    result *= (n + 1 - i) / i;
  }
  
  return result;
}

/**
 * Implementation of the de Casteljau algorithm to evaluate a point on a Bezier curve
 * @param points - Control points
 * @param u - Parameter value (0 to 1)
 * @returns Point on the Bezier curve
 */
export function deCasteljau(points: Point[], u: number): Point {
  if (points.length === 1) {
    return points[0];
  }
  
  const newPoints: Point[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    newPoints.push({
      x: (1 - u) * points[i].x + u * points[i + 1].x,
      y: (1 - u) * points[i].y + u * points[i + 1].y
    });
  }
  
  return deCasteljau(newPoints, u);
}

/**
 * Evaluate a point on a Bezier curve using the Bernstein basis functions
 * @param points - Control points
 * @param u - Parameter value (0 to 1)
 * @returns Point on the Bezier curve
 */
export function evaluateBezier(points: Point[], u: number): Point {
  const n = points.length - 1;
  let x = 0;
  let y = 0;
  
  for (let i = 0; i <= n; i++) {
    const basis = bernstein(i, n, u);
    x += points[i].x * basis;
    y += points[i].y * basis;
  }
  
  return { x, y };
}

/**
 * Generate a series of points along a Bezier curve
 * @param points - Control points
 * @param numPoints - Number of points to generate
 * @returns Array of points along the curve
 */
export function generateBezierCurvePoints(points: Point[], numPoints: number): Point[] {
  const curvePoints: Point[] = [];
  
  for (let i = 0; i <= numPoints; i++) {
    const u = i / numPoints;
    curvePoints.push(evaluateBezier(points, u));
  }
  
  return curvePoints;
}

/**
 * Calculate the trimmed control points for a Bezier curve
 * @param points - Original control points
 * @param range - Trim range [u1, u2]
 * @returns New set of control points for the trimmed curve
 */
export function getTrimmedControlPoints(points: Point[], range: TrimRange): Point[] {
  const { u1, u2 } = range;
  const n = points.length - 1;
  
  // Calculate points at u1
  const leftPoints: Point[] = [];
  let tempPoints = [...points];
  
  for (let i = 0; i <= n; i++) {
    leftPoints.push(tempPoints[0]);
    const newTempPoints: Point[] = [];
    
    for (let j = 0; j < tempPoints.length - 1; j++) {
      newTempPoints.push({
        x: (1 - u1) * tempPoints[j].x + u1 * tempPoints[j + 1].x,
        y: (1 - u1) * tempPoints[j].y + u1 * tempPoints[j + 1].y
      });
    }
    
    tempPoints = newTempPoints;
  }
  
  // Calculate points at u2
  const rightPoints: Point[] = [];
  tempPoints = [...points];
  
  for (let i = 0; i <= n; i++) {
    const newTempPoints: Point[] = [];
    
    for (let j = 0; j < tempPoints.length - 1; j++) {
      newTempPoints.push({
        x: (1 - u2) * tempPoints[j].x + u2 * tempPoints[j + 1].x,
        y: (1 - u2) * tempPoints[j].y + u2 * tempPoints[j + 1].y
      });
    }
    
    rightPoints.unshift(tempPoints[tempPoints.length - 1]);
    tempPoints = newTempPoints;
  }
  
  // Calculate the trimmed control points
  const trimmedPoints: Point[] = [];
  const alpha = (u2 - u1) / (1 - u1);
  
  for (let i = 0; i <= n; i++) {
    trimmedPoints.push({
      x: (1 - alpha) * leftPoints[i].x + alpha * rightPoints[i].x,
      y: (1 - alpha) * leftPoints[i].y + alpha * rightPoints[i].y
    });
  }
  
  return trimmedPoints;
}

/**
 * Convert Bezier control points to polynomial coefficients
 * @param points - Control points
 * @returns Polynomial coefficients
 */
export function bezierToPolynomial(points: Point[]): { x: number[], y: number[] } {
  const degree = points.length - 1;
  const matrix = bezierToPowerMatrix(degree);
  
  const xCoords = points.map(p => p.x);
  const yCoords = points.map(p => p.y);
  
  return {
    x: multiplyVector(matrix, xCoords),
    y: multiplyVector(matrix, yCoords)
  };
}

/**
 * Calculate intersection-based control points
 * P1 = (P0 + 2P*)/3 and P2 = (2P* + P3)/3
 * @param P0 - Start point
 * @param PStar - Intersection point
 * @param P3 - End point
 * @returns Intermediate control points [P1, P2]
 */
export function calculateIntersectionControlPoints(
  P0: Point,
  PStar: Point,
  P3: Point
): [Point, Point] {
  const P1: Point = {
    x: (P0.x + 2 * PStar.x) / 3,
    y: (P0.y + 2 * PStar.y) / 3
  };
  
  const P2: Point = {
    x: (2 * PStar.x + P3.x) / 3,
    y: (2 * PStar.y + P3.y) / 3
  };
  
  return [P1, P2];
}

/**
 * Compute the derivative of a Bezier curve at parameter u
 * @param points - Control points
 * @param u - Parameter value
 * @returns Tangent vector at the point
 */
export function bezierDerivative(points: Point[], u: number): Point {
  const n = points.length - 1;
  const derivPoints: Point[] = [];
  
  for (let i = 0; i < n; i++) {
    derivPoints.push({
      x: n * (points[i + 1].x - points[i].x),
      y: n * (points[i + 1].y - points[i].y)
    });
  }
  
  return evaluateBezier(derivPoints, u);
}
