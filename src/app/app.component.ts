import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Observable } from 'rxjs';
import { BetUser, UserStore } from './store/user.store';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  auth0User$: Observable<BetUser>;

  constructor(userStore: UserStore, private title: Title) {
    this.auth0User$ = userStore.auth0User$;
  }

  ngOnInit() {
    this.title.setTitle('BetBuds');
  }
}
