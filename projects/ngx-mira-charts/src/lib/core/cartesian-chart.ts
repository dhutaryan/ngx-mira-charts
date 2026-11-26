import {
  Directive,
  type Signal,
  computed,
  contentChildren,
  input,
  numberAttribute,
} from '@angular/core'

import { ChartLayer } from './chart-layer'
import { extentOf } from './data'
import { linearScale, linearTicks } from './scale'
import type { ChartDatum, ChartMargin } from './types'

/**
 * The rectangle the series are drawn in: the chart less its margin, in px
 * within the chart's svg.
 *
 * @internal
 */
export type PlotArea = {
  readonly left: number
  readonly top: number
  readonly width: number
  readonly height: number
}

const DEFAULT_MARGIN: ChartMargin = { top: 10, right: 20, bottom: 10, left: 10 }

// About as many ticks as the y axis will show, until there's an axis to say.
const Y_TICK_COUNT = 5

/**
 * What every chart with an x and a y axis has: data, a size, a margin, the
 * plot area they leave, and a y scale that fits the values of its series.
 * Line and bar charts extend it and provide themselves under it, so the axes,
 * the grid and the series inject it to know where to draw, whichever chart
 * they're in. The way `MatTable` extends `CdkTable`.
 *
 * @internal
 */
@Directive()
export abstract class CartesianChart {
  /** The rows to plot. */
  readonly data = input<readonly ChartDatum[]>([])
  readonly width = input.required<number, unknown>({
    transform: numberAttribute,
  })

  readonly height = input.required<number, unknown>({
    transform: numberAttribute,
  })

  /** Overrides some sides of the default margin. */
  readonly margin = input<Partial<ChartMargin>>({})
  /** What the chart shows, for screen readers. */
  readonly ariaLabel = input<string>()

  readonly plot = computed<PlotArea>(() => {
    const margin = { ...DEFAULT_MARGIN, ...this.margin() }

    return {
      left: margin.left,
      top: margin.top,
      width: Math.max(0, this.width() - margin.left - margin.right),
      height: Math.max(0, this.height() - margin.top - margin.bottom),
    }
  })

  /** Maps a value to its y. */
  readonly yScale = computed(() => {
    const { top, height } = this.plot()

    return linearScale(this.#yTicks().domain, [top + height, top])
  })

  /** The x of each datum, in the order of the data. */
  abstract readonly xPositions: Signal<readonly number[]>

  /** What the chart draws, in the order it's written. */
  protected readonly layers = contentChildren(ChartLayer)

  /** The keys of the values the y axis has to fit: one per series. */
  protected abstract readonly valueKeys: Signal<readonly string[]>

  // The values of every series, and zero, rounded out to round ticks.
  readonly #yTicks = computed(() => {
    const [min, max] = extentOf(this.data(), this.valueKeys()) ?? [0, 0]

    return linearTicks([Math.min(0, min), Math.max(0, max)], Y_TICK_COUNT)
  })
}
