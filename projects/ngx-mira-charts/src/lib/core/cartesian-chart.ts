import {
  DestroyRef,
  Directive,
  ElementRef,
  type Signal,
  afterNextRender,
  computed,
  contentChildren,
  inject,
  input,
  numberAttribute,
  signal,
} from '@angular/core'

import { MiraChartLayer } from './chart-layer'
import { extentOf } from './data'
import { linearScale, linearTicks, nearestIndex } from './scale'
import type { ChartDatum, ChartMargin } from './types'
import type { MiraXAxis } from './x-axis'
import type { MiraYAxis } from './y-axis'

/**
 * The rectangle the series are drawn in: the chart less its margin and the
 * room its axes take, in px within the chart's svg.
 *
 * @internal
 */
export type PlotArea = {
  readonly left: number
  readonly top: number
  readonly width: number
  readonly height: number
}

/**
 * A tick on the y axis: its value, and its y in px within the chart's svg.
 *
 * @internal
 */
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

const DEFAULT_MARGIN: ChartMargin = { top: 10, right: 20, bottom: 10, left: 10 }

// The size a chart draws at until it can measure its container: on the
// server, in the browser's first frame, and while it's hidden.
const FALLBACK_SIZE = { width: 600, height: 300 }

/**
 * What every chart with an x and a y axis has: data, a size, a margin, the
 * plot area they leave, and a y scale that fits the values of its series.
 * Line and bar charts extend it and provide themselves under it, so the axes,
 * the grid and the series inject it to know where to draw, whichever chart
 * they're in. The way `MatTable` extends `CdkTable`.
 *
 * Inject it in a layer of your own ({@link MiraChartLayer}) to draw where the
 * chart's series are.
 *
 * Its colors are CSS custom properties, to set anywhere above the chart:
 *
 * - `--mira-axis-color`: the axes' lines and labels;
 * - `--mira-grid-color`: the grid;
 * - `--mira-cursor-color`: the vertical line at the datum under the pointer;
 * - `--mira-background`: what's behind the chart, for the ring around a dot
 *   under the pointer. The page's by default: set it where the chart sits on
 *   a card of another color.
 *
 * Unset, they suit the page's `color-scheme`: light by default, dark where the
 * page sets `color-scheme: dark`, and the system's with `light dark`. A line's
 * own color is its `stroke`.
 */
@Directive({
  host: {
    '[style.display]': '"block"',
    // Fills a container that has a height. In one without, the chart is as
    // tall as it draws itself.
    '[style.height]': 'height() === undefined ? "100%" : null',
  },
})
export abstract class MiraCartesianChart {
  /** The rows to plot. */
  readonly data = input<readonly ChartDatum[]>([])
  /** The width in px. Without it, the chart is as wide as its container. */
  readonly width = input<number | undefined, unknown>(undefined, {
    transform: optionalNumber,
  })

  /**
   * The height in px. Without it, the chart is as tall as its container, or
   * 300px in a container without a height.
   */
  readonly height = input<number | undefined, unknown>(undefined, {
    transform: optionalNumber,
  })

  /** Overrides some sides of the default margin. */
  readonly margin = input<Partial<ChartMargin>>({})
  /** What the chart shows, for screen readers. */
  readonly ariaLabel = input<string>()

  /** The size the chart draws at, in px: its inputs, or its container's. */
  readonly size = computed(() => {
    const measured = this.#measured()

    // A size of 0 means the chart is hidden, or its container has no height:
    // drawing at 0 would keep it at 0 once it shows.
    return {
      width: this.width() ?? (measured?.width || FALLBACK_SIZE.width),
      height: this.height() ?? (measured?.height || FALLBACK_SIZE.height),
    }
  })

  readonly plot = computed<PlotArea>(() => {
    const { width, height } = this.size()
    const margin = { ...DEFAULT_MARGIN, ...this.margin() }
    const left = margin.left + (this.yAxis()?.width() ?? 0)
    const bottom = margin.bottom + (this.xAxis()?.height() ?? 0)

    return {
      left,
      top: margin.top,
      width: Math.max(0, width - left - margin.right),
      height: Math.max(0, height - margin.top - bottom),
    }
  })

  /** Maps a value to its y. */
  readonly yScale = computed(() => {
    const { top, height } = this.plot()

    return linearScale(this.#yNice().domain, [top + height, top])
  })

  /** Round values over the y scale, for the y axis and the grid to mark. */
  readonly yTicks = computed<readonly Tick[]>(() => {
    const scale = this.yScale()

    return this.#yNice().ticks.map((value) => ({ value, offset: scale(value) }))
  })

  /**
   * The index of the datum nearest the pointer along x, or null while the
   * pointer is off the plot.
   */
  readonly activeIndex = computed(() => this.#activeIndex())

  /** The x of each datum, in the order of the data. */
  abstract readonly xPositions: Signal<readonly number[]>

  /** What the chart draws, in the order it's written. */
  protected readonly layers = contentChildren(MiraChartLayer)

  /** The keys of the values the y axis has to fit: one per series. */
  protected abstract readonly valueKeys: Signal<readonly string[]>
  /** The chart's x axis, if it has one: the plot leaves room for it. */
  protected abstract readonly xAxis: Signal<MiraXAxis | undefined>
  /** The chart's y axis, if it has one: the plot leaves room for it. */
  protected abstract readonly yAxis: Signal<MiraYAxis | undefined>
  /** The chart's svg, where the pointer is tracked. */
  protected abstract readonly svg: Signal<ElementRef<SVGSVGElement>>

  // The size of the chart's element, as the browser last laid it out.
  readonly #measured = signal<{ width: number; height: number } | null>(null)
  readonly #activeIndex = signal<number | null>(null)

  // The values of every series, and zero, rounded out to round ticks.
  readonly #yNice = computed(() => {
    const [min, max] = extentOf(this.data(), this.valueKeys()) ?? [0, 0]
    const count = this.yAxis()?.tickCount() ?? DEFAULT_TICK_COUNT

    return linearTicks([Math.min(0, min), Math.max(0, max)], count)
  })

  constructor() {
    const element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement
    const destroyRef = inject(DestroyRef)

    // In the browser only: on the server there's no layout to measure, and no
    // pointer.
    afterNextRender(() => {
      const observer = new ResizeObserver(([entry]) => {
        const { width, height } = entry.contentRect

        // Whole px, so a fraction of a px can't nudge the layout back and forth.
        this.#measured.set({
          width: Math.floor(width),
          height: Math.floor(height),
        })
      })

      observer.observe(element)

      // Listened to outside the template, where every event would check the
      // chart again: here, a pointer moving about the same datum changes
      // nothing.
      const svg = this.svg().nativeElement
      const listening = new AbortController()
      const track = (event: PointerEvent): void =>
        this.#activeIndex.set(this.#indexAt(event))

      svg.addEventListener('pointermove', track, listening)
      svg.addEventListener('pointerdown', track, listening)
      svg.addEventListener(
        'pointerleave',
        () => this.#activeIndex.set(null),
        listening,
      )

      destroyRef.onDestroy(() => {
        observer.disconnect()
        listening.abort()
      })
    })
  }

  // The datum nearest the pointer along x, if the pointer is on the plot.
  #indexAt(event: PointerEvent): number | null {
    const matrix = this.svg().nativeElement.getScreenCTM()

    if (!matrix) return null

    // The pointer in the svg's own px, whatever scales the svg on the page.
    const { x, y } = new DOMPoint(event.clientX, event.clientY).matrixTransform(
      matrix.inverse(),
    )
    const { left, top, width, height } = this.plot()
    const onPlot =
      x >= left && x <= left + width && y >= top && y <= top + height

    return onPlot ? nearestIndex(this.xPositions(), x) : null
  }
}

// Takes `width="640"` as well as `[width]="640"`, and no value at all.
function optionalNumber(value: unknown): number | undefined {
  return value == null || value === '' ? undefined : numberAttribute(value)
}
