import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  forwardRef,
  inject,
  input,
} from '@angular/core'

import { MiraCartesianChart } from './cartesian-chart'
import { MiraChartLayer } from './chart-layer'

/**
 * Grid lines across the plot: across at the ticks of the y scale, and down
 * at each datum. Write it before the series, so they're drawn over it.
 *
 * @example
 * ```html
 * <mira-cartesian-grid strokeDasharray="3 3" [vertical]="false" />
 * ```
 */
@Component({
  selector: 'mira-cartesian-grid',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: MiraChartLayer,
      useExisting: forwardRef(() => MiraCartesianGrid),
    },
  ],
  template: `
    <ng-template>
      <svg:g
        class="mira-cartesian-grid"
        [attr.stroke-dasharray]="strokeDasharray() ?? null"
      >
        @if (horizontal()) {
          @for (tick of chart.yTicks(); track tick.value) {
            <svg:line
              [attr.x1]="chart.plot().left"
              [attr.x2]="chart.plot().left + chart.plot().width"
              [attr.y1]="tick.offset"
              [attr.y2]="tick.offset"
            />
          }
        }
        @if (vertical()) {
          @for (x of chart.xPositions(); track $index) {
            <svg:line
              [attr.x1]="x"
              [attr.x2]="x"
              [attr.y1]="chart.plot().top"
              [attr.y2]="chart.plot().top + chart.plot().height"
            />
          }
        }
      </svg:g>
    </ng-template>
  `,
  styles: `
    line {
      stroke: var(--_mira-grid-color);
    }
  `,
})
export class MiraCartesianGrid extends MiraChartLayer {
  /** Lines across, at the ticks of the y scale. */
  readonly horizontal = input(true, { transform: booleanAttribute })
  /** Lines down, at each datum. */
  readonly vertical = input(true, { transform: booleanAttribute })
  /** Dashes the lines, as the svg attribute does: `"3 3"`. */
  readonly strokeDasharray = input<string>()

  protected readonly chart = inject(MiraCartesianChart)
}
