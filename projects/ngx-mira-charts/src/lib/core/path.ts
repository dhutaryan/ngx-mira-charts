/**
 * A point in px within a chart's svg.
 *
 * @internal
 */
export type Point = {
  readonly x: number
  readonly y: number
}

/**
 * How a line goes from one value to the next: straight, or along a smooth
 * curve that never overshoots the values (`monotone`).
 */
export type LineCurve = 'linear' | 'monotone'

/**
 * The svg path of a line through the points. The line breaks where a point is
 * null, and picks up again at the next one.
 *
 * @internal
 */
export function linePath(
  points: ReadonlyArray<Point | null>,
  curve: LineCurve,
): string {
  return runsOf(points)
    .map((run) => (curve === 'monotone' ? monotone(run) : straight(run)))
    .join('')
}

// The stretches of points between the nulls.
function runsOf(points: ReadonlyArray<Point | null>): Point[][] {
  const runs: Point[][] = [[]]

  for (const point of points) {
    if (point) {
      runs[runs.length - 1].push(point)
    } else if (runs[runs.length - 1].length > 0) {
      runs.push([])
    }
  }

  return runs.filter((run) => run.length > 0)
}

function straight(points: readonly Point[]): string {
  return points
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${xy(point)}`)
    .join('')
}

/*
 * A smooth curve through the points that keeps to the data: between two
 * points it goes neither above nor below them, so it makes up no peaks, and
 * it's flat where the data turns. Steffen's method ("A Simple Method for
 * Monotonic Interpolation in One Dimension", 1990), as d3-shape's
 * curveMonotoneX draws it: a cubic Bézier per segment, with the tangent at
 * each point at most twice as steep as the gentler segment beside it.
 */
function monotone(points: readonly Point[]): string {
  // Through two points, the curve is a straight line.
  if (points.length < 3) return straight(points)

  const last = points.length - 1
  const slopes: number[] = []

  for (let i = 0; i < last; i++) {
    const dx = points[i + 1].x - points[i].x

    slopes.push(dx === 0 ? 0 : (points[i + 1].y - points[i].y) / dx)
  }

  const tangents = new Array<number>(points.length).fill(0)

  for (let i = 1; i < last; i++) {
    const h0 = points[i].x - points[i - 1].x
    const h1 = points[i + 1].x - points[i].x
    const s0 = slopes[i - 1]
    const s1 = slopes[i]
    const p = (s0 * h1 + s1 * h0) / (h0 + h1)
    const sign = Math.sign(s0) + Math.sign(s1)

    // The sign is zero where the slopes have opposite signs: the curve is
    // flat where the data turns.
    tangents[i] =
      sign * Math.min(Math.abs(s0), Math.abs(s1), 0.5 * Math.abs(p)) || 0
  }

  // At the two ends, the tangent that leaves the curve unbent there.
  tangents[0] = (3 * slopes[0] - tangents[1]) / 2
  tangents[last] = (3 * slopes[last - 1] - tangents[last - 1]) / 2

  let path = `M${xy(points[0])}`

  for (let i = 0; i < last; i++) {
    const a = points[i]
    const b = points[i + 1]
    const dx = (b.x - a.x) / 3

    path +=
      `C${xy({ x: a.x + dx, y: a.y + dx * tangents[i] })}` +
      ` ${xy({ x: b.x - dx, y: b.y - dx * tangents[i + 1] })}` +
      ` ${xy(b)}`
  }

  return path
}

// Hundredths of a px are as fine as a screen shows, and keep paths short.
function xy(point: Point): string {
  return `${Math.round(point.x * 100) / 100},${Math.round(point.y * 100) / 100}`
}
