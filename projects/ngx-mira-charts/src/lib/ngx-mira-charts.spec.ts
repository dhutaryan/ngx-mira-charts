import { provideZonelessChangeDetection } from '@angular/core'
import { type ComponentFixture, TestBed } from '@angular/core/testing'

import { NgxMiraCharts } from './ngx-mira-charts'

describe('NgxMiraCharts', () => {
  let component: NgxMiraCharts
  let fixture: ComponentFixture<NgxMiraCharts>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgxMiraCharts],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents()

    fixture = TestBed.createComponent(NgxMiraCharts)
    component = fixture.componentInstance
    await fixture.whenStable()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
