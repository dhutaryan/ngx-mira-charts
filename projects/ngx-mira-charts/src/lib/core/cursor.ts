import {
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  inject,
} from '@angular/core'

import { CartesianContext } from './cartesian-context'
import { MiraChartLayer } from './chart-layer'

/**
 * A vertical line across the plot at the datum under the pointer. Write it
 * after the grid and before the series, so it's drawn between them.
 *
 * @example
 * ```html
 * <mira-line-chart [data]="sales">
 *   <mira-cartesian-grid />
 *   <mira-cursor />
 *   <mira-line dataKey="revenue" />
 * </mira-line-chart>
 * ```
 */
@Component({
  selector: 'mira-cursor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: MiraChartLayer, useExisting: forwardRef(() => MiraCursor) },
  ],
  template: `
    <ng-template>
      @if (line(); as at) {
        <svg:line
          class="mira-cursor"
          [attr.x1]="at.x"
          [attr.x2]="at.x"
          [attr.y1]="at.top"
          [attr.y2]="at.bottom"
        />
      }
    </ng-template>
  `,
  styles: `
    .mira-cursor {
      stroke: var(--_mira-cursor-color);
    }
  `,
})
export class MiraCursor extends MiraChartLayer {
  // Where the line goes, while the pointer is on the plot.
  protected readonly line = computed(() => {
    const index = this.#chart.activeIndex()

    if (index === null) return null

    const x = this.#chart.xPositions()[index]

    if (x === undefined) return null

    const { top, height } = this.#chart.plot()

    return { x, top, bottom: top + height }
  })

  readonly #chart = inject(CartesianContext)
}
