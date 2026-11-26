/**
 * Styles every chart takes: the colors its layers draw with, for a light page
 * and a dark one. The layers read the `--_mira-*` properties set here; an app
 * sets the `--mira-*` ones (see `MiraCartesianChart`).
 *
 * Browsers without `light-dark()` (Chrome before 123, Firefox before 120,
 * Safari before 17.5) take the light colors.
 *
 * @internal
 */
export const CHART_THEME = `
  :host {
    --_mira-axis-color: var(--mira-axis-color, #666);
    --_mira-grid-color: var(--mira-grid-color, #ccc);
    --_mira-background: var(--mira-background, #fff);
    --_mira-cursor-color: var(--mira-cursor-color, #999);
  }

  @supports (color: light-dark(#000, #fff)) {
    :host {
      --_mira-axis-color: var(--mira-axis-color, light-dark(#666, #999));
      --_mira-grid-color: var(--mira-grid-color, light-dark(#ccc, #333));
      --_mira-background: var(--mira-background, Canvas);
      --_mira-cursor-color: var(--mira-cursor-color, light-dark(#999, #666));
    }
  }
`
