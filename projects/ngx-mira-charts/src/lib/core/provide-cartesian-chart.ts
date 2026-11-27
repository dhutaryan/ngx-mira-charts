import type { Provider, Type } from '@angular/core'

import { MiraCartesianChart } from './cartesian-chart'
import { CartesianContext } from './cartesian-context'

/**
 * The providers of a kind of cartesian chart: under `MiraCartesianChart`, for
 * layers of your own, and under the context the library's layers inject.
 * Every kind of chart lists them, given `forwardRef(() => TheChart)`:
 * providers aren't inherited.
 *
 * @internal
 */
export function provideCartesianChart(
  chart: Type<MiraCartesianChart>,
): Provider[] {
  return [
    { provide: MiraCartesianChart, useExisting: chart },
    { provide: CartesianContext, useExisting: chart },
  ]
}
