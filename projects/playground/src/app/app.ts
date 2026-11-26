import { ChangeDetectionStrategy, Component } from '@angular/core'
import { NgxMiraCharts } from 'ngx-mira-charts'

@Component({
  selector: 'app-root',
  imports: [NgxMiraCharts],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
