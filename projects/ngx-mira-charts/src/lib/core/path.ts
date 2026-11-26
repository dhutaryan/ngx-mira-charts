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
 * The svg path of a line through the points, in straight segments. The line
 * breaks where a point is null, and picks up again at the next one.
 *
 * @internal
 */
export function linePath(points: ReadonlyArray<Point | null>): string {
  return runsOf(points)
    .map((run) =>
      run
        .map((point, index) => `${index === 0 ? 'M' : 'L'}${xy(point)}`)
        .join(''),
    )
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

// Hundredths of a px are as fine as a screen shows, and keep paths short.
function xy(point: Point): string {
  return `${Math.round(point.x * 100) / 100},${Math.round(point.y * 100) / 100}`
}
