import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LiveBetsComponent } from './live-bets.component';

describe('LiveBetsComponent', () => {
  let component: LiveBetsComponent;
  let fixture: ComponentFixture<LiveBetsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LiveBetsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LiveBetsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
