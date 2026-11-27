import {
  ChangeDetectionStrategy,
  Component,
  LOCALE_ID,
  computed,
  forwardRef,
  inject,
  input,
  numberAttribute,
} from '@angular/core'

import { MiraChartLayer } from '../chart-layer'
import {
  CartesianContext,
  DEFAULT_TICK_COUNT,
  type Tick,
} from './cartesian-context'

/**
 * The value axis left of the plot. It fits the values of every series in the
 * chart, and zero, rounded out to round ticks. The ticks read as numbers in
 * the app's locale (`LOCALE_ID`).
 *
 * @example
 * ```html
 * <mira-y-axis [tickCount]="4" />
 * ```
 */
@Component({
  selector: 'mira-y-axis',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: MiraChartLayer, useExisting: forwardRef(() => MiraYAxis) },
  ],
  template: `
    <ng-template>
      <svg:g class="mira-y-axis">
        <svg:line
          [attr.x1]="x()"
          [attr.x2]="x()"
          [attr.y1]="chart.plot().top"
          [attr.y2]="chart.plot().top + chart.plot().height"
        />
        @for (tick of ticks(); track tick.value) {
          <svg:g
            [attr.transform]="'translate(' + x() + ',' + tick.offset + ')'"
          >
            <svg:line x2="-6" />
            <svg:text x="-9" dy="0.32em" text-anchor="end">
              {{ tick.label }}
            </svg:text>
          </svg:g>
        }
      </svg:g>
    </ng-template>
  `,
  styles: `
    .mira-y-axis {
      font-size: 12px;
    }

    line {
      stroke: var(--_mira-axis-color);
    }

    text {
      fill: var(--_mira-axis-color);
    }
  `,
})
export class MiraYAxis extends MiraChartLayer {
  /** The room the axis takes left of the plot, in px. */
  readonly width = input(60, { transform: numberAttribute })
  /** About how many ticks to show: the axis picks round values near it. */
  readonly tickCount = input(DEFAULT_TICK_COUNT, {
    transform: numberAttribute,
  })

  protected readonly chart = inject(CartesianContext)
  protected readonly x = computed(() => this.chart.plot().left)
  protected readonly ticks = computed(() => {
    const ticks = this.chart.yTicks()
    const format = this.#format(ticks)

    return ticks.map((tick) => ({ ...tick, label: format(tick.value) }))
  })

  readonly #locale = inject(LOCALE_ID)

  // As many decimals as the step between the ticks has: 2,000 but 0.5.
  #format(ticks: readonly Tick[]): (value: number) => string {
    const step =
      ticks.length > 1 ? Math.abs(ticks[1].value - ticks[0].value) : 1
    const digits = Math.max(0, -Math.floor(Math.log10(step)))
    const format = new Intl.NumberFormat(this.#locale, {
      maximumFractionDigits: digits,
    })

    return (value) => format.format(value)
  }
}
