import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Observable } from 'rxjs';
import { BetUser, UserStore } from './store/user.store';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  auth0User$: Observable<BetUser>;
  title = 'BetBuds';
  constructor(userStore: UserStore) {
    this.auth0User$ = userStore.auth0User$;
  }
}
