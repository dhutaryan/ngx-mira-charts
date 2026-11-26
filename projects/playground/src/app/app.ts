import { ChangeDetectionStrategy, Component, signal } from '@angular/core'
import { MiraLine, MiraLineChart, MiraXAxis, MiraYAxis } from 'ngx-mira-charts'

type Visits = {
  name: string
  uv: number
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
  imports: [MiraLineChart, MiraLine, MiraXAxis, MiraYAxis],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected readonly data = signal<readonly Visits[]>(SAMPLE)
  protected readonly showPv = signal(true)

  protected randomize(): void {
    this.data.update((rows) =>
      rows.map((row) => ({ ...row, uv: randomCount(), pv: randomCount() })),
    )
  }
}
