import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SpinnerService {
  private readonly spinnerSubject = new BehaviorSubject<boolean>(false);
  isSpinning$ = this.spinnerSubject.asObservable();

  turnOn(): void {
    this.spinnerSubject.next(true);
  }

  turnOff(): void {
    this.spinnerSubject.next(false);
  }
}
