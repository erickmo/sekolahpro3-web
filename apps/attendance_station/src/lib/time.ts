/**
 * Clock-skew tolerance helpers for the attendance station.
 *
 * Layer: domain utility (pure, no I/O). Used by QR token verification to
 * tolerate small differences between the token's clock and the device clock.
 */

/**
 * Reports whether two epoch-second timestamps are within an allowed skew.
 *
 * @param a - first epoch-second timestamp.
 * @param b - second epoch-second timestamp.
 * @param toleranceSec - maximum allowed absolute difference, in seconds.
 * @returns true when |a - b| <= toleranceSec, false otherwise.
 */
export function withinSkew(a: number, b: number, toleranceSec: number): boolean {
  return Math.abs(a - b) <= toleranceSec;
}
