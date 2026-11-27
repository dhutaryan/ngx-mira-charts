import { Directive, input } from '@angular/core'

import { MiraChartLayer } from './chart-layer'

/**
 * A layer that plots the values under a key of the chart's data: a line now,
 * bars and areas later. The chart fits its y axis to the values of all its
 * series, whatever kind they are.
 *
 * A series extends this class, and provides itself under it as well as under
 * {@link MiraChartLayer}.
 */
@Directive()
export abstract class MiraSeries extends MiraChartLayer {
  /** The key of the values to plot. */
  readonly dataKey = input.required<string>()
}
