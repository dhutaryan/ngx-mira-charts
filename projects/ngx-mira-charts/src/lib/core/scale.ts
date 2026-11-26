/**
 * Two ends of a stretch of numbers: values for a domain, px for a range.
 *
 * @internal
 */
export type Extent = readonly [number, number]

/**
 * Round ticks over a domain, and the domain rounded out to them.
 *
 * @internal
 */
export type LinearTicks = {
  readonly domain: Extent
  readonly ticks: readonly number[]
}

// Where a raw step moves up to the next round one: 1, 2, 5 or 10 times a
// power of ten, whichever is closest. The thresholds of d3-array's ticks().
const E10 = Math.sqrt(50)
const E5 = Math.sqrt(10)
const E2 = Math.sqrt(2)

// Rounding the domain out can change the step, which rounds it out again.
// d3-scale's nice() gives up after as many rounds.
const MAX_NICE_ROUNDS = 10

/**
 * Maps a value from the domain onto the range, in a straight line.
 *
 * @internal
 */
export function linearScale(
  domain: Extent,
  range: Extent,
): (value: number) => number {
  const [d0, d1] = domain
  const [r0, r1] = range
  const k = d1 === d0 ? 0 : (r1 - r0) / (d1 - d0)

  return (value) => r0 + (value - d0) * k
}

/**
 * Picks about `count` ticks on round values (1, 2 or 5 times a power of ten
 * apart) and rounds the domain out to them, so the axis starts and ends on a
 * tick. A domain of a single value widens to that value plus one.
 *
 * @internal
 */
export function linearTicks([min, max]: Extent, count: number): LinearTicks {
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return { domain: [0, 1], ticks: [] }
  }

  let domain: Extent = max > min ? [min, max] : [min, min + 1]
  let increment = 0

  for (let round = 0; round < MAX_NICE_ROUNDS; round++) {
    const next = tickIncrement(domain, count)

    if (next === increment) break

    increment = next
    domain = roundOut(domain, increment)
  }

  return { domain, ticks: ticksBetween(domain, increment) }
}

/**
 * Spreads `count` points over the range, the first at its start and the last
 * at its end. A single point sits in the middle.
 *
 * @internal
 */
export function pointPositions(count: number, range: Extent): number[] {
  const [start, end] = range

  if (count === 1) return [(start + end) / 2]

  const step = (end - start) / (count - 1)

  return Array.from({ length: count }, (_, index) => start + index * step)
}

/*
 * The step between round ticks as a whole number: the step itself when it's
 * 1 or more, minus its inverse when it's less (-10 for 0.1). Whole numbers
 * keep the ticks exact: 3 / 10 is 0.3, where 3 * 0.1 is 0.30000000000000004.
 * The same rule as d3-array's tickIncrement().
 */
function tickIncrement([min, max]: Extent, count: number): number {
  const raw = (max - min) / Math.max(1, count || 1)
  const power = Math.floor(Math.log10(raw))
  const error = raw / 10 ** power
  const factor = error >= E10 ? 10 : error >= E5 ? 5 : error >= E2 ? 2 : 1

  return power >= 0 ? factor * 10 ** power : -(10 ** -power) / factor
}

function roundOut([min, max]: Extent, increment: number): Extent {
  if (increment > 0) {
    return [
      Math.floor(min / increment) * increment,
      Math.ceil(max / increment) * increment,
    ]
  }

  const inverse = -increment

  return [
    Math.floor(min * inverse) / inverse,
    Math.ceil(max * inverse) / inverse,
  ]
}

function ticksBetween([min, max]: Extent, increment: number): number[] {
  const ticks: number[] = []

  if (increment > 0) {
    for (let i = Math.ceil(min / increment); i * increment <= max; i++) {
      ticks.push(i * increment)
    }
  } else {
    const inverse = -increment

    for (let i = Math.ceil(min * inverse); i / inverse <= max; i++) {
      ticks.push(i / inverse)
    }
  }

  return ticks
}
