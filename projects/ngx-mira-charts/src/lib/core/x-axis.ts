import {
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  inject,
  input,
  numberAttribute,
} from '@angular/core'

import { MiraCartesianChart } from './cartesian-chart'
import { MiraChartLayer } from './chart-layer'
import { valueAt } from './data'

/**
 * The category axis under the plot: a tick per datum, labelled with the
 * datum's value under `dataKey`.
 *
 * @example
 * ```html
 * <mira-x-axis dataKey="month" />
 * ```
 */
@Component({
  selector: 'mira-x-axis',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: MiraChartLayer, useExisting: forwardRef(() => MiraXAxis) },
  ],
  template: `
    <ng-template>
      <svg:g class="mira-x-axis">
        <svg:line
          [attr.x1]="chart.plot().left"
          [attr.x2]="chart.plot().left + chart.plot().width"
          [attr.y1]="y()"
          [attr.y2]="y()"
        />
        @for (tick of ticks(); track $index) {
          <svg:g
            [attr.transform]="'translate(' + tick.offset + ',' + y() + ')'"
          >
            <svg:line y2="6" />
            <svg:text y="9" dy="0.71em" text-anchor="middle">
              {{ tick.label }}
            </svg:text>
          </svg:g>
        }
      </svg:g>
    </ng-template>
  `,
  styles: `
    .mira-x-axis {
      font-size: 12px;
    }

    line {
      stroke: var(--mira-axis-color, #666);
    }

    text {
      fill: var(--mira-axis-color, #666);
    }
  `,
})
export class MiraXAxis extends MiraChartLayer {
  /** The key of each datum's category. Without one, the ticks show indexes. */
  readonly dataKey = input<string>()
  /** The room the axis takes under the plot, in px. */
  readonly height = input(30, { transform: numberAttribute })

  protected readonly chart = inject(MiraCartesianChart)
  protected readonly y = computed(
    () => this.chart.plot().top + this.chart.plot().height,
  )

  protected readonly ticks = computed(() => {
    const key = this.dataKey()
    const xs = this.chart.xPositions()

    return this.chart.data().map((datum, index) => ({
      offset: xs[index],
      label:
        key === undefined ? String(index) : String(valueAt(datum, key) ?? ''),
    }))
  })
}
