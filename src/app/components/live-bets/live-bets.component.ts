import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { User } from '@auth0/auth0-angular';
import { combineLatest, Observable, tap } from 'rxjs';
import { BackendService, Bet } from 'src/app/services/backend/backend.service';
import { SpinnerService } from 'src/app/services/spinner/spinner.service';
import { UserStore } from 'src/app/store/user.store';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-live-bets',
  templateUrl: './live-bets.component.html',
  styleUrls: ['./live-bets.component.scss'],
})
export class LiveBetsComponent implements OnInit {
  viewModel$: Observable<ViewModel>;
  total = 0;

  constructor(
    private api: BackendService,
    private spinner: SpinnerService,
    private userService: UserStore
  ) {
    this.spinner.turnOn();

    this.viewModel$ = combineLatest({
      liveBets: this.api.getLiveBets().pipe(
        tap((bets) => {
          let total = 0;
          bets.forEach((bet) => {
            total += bet.amount;
          });
          this.total = total;
          this.spinner.turnOff();
        })
      ),
      user: userService.user$.pipe(tap((user) => console.log(user))),
    });
  }

  ngOnInit(): void {}

  stripDomain(email: string): string {
    return email.replace(/@.+$/, '');
  }

  getImg(bet: Bet, email: string, isMe: boolean): string {
    if (bet.personOne === email) {
      return isMe
        ? `assets/nfl_logos/${bet.personOneTeam}.png`
        : `assets/nfl_logos/${bet.personTwoTeam}.png`;
    } else {
      return isMe
        ? `assets/nfl_logos/${bet.personTwoTeam}.png`
        : `assets/nfl_logos/${bet.personOneTeam}.png`;
    }
  }

  getMe(bet: Bet, email: string, isMe: boolean, small: boolean): string {
    if (isMe) {
      return bet.personOne === email
        ? small
          ? bet.personOneTeam
          : this.api.getFullTeamName(bet.personOneTeam)
        : small
        ? bet.personTwoTeam
        : this.api.getFullTeamName(bet.personTwoTeam);
    } else {
      return bet.personOne === email
        ? bet.personTwo.replace(/@.+$/, '')
        : bet.personOne.replace(/@.+$/, '');
    }
  }

  getMySpread(bet: Bet, email: string): string {
    const gameInfo = bet.game.replace(/^[^#]+#([^#]+)#.+$/, '$1');
    const homeTeam = gameInfo.replace(/\w+\s+@\s+/, '');
    let spread = 0;
    if (bet.personOne === email) {
      if (bet.personOneTeam === homeTeam) {
        spread = parseInt(bet.spread) * -1;
      } else {
        spread = parseInt(bet.spread);
      }
    } else {
      if (bet.personOneTeam === homeTeam) {
        spread = parseInt(bet.spread);
      } else {
        spread = parseInt(bet.spread) * -1;
      }
    }

    return spread > 0 ? `+${spread}` : String(spread);
  }
}

type ViewModel = {
  liveBets: Bet[];
  user: User;
};
