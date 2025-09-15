/**
 * Safe Math Utilities for React Native
 * Prevents "Loss of precision during arithmetic conversion" errors
 */

/**
 * Safe division that never returns Infinity or NaN
 */
export const safeDivide = (numerator: number, denominator: number, fallback: number = 0): number => {
  if (!denominator || denominator === 0 || !isFinite(denominator)) {
    return fallback;
  }
  if (!isFinite(numerator)) {
    return fallback;
  }
  const result = numerator / denominator;
  return isFinite(result) ? result : fallback;
};

/**
 * Safe percentage calculation
 */
export const safePercentage = (current: number, total: number, fallback: number = 0): number => {
  return safeDivide(current, total, fallback) * 100;
};

/**
 * Ensure a number is safe for React Native bridge
 */
export const safeNumber = (value: any, fallback: number = 0): number => {
  const num = Number(value);
  return isFinite(num) ? num : fallback;
};

/**
 * Safe progress calculation (0-1 range)
 */
export const safeProgress = (current: number, total: number): number => {
  return Math.max(0, Math.min(1, safeDivide(current, total, 0)));
};