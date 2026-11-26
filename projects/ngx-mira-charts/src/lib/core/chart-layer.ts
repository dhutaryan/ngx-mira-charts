import { Directive, TemplateRef, viewChild } from '@angular/core'

/**
 * Something a chart draws in its svg: a line, an axis, the grid. A layer is an
 * element of its own in the chart's content (`<mira-line>`) and renders
 * nothing where it's written. Its template holds what it draws, and the chart
 * renders that into its svg, in the order the layers are written: the first
 * one ends up at the bottom.
 *
 * A layer extends this class and provides itself under it, so the chart finds
 * every kind of layer with one query, in order.
 *
 * @internal
 */
@Directive()
export abstract class ChartLayer {
  /** What the layer draws: the first `<ng-template>` in its own template. */
  readonly template = viewChild(TemplateRef)
}
