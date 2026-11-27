import type { ChartDatum } from '../types'

/** @internal */
export function valueAt(datum: ChartDatum, key: string): unknown {
  return (datum as Record<string, unknown>)[key]
}

/**
 * The value under `key` as a number to plot, or null when there's nothing to
 * plot there: no value, null, NaN, or something other than a number.
 *
 * @internal
 */
export function numberAt(datum: ChartDatum, key: string): number | null {
  const value = valueAt(datum, key)

  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

/**
 * The smallest and the largest number under the keys, across the data, or
 * null when there's no number at all.
 *
 * @internal
 */
export function extentOf(
  data: readonly ChartDatum[],
  keys: readonly string[],
): [number, number] | null {
  let min = Infinity
  let max = -Infinity

  for (const datum of data) {
    for (const key of keys) {
      const value = numberAt(datum, key)

      if (value === null) continue

      min = Math.min(min, value)
      max = Math.max(max, value)
    }
  }

  return min <= max ? [min, max] : null
}
