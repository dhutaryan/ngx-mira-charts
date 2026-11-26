import {
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  inject,
  input,
} from '@angular/core'
import { MiraCartesianChart, MiraChartLayer } from 'ngx-mira-charts'

/**
 * A layer of the playground's own, to try layers from outside the library: a
 * dashed line across the plot at the average of the values under `dataKey`.
 */
@Component({
  selector: 'app-average-line',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: MiraChartLayer, useExisting: forwardRef(() => AverageLine) },
  ],
  template: `
    <ng-template>
      <svg:g class="average-line">
        <svg:line
          [attr.x1]="chart.plot().left"
          [attr.x2]="chart.plot().left + chart.plot().width"
          [attr.y1]="y()"
          [attr.y2]="y()"
        />
        <svg:text
          dy="-4"
          text-anchor="end"
          [attr.x]="chart.plot().left + chart.plot().width"
          [attr.y]="y()"
        >
          {{ label() }}
        </svg:text>
      </svg:g>
    </ng-template>
  `,
  styles: `
    line {
      stroke: #d4a72c;
      stroke-dasharray: 6 4;
    }

    text {
      fill: #9a6700;
      font-size: 12px;
    }
  `,
})
export class AverageLine extends MiraChartLayer {
  readonly dataKey = input.required<string>()

  protected readonly chart = inject(MiraCartesianChart)
  protected readonly average = computed(() => {
    const key = this.dataKey()
    const values = this.chart
      .data()
      .map((row) => (row as Record<string, unknown>)[key])
      .filter((value): value is number => typeof value === 'number')

    return (
      values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length)
    )
  })

  protected readonly y = computed(() => this.chart.yScale()(this.average()))
  protected readonly label = computed(
    () => `avg ${this.dataKey()}: ${Math.round(this.average())}`,
  )
}
