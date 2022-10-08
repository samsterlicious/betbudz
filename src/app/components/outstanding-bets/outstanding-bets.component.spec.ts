import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OutstandingBetsComponent } from './outstanding-bets.component';

describe('OutstandingBetsComponent', () => {
  let component: OutstandingBetsComponent;
  let fixture: ComponentFixture<OutstandingBetsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OutstandingBetsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OutstandingBetsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
