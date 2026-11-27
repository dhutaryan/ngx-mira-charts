import {
  DestroyRef,
  Directive,
  ElementRef,
  type Signal,
  afterNextRender,
  computed,
  contentChild,
  contentChildren,
  inject,
  input,
  numberAttribute,
  signal,
  viewChild,
} from '@angular/core'

import {
  type CartesianContext,
  DEFAULT_TICK_COUNT,
  type PlotArea,
  type Tick,
} from './cartesian-context'
import { MiraChartLayer } from './chart-layer'
import { extentOf } from './data'
import type { Point } from './path'
import { linearScale, linearTicks, nearestIndex } from './scale'
import { MiraSeries } from './series'
import { CHART_THEME } from './theme'
import type { ChartDatum, ChartMargin } from './types'
import { MiraXAxis } from './x-axis'
import { MiraYAxis } from './y-axis'

/**
 * The template of every chart with an x and a y axis: an svg with the
 * chart's layers in it, in the order they're written. A chart that takes it
 * imports `NgTemplateOutlet`.
 *
 * @internal
 */
export const CARTESIAN_CHART_TEMPLATE = `
  <svg
    #svg
    role="img"
    [attr.width]="size().width"
    [attr.height]="size().height"
    [attr.viewBox]="viewBox()"
    [attr.aria-label]="ariaLabel() ?? null"
  >
    @for (layer of layers(); track layer) {
      <ng-container [ngTemplateOutlet]="layer.template() ?? null" />
    }
  </svg>
`

/**
 * The styles of every chart with an x and a y axis, its theme among them.
 *
 * @internal
 */
export const CARTESIAN_CHART_STYLES = [
  CHART_THEME,
  `
    svg {
      display: block;
    }
  `,
]

type Size = { readonly width: number; readonly height: number }

const DEFAULT_MARGIN: ChartMargin = { top: 10, right: 20, bottom: 10, left: 10 }

// The size a chart draws at until it can measure its container: on the
// server, in the browser's first frame, and while it's hidden.
const FALLBACK_SIZE: Size = { width: 600, height: 300 }

/**
 * What every chart with an x and a y axis has, whatever its series: data, a
 * size, a margin, the plot area they leave, a y scale that fits the values of
 * its series, and the datum under the pointer. Nothing about a kind of chart:
 * a line chart extends it with a point per datum along x, a bar chart will
 * with a band per datum, and with how its bars share a band.
 *
 * Inject it in a layer of your own ({@link MiraChartLayer}) to draw where the
 * series are.
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
export abstract class MiraCartesianChart implements CartesianContext {
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
  readonly size = computed<Size>(
    () => {
      const measured = this.#measured()

      // A size of 0 means the chart is hidden, or its container has no height:
      // drawing at 0 would keep it at 0 once it shows.
      return {
        width: this.width() ?? (measured?.width || FALLBACK_SIZE.width),
        height: this.height() ?? (measured?.height || FALLBACK_SIZE.height),
      }
    },
    { equal: sameSize },
  )

  /** Where the series are drawn: the chart less its margin and its axes. */
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
   * pointer is off the plot. It follows the data and the size as they change
   * under a pointer that stays put.
   */
  readonly activeIndex = computed(() => {
    const pointer = this.#pointer()

    if (!pointer) return null

    const { left, top, width, height } = this.plot()
    const onPlot =
      pointer.x >= left &&
      pointer.x <= left + width &&
      pointer.y >= top &&
      pointer.y <= top + height

    if (!onPlot) return null

    return nearestIndex(this.xPositions(), pointer.x)
  })

  /** The x of each datum, in the order of the data: the kind of chart's call. */
  abstract readonly xPositions: Signal<readonly number[]>

  /** What the chart draws, in the order it's written. */
  protected readonly layers = contentChildren(MiraChartLayer)
  /** The series, of whatever kind: the y axis fits all their values. */
  protected readonly series = contentChildren(MiraSeries)
  /** The chart's axes, if it has them: the plot leaves room for them. */
  protected readonly xAxis = contentChild(MiraXAxis, { descendants: false })
  protected readonly yAxis = contentChild(MiraYAxis, { descendants: false })
  /** The chart's svg, where the pointer is tracked. */
  protected readonly svg = viewChild.required<ElementRef<SVGSVGElement>>('svg')

  protected readonly viewBox = computed(() => {
    const { width, height } = this.size()

    return `0 0 ${width} ${height}`
  })

  // The size of the chart's element, as the browser last laid it out.
  readonly #measured = signal<Size | null>(null, { equal: sameSize })
  // The pointer in the svg's own px, while it's over the svg.
  readonly #pointer = signal<Point | null>(null)

  // The values of every series, and zero, rounded out to round ticks.
  readonly #yNice = computed(() => {
    const keys = this.series().map((series) => series.dataKey())
    const [min, max] = extentOf(this.data(), keys) ?? [0, 0]
    const count = this.yAxis()?.tickCount() ?? DEFAULT_TICK_COUNT

    return linearTicks([Math.min(0, min), Math.max(0, max)], count)
  })

  constructor() {
    const element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement
    const destroyRef = inject(DestroyRef)

    // In the browser only: on the server there's no layout to measure, and no
    // pointer.
    afterNextRender(() => {
      const svg = this.svg().nativeElement
      // The pointer's last place on the page: the svg can move or resize
      // under a pointer that stays put.
      let client: Point | null = null

      const observer = new ResizeObserver(([entry]) => {
        const { width, height } = entry.contentRect

        // Whole px, so a fraction of a px can't nudge the layout back and forth.
        this.#measured.set({
          width: Math.floor(width),
          height: Math.floor(height),
        })

        if (client) this.#pointer.set(this.#inSvg(client))
      })

      // Listened to outside the template, where every event would check the
      // chart again: here, a pointer moving about the same datum re-runs no
      // template, as the active index doesn't change.
      const listening = new AbortController()
      const options = { signal: listening.signal }
      const track = (event: PointerEvent): void => {
        client = { x: event.clientX, y: event.clientY }
        this.#pointer.set(this.#inSvg(client))
      }
      const leave = (): void => {
        client = null
        this.#pointer.set(null)
      }

      observer.observe(element)
      svg.addEventListener('pointermove', track, options)
      svg.addEventListener('pointerdown', track, options)
      svg.addEventListener('pointerleave', leave, options)

      destroyRef.onDestroy(() => {
        observer.disconnect()
        listening.abort()
      })
    })
  }

  // A point on the page, in the svg's own px, whatever scales the svg there.
  #inSvg(client: Point): Point | null {
    const matrix = this.svg().nativeElement.getScreenCTM()

    if (!matrix) return null

    const { x, y } = new DOMPoint(client.x, client.y).matrixTransform(
      matrix.inverse(),
    )

    return { x, y }
  }
}

function sameSize(a: Size | null, b: Size | null): boolean {
  return a?.width === b?.width && a?.height === b?.height
}

// Takes `width="640"` as well as `[width]="640"`, and no value at all. A value
// that isn't a number, like `width="auto"`, counts as none.
function optionalNumber(value: unknown): number | undefined {
  if (value == null || value === '') return undefined

  const number = numberAttribute(value)

  return Number.isNaN(number) ? undefined : number
}
