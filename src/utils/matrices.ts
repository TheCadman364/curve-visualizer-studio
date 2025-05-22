
import { Matrix } from "../types";

/**
 * Matrix multiplication: C = A * B
 * @param A - First matrix
 * @param B - Second matrix
 * @returns Resulting matrix
 */
export function multiply(A: Matrix, B: Matrix): Matrix {
  const rowsA = A.length;
  const colsA = A[0].length;
  const rowsB = B.length;
  const colsB = B[0].length;

  if (colsA !== rowsB) {
    throw new Error(`Cannot multiply ${rowsA}x${colsA} matrix with ${rowsB}x${colsB} matrix`);
  }

  const C: Matrix = [];
  for (let i = 0; i < rowsA; i++) {
    C[i] = [];
    for (let j = 0; j < colsB; j++) {
      C[i][j] = 0;
      for (let k = 0; k < colsA; k++) {
        C[i][j] += A[i][k] * B[k][j];
      }
    }
  }
  return C;
}

/**
 * Vector multiplication: matrix * vector
 * @param A - Matrix
 * @param v - Vector (as array)
 * @returns Resulting vector
 */
export function multiplyVector(A: Matrix, v: number[]): number[] {
  const rows = A.length;
  const cols = A[0].length;

  if (cols !== v.length) {
    throw new Error(`Cannot multiply ${rows}x${cols} matrix with vector of length ${v.length}`);
  }

  const result: number[] = [];
  for (let i = 0; i < rows; i++) {
    result[i] = 0;
    for (let j = 0; j < cols; j++) {
      result[i] += A[i][j] * v[j];
    }
  }
  return result;
}

/**
 * Transpose a matrix
 * @param A - Input matrix
 * @returns Transposed matrix
 */
export function transpose(A: Matrix): Matrix {
  const rows = A.length;
  const cols = A[0].length;
  const T: Matrix = [];

  for (let j = 0; j < cols; j++) {
    T[j] = [];
    for (let i = 0; i < rows; i++) {
      T[j][i] = A[i][j];
    }
  }
  return T;
}

/**
 * Generate Hermite matrix for cubic interpolation
 * @returns 4x4 Hermite basis matrix
 */
export function hermiteMatrix(): Matrix {
  return [
    [2, -2, 1, 1],
    [-3, 3, -2, -1],
    [0, 0, 1, 0],
    [1, 0, 0, 0]
  ];
}

/**
 * Generate Bezier to power basis conversion matrix for degree n
 * @param n - Degree of Bezier curve
 * @returns Conversion matrix
 */
export function bezierToPowerMatrix(n: number): Matrix {
  if (n === 2) { // Quadratic Bezier
    return [
      [1, -2, 1],
      [-2, 2, 0],
      [1, 0, 0]
    ];
  } else if (n === 3) { // Cubic Bezier
    return [
      [-1, 3, -3, 1],
      [3, -6, 3, 0],
      [-3, 3, 0, 0],
      [1, 0, 0, 0]
    ];
  }
  
  throw new Error(`Bezier to power basis matrix not implemented for degree ${n}`);
}

/**
 * Generate a subdivision matrix for Bezier curve at parameter u
 * @param n - Degree of Bezier curve
 * @param u - Parameter value for subdivision
 * @returns Subdivision matrix
 */
export function subdivisionMatrix(n: number, u: number): Matrix {
  if (n !== 3) {
    throw new Error(`Subdivision matrix not implemented for degree ${n}`);
  }
  
  // For cubic Bezier curves
  const u2 = u * u;
  const u3 = u2 * u;
  const v = 1 - u;
  const v2 = v * v;
  const v3 = v2 * v;
  
  return [
    [1, 0, 0, 0],
    [v, u, 0, 0],
    [v2, v*u, u2, 0],
    [v3, v2*u, v*u2, u3]
  ];
}

/**
 * Generate reparameterization matrix for changing parameter range
 * @param u1 - Start parameter
 * @param u2 - End parameter
 * @returns Reparameterization matrix
 */
export function reparameterizationMatrix(u1: number, u2: number): Matrix {
  const delta = u2 - u1;
  const delta2 = delta * delta;
  const delta3 = delta2 * delta;
  
  return [
    [1, 0, 0, 0],
    [u1, delta, 0, 0],
    [u1*u1, 2*u1*delta, delta2, 0],
    [u1*u1*u1, 3*u1*u1*delta, 3*u1*delta2, delta3]
  ];
}
