import { Directive, TemplateRef, viewChild } from '@angular/core'

/**
 * Something a chart draws in its svg: a line, an axis, the grid, or a layer
 * of your own. A layer is an element of its own in the chart's content and
 * renders nothing where it's written: the chart renders the layer's
 * `<ng-template>` into its svg, in the order the layers are written, so the
 * first one ends up at the bottom.
 *
 * To draw a layer of your own, extend this class, provide your component
 * under it, and put what it draws in an `<ng-template>`, as `svg:` elements.
 * Inject {@link MiraCartesianChart} for the plot area and the scales.
 *
 * @example
 * ```ts
 * @Component({
 *   selector: 'app-target',
 *   providers: [
 *     { provide: MiraChartLayer, useExisting: forwardRef(() => Target) },
 *   ],
 *   template: `
 *     <ng-template>
 *       <svg:line [attr.y1]="y()" [attr.y2]="y()" … />
 *     </ng-template>
 *   `,
 * })
 * export class Target extends MiraChartLayer {
 *   readonly value = input.required<number>()
 *
 *   protected readonly y = computed(() => this.#chart.yScale()(this.value()))
 *
 *   readonly #chart = inject(MiraCartesianChart)
 * }
 * ```
 */
@Directive()
export abstract class MiraChartLayer {
  /** What the layer draws: the first `<ng-template>` in its own template. */
  readonly template = viewChild(TemplateRef)
}
