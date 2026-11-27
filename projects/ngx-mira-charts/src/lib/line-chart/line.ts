import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  forwardRef,
  inject,
  input,
} from '@angular/core'

import { CartesianContext } from '../core/cartesian-context'
import { MiraChartLayer } from '../core/chart-layer'
import { numberAt } from '../core/data'
import { type LineCurve, type Point, linePath } from '../core/path'
import { MiraSeries } from '../core/series'

/**
 * A line through the values under `dataKey`, a point per datum, with a dot on
 * each value and a bigger one, in a halo, on the value under the pointer.
 * Where a datum has no number under the key, the line breaks; a value alone
 * between two gaps shows as its dot.
 *
 * @example
 * ```html
 * <mira-line dataKey="revenue" stroke="#8884d8" />
 * ```
 */
@Component({
  selector: 'mira-line',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: MiraChartLayer, useExisting: forwardRef(() => MiraLine) },
    { provide: MiraSeries, useExisting: forwardRef(() => MiraLine) },
  ],
  template: `
    <ng-template>
      <svg:g class="mira-line">
        <svg:path
          class="mira-line-curve"
          [attr.d]="path()"
          [attr.stroke]="stroke()"
        />
        @if (dot()) {
          @for (point of dots(); track $index) {
            <svg:circle
              class="mira-line-dot"
              r="4"
              [attr.cx]="point.x"
              [attr.cy]="point.y"
              [attr.fill]="stroke()"
            />
          }
        }
        @if (activePoint(); as point) {
          <svg:circle
            class="mira-line-halo"
            r="10"
            [attr.cx]="point.x"
            [attr.cy]="point.y"
            [attr.fill]="stroke()"
          />
          <svg:circle
            class="mira-line-active-dot"
            r="6"
            [attr.cx]="point.x"
            [attr.cy]="point.y"
            [attr.fill]="stroke()"
          />
        }
      </svg:g>
    </ng-template>
  `,
  styles: `
    .mira-line-curve {
      fill: none;
      stroke-width: 2;
    }

    .mira-line-halo {
      fill-opacity: 0.25;
    }

    .mira-line-active-dot {
      stroke: var(--_mira-background);
      stroke-width: 2;
    }
  `,
})
export class MiraLine extends MiraSeries {
  readonly stroke = input('#3182bd')
  /** How the line goes from one value to the next. */
  readonly curve = input<LineCurve>('linear')
  /** Whether to mark each value with a dot. */
  readonly dot = input(true, { transform: booleanAttribute })
  /** Whether to mark the value under the pointer with a bigger dot, in a halo. */
  readonly activeDot = input(true, { transform: booleanAttribute })

  protected readonly path = computed(() =>
    linePath(this.#points(), this.curve()),
  )

  protected readonly dots = computed(() =>
    this.#points().filter((point) => point !== null),
  )

  // The point under the pointer, if the line has a value there.
  protected readonly activePoint = computed(() => {
    if (!this.activeDot()) return null

    const index = this.#chart.activeIndex()

    if (index === null) return null

    return this.#points()[index] ?? null
  })

  readonly #chart = inject(CartesianContext)
  // A point per datum, or null where the datum has no value to plot.
  readonly #points = computed<ReadonlyArray<Point | null>>(() => {
    const key = this.dataKey()
    const xs = this.#chart.xPositions()
    const y = this.#chart.yScale()

    return this.#chart.data().map((datum, index) => {
      const value = numberAt(datum, key)

      return value === null ? null : { x: xs[index], y: y(value) }
    })
  })
}
