
import { Point, CubicPolynomial, HermiteForm } from "../types";
import { hermiteMatrix, multiplyVector } from "./matrices";

/**
 * Calculate the Hermite basis function h0(u)
 * @param u - Parameter value (0 to 1)
 * @returns Value of h0(u) = 2u³ - 3u² + 1
 */
export function h0(u: number): number {
  return 2 * Math.pow(u, 3) - 3 * Math.pow(u, 2) + 1;
}

/**
 * Calculate the Hermite basis function h1(u)
 * @param u - Parameter value (0 to 1)
 * @returns Value of h1(u) = -2u³ + 3u²
 */
export function h1(u: number): number {
  return -2 * Math.pow(u, 3) + 3 * Math.pow(u, 2);
}

/**
 * Calculate the Hermite basis function h2(u)
 * @param u - Parameter value (0 to 1)
 * @returns Value of h2(u) = u³ - 2u² + u
 */
export function h2(u: number): number {
  return Math.pow(u, 3) - 2 * Math.pow(u, 2) + u;
}

/**
 * Calculate the Hermite basis function h3(u)
 * @param u - Parameter value (0 to 1)
 * @returns Value of h3(u) = u³ - u²
 */
export function h3(u: number): number {
  return Math.pow(u, 3) - Math.pow(u, 2);
}

/**
 * Evaluate a Hermite curve at parameter u
 * @param form - Hermite form parameters (P0, P1, T0, T1)
 * @param u - Parameter value (0 to 1)
 * @returns Point on the Hermite curve
 */
export function evaluateHermite(form: HermiteForm, u: number): Point {
  const { P0, P1, T0, T1 } = form;
  
  // Calculate basis functions
  const h0u = h0(u);
  const h1u = h1(u);
  const h2u = h2(u);
  const h3u = h3(u);
  
  // Calculate point on curve
  return {
    x: h0u * P0.x + h1u * P1.x + h2u * T0.x + h3u * T1.x,
    y: h0u * P0.y + h1u * P1.y + h2u * T0.y + h3u * T1.y
  };
}

/**
 * Generate points along a Hermite curve
 * @param form - Hermite form parameters
 * @param numPoints - Number of points to generate
 * @returns Array of points along the curve
 */
export function generateHermiteCurvePoints(form: HermiteForm, numPoints: number): Point[] {
  const points: Point[] = [];
  
  for (let i = 0; i <= numPoints; i++) {
    const u = i / numPoints;
    points.push(evaluateHermite(form, u));
  }
  
  return points;
}

/**
 * Convert from Hermite form to polynomial coefficients
 * @param form - Hermite form parameters
 * @returns Polynomial coefficients for x and y
 */
export function hermiteToPolynomial(form: HermiteForm): { x: CubicPolynomial; y: CubicPolynomial } {
  const { P0, P1, T0, T1 } = form;
  const H = hermiteMatrix();
  
  // For x coordinate
  const gx = [P0.x, P1.x, T0.x, T1.x];
  const cx = multiplyVector(H, gx);
  
  // For y coordinate
  const gy = [P0.y, P1.y, T0.y, T1.y];
  const cy = multiplyVector(H, gy);
  
  return {
    x: { a: cx[0], b: cx[1], c: cx[2], d: cx[3] },
    y: { a: cy[0], b: cy[1], c: cy[2], d: cy[3] }
  };
}

/**
 * Convert from polynomial coefficients to Hermite form
 * @param polyX - Polynomial coefficients for x
 * @param polyY - Polynomial coefficients for y
 * @returns Hermite form parameters
 */
export function polynomialToHermite(
  polyX: CubicPolynomial,
  polyY: CubicPolynomial
): HermiteForm {
  // Extract polynomial coefficients
  const { a: ax, b: bx, c: cx, d: dx } = polyX;
  const { a: ay, b: by, c: cy, d: dy } = polyY;
  
  // Calculate Hermite parameters
  // P0 = p(0)
  const P0: Point = { x: dx, y: dy };
  
  // P1 = p(1) = a + b + c + d
  const P1: Point = { x: ax + bx + cx + dx, y: ay + by + cy + dy };
  
  // T0 = p'(0) = c
  const T0: Point = { x: cx, y: cy };
  
  // T1 = p'(1) = 3a + 2b + c
  const T1: Point = { x: 3 * ax + 2 * bx + cx, y: 3 * ay + 2 * by + cy };
  
  return { P0, P1, T0, T1 };
}
