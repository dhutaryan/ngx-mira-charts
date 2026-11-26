import {
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  inject,
  input,
} from '@angular/core'

import { CartesianChart } from '../core/cartesian-chart'
import { ChartLayer } from '../core/chart-layer'
import { numberAt } from '../core/data'
import { type Point, linePath } from '../core/path'

/**
 * A line through the values under `dataKey`, a point per datum. Where a datum
 * has no number under the key, the line breaks.
 *
 * @example
 * ```html
 * <mira-line dataKey="revenue" stroke="#8884d8" />
 * ```
 */
@Component({
  selector: 'mira-line',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: ChartLayer, useExisting: forwardRef(() => MiraLine) }],
  template: `
    <ng-template>
      <svg:path class="mira-line" [attr.d]="path()" [attr.stroke]="stroke()" />
    </ng-template>
  `,
  styles: `
    .mira-line {
      fill: none;
      stroke-width: 2;
    }
  `,
})
export class MiraLine extends ChartLayer {
  /** The key of the values to plot. */
  readonly dataKey = input.required<string>()
  readonly stroke = input('#3182bd')

  protected readonly path = computed(() => linePath(this.#points()))

  readonly #chart = inject(CartesianChart)
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
