/**
 * Pure zoom-arithmetic helpers.
 * No side effects, no React imports, no module dependencies.
 */

/**
 * Parses a raw localStorage string value and returns a valid zoom level.
 * Valid zoom levels are integers in [50, 200].
 * Falls back to 100 for any invalid or absent input.
 *
 * @param {string|null|undefined} rawValue - The raw string from localStorage
 * @returns {number} An integer in [50, 200]
 */
export function initZoomLevel(rawValue) {
  const parsed = parseInt(rawValue, 10);
  if (!Number.isInteger(parsed) || parsed < 50 || parsed > 200) {
    return 100;
  }
  return parsed;
}

/**
 * Returns the next zoom-in level: n + 10, clamped to a maximum of 200.
 *
 * @param {number} n - Current zoom level (integer in [50, 200])
 * @returns {number} New zoom level after zooming in
 */
export function applyZoomIn(n) {
  return Math.min(n + 10, 200);
}

/**
 * Returns the next zoom-out level: n - 10, clamped to a minimum of 50.
 *
 * @param {number} n - Current zoom level (integer in [50, 200])
 * @returns {number} New zoom level after zooming out
 */
export function applyZoomOut(n) {
  return Math.max(n - 10, 50);
}

/**
 * Computes the CSS font-size value in px for a given zoom level.
 * The base font size is 18px at 100%.
 *
 * @param {number} n - Current zoom level (integer in [50, 200])
 * @returns {number} Font size in px, rounded to at most 2 decimal places
 */
export function computeFontSize(n) {
  return parseFloat((18 * n / 100).toFixed(2));
}
