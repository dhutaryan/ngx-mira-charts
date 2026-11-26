/**
 * One row of a chart's data. Axes and series read their values from it by
 * key, so any object will do: `{ month: 'Jan', sales: 120 }`.
 */
export type ChartDatum = object

/** The room between the edges of a chart and what it draws, in px. */
export type ChartMargin = {
  top: number
  right: number
  bottom: number
  left: number
}
