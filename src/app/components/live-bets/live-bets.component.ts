import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { BackendService, Bet } from 'src/app/services/backend/backend.service';
import { SpinnerService } from 'src/app/services/spinner/spinner.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-live-bets',
  templateUrl: './live-bets.component.html',
  styleUrls: ['./live-bets.component.scss'],
})
export class LiveBetsComponent implements OnInit {
  liveBets$: Observable<Bet[]>;
  constructor(private api: BackendService, private spinner: SpinnerService) {
    this.spinner.turnOn();
    this.liveBets$ = this.api.getLiveBets().pipe(
      tap(() => {
        this.spinner.turnOff();
      })
    );
  }

  ngOnInit(): void {}

  getImg(team: string): string {
    return `assets/nfl_logos/${team}.png`;
  }

  stripDomain(email: string): string {
    return email.replace(/@.+$/, '');
  }
}
