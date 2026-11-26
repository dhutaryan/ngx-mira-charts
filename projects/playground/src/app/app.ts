import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core'
import {
  type LineCurve,
  MiraCartesianGrid,
  MiraLine,
  MiraLineChart,
  MiraXAxis,
  MiraYAxis,
} from 'ngx-mira-charts'

import { AverageLine } from './average-line'

type Visits = {
  name: string
  uv: number | null
  pv: number
}

const SAMPLE: readonly Visits[] = [
  { name: 'Page A', uv: 4000, pv: 2400 },
  { name: 'Page B', uv: 3000, pv: 1398 },
  { name: 'Page C', uv: 2000, pv: 9800 },
  { name: 'Page D', uv: 2780, pv: 3908 },
  { name: 'Page E', uv: 1890, pv: 4800 },
  { name: 'Page F', uv: 2390, pv: 3800 },
  { name: 'Page G', uv: 3490, pv: 4300 },
]

function randomCount(): number {
  return Math.round(Math.random() * 10_000)
}

@Component({
  selector: 'app-root',
  imports: [
    MiraLineChart,
    MiraCartesianGrid,
    MiraXAxis,
    MiraYAxis,
    MiraLine,
    AverageLine,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected readonly visits = signal<readonly Visits[]>(SAMPLE)
  protected readonly showPv = signal(true)
  protected readonly dots = signal(true)
  protected readonly gaps = signal(false)
  protected readonly curve = signal<LineCurve>('linear')
  protected readonly dark = signal(false)

  /** With gaps on, every third uv goes missing, and the line breaks there. */
  protected readonly data = computed(() =>
    this.gaps()
      ? this.visits().map((row, index) =>
          index % 3 === 1 ? { ...row, uv: null } : row,
        )
      : this.visits(),
  )

  constructor() {
    const root = inject(DOCUMENT).documentElement

    // The charts take their colors from the page's color scheme.
    effect(() => {
      root.style.colorScheme = this.dark() ? 'dark' : 'light'
    })
  }

  protected randomize(): void {
    this.visits.update((rows) =>
      rows.map((row) => ({ ...row, uv: randomCount(), pv: randomCount() })),
    )
  }
}
