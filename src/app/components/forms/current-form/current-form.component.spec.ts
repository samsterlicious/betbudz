import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CurrentFormComponent } from './current-form.component';

describe('CurrentFormComponent', () => {
  let component: CurrentFormComponent;
  let fixture: ComponentFixture<CurrentFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CurrentFormComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CurrentFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
