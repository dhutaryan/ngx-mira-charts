import { NgTemplateOutlet } from '@angular/common'
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
} from '@angular/core'

import {
  CARTESIAN_CHART_STYLES,
  CARTESIAN_CHART_TEMPLATE,
  MiraCartesianChart,
} from '../core/cartesian-chart'
import { CartesianContext } from '../core/cartesian-context'
import { pointPositions } from '../core/scale'

/**
 * A chart of lines over categories, a point per datum. What's in it comes as
 * content, drawn in the order it's written, so the first one ends up at the
 * bottom.
 *
 * @example
 * ```html
 * <mira-line-chart [data]="sales">
 *   <mira-cartesian-grid />
 *   <mira-x-axis dataKey="month" />
 *   <mira-y-axis />
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
    { provide: CartesianContext, useExisting: forwardRef(() => MiraLineChart) },
  ],
  template: CARTESIAN_CHART_TEMPLATE,
  styles: CARTESIAN_CHART_STYLES,
})
export class MiraLineChart extends MiraCartesianChart {
  /** A point per datum, from edge to edge of the plot. */
  override readonly xPositions = computed(() => {
    const { left, width } = this.plot()

    return pointPositions(this.data().length, [left, left + width])
  })
}
