import { NgTemplateOutlet } from '@angular/common'
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  contentChildren,
  forwardRef,
} from '@angular/core'

import { MiraCartesianChart } from '../core/cartesian-chart'
import { pointPositions } from '../core/scale'
import { CHART_THEME } from '../core/theme'
import { MiraXAxis } from '../core/x-axis'
import { MiraYAxis } from '../core/y-axis'
import { MiraLine } from './line'

/**
 * A chart of lines over categories. What's in it comes as content, drawn in
 * the order it's written.
 *
 * @example
 * ```html
 * <mira-line-chart [data]="sales">
 *   <mira-line dataKey="revenue" stroke="#8884d8" />
 *   <mira-line dataKey="costs" stroke="#82ca9d" />
 * </mira-line-chart>
 * ```
 */
@Component({
  selector: 'mira-line-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet],
  providers: [
    {
      provide: MiraCartesianChart,
      useExisting: forwardRef(() => MiraLineChart),
    },
  ],
  template: `
    <svg
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
  `,
  styles: [
    CHART_THEME,
    `
      svg {
        display: block;
      }
    `,
  ],
})
export class MiraLineChart extends MiraCartesianChart {
  /** A point per datum, from edge to edge of the plot. */
  override readonly xPositions = computed(() => {
    const { left, width } = this.plot()

    return pointPositions(this.data().length, [left, left + width])
  })

  protected readonly lines = contentChildren(MiraLine)
  protected override readonly valueKeys = computed(() =>
    this.lines().map((line) => line.dataKey()),
  )

  protected override readonly xAxis = contentChild(MiraXAxis)
  protected override readonly yAxis = contentChild(MiraYAxis)

  protected readonly viewBox = computed(() => {
    const { width, height } = this.size()

    return `0 0 ${width} ${height}`
  })
}
