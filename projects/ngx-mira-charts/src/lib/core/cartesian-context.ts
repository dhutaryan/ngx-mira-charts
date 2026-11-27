import type { Signal } from '@angular/core'

import type { ChartDatum } from './types'

/**
 * The rectangle the series are drawn in: the chart less its margin and the
 * room its axes take, in px within the chart's svg.
 */
export type PlotArea = {
  readonly left: number
  readonly top: number
  readonly width: number
  readonly height: number
}

/** A tick on the y axis: its value, and its y in px within the chart's svg. */
export type Tick = {
  readonly value: number
  readonly offset: number
}

/**
 * About how many ticks the y scale aims for, unless the y axis asks for
 * another number.
 *
 * @internal
 */
export const DEFAULT_TICK_COUNT = 5

/**
 * What the layers of a chart with an x and a y axis draw by: the data, the
 * plot area, the scales, and the datum under the pointer. Every kind of chart
 * provides itself under it, with `provideCartesianChart`, and the library's
 * own layers inject it: they can't import the chart, which imports the axes
 * to leave room for them. The way Angular Material's tabs inject
 * `MAT_TAB_GROUP`.
 *
 * @internal
 */
export abstract class CartesianContext {
  /** The rows to plot. */
  abstract readonly data: Signal<readonly ChartDatum[]>
  /** Where the series are drawn. */
  abstract readonly plot: Signal<PlotArea>
  /** Maps a value to its y. */
  abstract readonly yScale: Signal<(value: number) => number>
  /** Round values over the y scale, for the y axis and the grid to mark. */
  abstract readonly yTicks: Signal<readonly Tick[]>
  /** The x of each datum, in the order of the data. */
  abstract readonly xPositions: Signal<readonly number[]>
  /** The index of the datum under the pointer, or null. */
  abstract readonly activeIndex: Signal<number | null>
}
