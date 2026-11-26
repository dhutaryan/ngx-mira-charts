import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  forwardRef,
  inject,
  input,
} from '@angular/core'

import { MiraCartesianChart } from '../core/cartesian-chart'
import { MiraChartLayer } from '../core/chart-layer'
import { numberAt } from '../core/data'
import { type Point, linePath } from '../core/path'

/**
 * A line through the values under `dataKey`, a point per datum, with a dot on
 * each value. Where a datum has no number under the key, the line breaks; a
 * value alone between two gaps shows as its dot.
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
              r="3"
              [attr.cx]="point.x"
              [attr.cy]="point.y"
              [attr.stroke]="stroke()"
            />
          }
        }
      </svg:g>
    </ng-template>
  `,
  styles: `
    .mira-line-curve {
      fill: none;
      stroke-width: 2;
    }

    .mira-line-dot {
      fill: var(--mira-dot-fill, #fff);
      stroke-width: 1.5;
    }
  `,
})
export class MiraLine extends MiraChartLayer {
  /** The key of the values to plot. */
  readonly dataKey = input.required<string>()
  readonly stroke = input('#3182bd')
  /** Whether to mark each value with a dot. */
  readonly dot = input(true, { transform: booleanAttribute })

  protected readonly path = computed(() => linePath(this.#points()))
  protected readonly dots = computed(() =>
    this.#points().filter((point) => point !== null),
  )

  readonly #chart = inject(MiraCartesianChart)
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
