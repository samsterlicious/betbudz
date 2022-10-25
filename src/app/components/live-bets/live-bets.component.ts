import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { User } from '@auth0/auth0-angular';
import { combineLatest, map, Observable, tap } from 'rxjs';
import { BackendService, Bet } from 'src/app/services/backend/backend.service';
import { EspnEvent, EspnService } from 'src/app/services/espn.service';
import { SpinnerService } from 'src/app/services/spinner/spinner.service';
import { UserStore } from 'src/app/store/user.store';
import { getCurrentWeek } from '../forms/current-form/current-form.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-live-bets',
  templateUrl: './live-bets.component.html',
  styleUrls: ['./live-bets.component.scss'],
})
export class LiveBetsComponent implements OnInit {
  viewModel$: Observable<ViewModel>;
  total = 0;
  winnerMap: { [key: string]: string } = {};

  constructor(
    private api: BackendService,
    private spinner: SpinnerService,
    private userService: UserStore,
    private espn: EspnService
  ) {
    this.spinner.turnOn();

    this.viewModel$ = combineLatest({
      liveBets: combineLatest({
        events: this.espn.getGamesByWeek(getCurrentWeek()),
        liveBets: this.api.getLiveBets(),
        user: userService.user$,
      }).pipe(
        map((resp) => {
          console.log('dsfdsf');
          const eventMap: { [key: string]: EspnEvent } = {};
          let total = 0;
          for (const event of resp.events) {
            if (event.fullStatus.type.completed)
              eventMap[event.shortName] = event;
          }

          for (const bet of resp.liveBets.bets) {
            const event = eventMap[bet.game];

            if (event) {
              let team1 = event.competitors[0];
              let team2 = event.competitors[1];

              let team1Score = parseInt(team1.score);
              let team2Score = parseInt(team2.score);

              if (event.odds.details.includes(team1.abbreviation)) {
                team1Score += parseFloat(
                  event.odds.details.replace(/[^0-9\-\.]/g, '')
                );
              }
              if (event.odds.details.includes(team2.abbreviation)) {
                team2Score += parseFloat(
                  event.odds.details.replace(/[^0-9\-\.]/g, '')
                );
              }

              if (team1Score > team2Score) {
                //user picked bet 1
                if (bet.personOne === resp.user.email) {
                  //bet 1 won
                  if (bet.personOneTeam === team1.abbreviation) {
                    this.winnerMap[bet.game] = 'W';
                    total += bet.amount;
                  } else {
                    //user lost
                    this.winnerMap[bet.game] = 'L';
                    total -= bet.amount;
                  }
                } else {
                  //user picked bet 2
                  if (bet.personOneTeam === team1.abbreviation) {
                    //bet 1 is team 1 and therefore user lost
                    this.winnerMap[bet.game] = 'L';
                    total -= bet.amount;
                  } else {
                    this.winnerMap[bet.game] = 'W';
                    total += bet.amount;
                  }
                }
              } else if (team2Score > team1Score) {
                if (bet.personOne === resp.user.email) {
                  //bet 1 lost
                  if (bet.personOneTeam === team1.abbreviation) {
                    this.winnerMap[bet.game] = 'L';
                    total -= bet.amount;
                  } else {
                    //user won
                    this.winnerMap[bet.game] = 'W';
                    total += bet.amount;
                  }
                } else {
                  //user picked bet 2
                  if (bet.personOneTeam === team1.abbreviation) {
                    //user won
                    this.winnerMap[bet.game] = 'W';
                    total += bet.amount;
                  } else {
                    this.winnerMap[bet.game] = 'L';
                    total -= bet.amount;
                  }
                }
              } else {
                this.winnerMap[bet.game] = 'P';
              }
            }
          }
          this.spinner.turnOff();
          this.total = total;
          return resp.liveBets.bets;
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
        spread = parseFloat(bet.spread) * -1;
      } else {
        spread = parseFloat(bet.spread);
      }
    } else {
      if (bet.personOneTeam === homeTeam) {
        spread = parseFloat(bet.spread);
      } else {
        spread = parseFloat(bet.spread) * -1;
      }
    }

    return spread > 0 ? `+${spread}` : String(spread);
  }
}

type ViewModel = {
  liveBets: Bet[];
  user: User;
};
