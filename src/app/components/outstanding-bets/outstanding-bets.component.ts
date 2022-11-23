import { Component, OnInit } from '@angular/core';
import { User } from '@auth0/auth0-angular';
import { ConfirmationService, MessageService } from 'primeng/api';
import {
  BehaviorSubject,
  combineLatest,
  map,
  mergeMap,
  Observable,
  Subject,
  tap,
  timer,
} from 'rxjs';
import {
  BackendService,
  Bet,
  OweTally,
} from 'src/app/services/backend/backend.service';
import { EspnEvent, EspnService } from 'src/app/services/espn.service';
import { SpinnerService } from 'src/app/services/spinner/spinner.service';
import { UserStore } from 'src/app/store/user.store';

@Component({
  selector: 'app-outstanding-bets',
  templateUrl: './outstanding-bets.component.html',
  styleUrls: ['./outstanding-bets.component.scss'],
})
export class OutstandingBetsComponent implements OnInit {
  viewModel$: Observable<ViewModel>;
  weekSubject: BehaviorSubject<string>;

  week: SelectItem;

  weeks: SelectItem[];

  latestWeek = getCurrentWeek();

  total: number = 0;

  oweTallySubject: Subject<
    | { ogPlayer?: string; amount: number; player: string; amOwed: boolean }[]
    | undefined
  >;
  oweTally$: Observable<
    | { ogPlayer?: string; amount: number; player: string; amOwed: boolean }[]
    | undefined
  >;
  oweTally?: OweTally[];

  admin = false;

  constructor(
    private messageService: MessageService,
    public userService: UserStore,
    private api: BackendService,
    private confirmationService: ConfirmationService,
    private spinner: SpinnerService,
    private espn: EspnService,
    private serv: BackendService
  ) {
    this.weekSubject = new BehaviorSubject<string>(getCurrentWeek());

    this.week = { name: `Week ${this.latestWeek}`, code: this.latestWeek };
    this.weeks = [...Array(parseInt(this.latestWeek)).keys()].map((i) => ({
      code: String(i + 1),
      name: `Week ${i + 1}`,
    }));

    this.oweTallySubject = new Subject();
    this.oweTally$ = this.oweTallySubject.asObservable();

    this.viewModel$ = combineLatest({
      espnEvents: timer(0, 600000).pipe(
        mergeMap(() => this.weekSubject.asObservable()),
        mergeMap((week) => this.espn.getGamesByWeek(week))
      ),
      names: this.userService.getUsers().pipe(
        map((users) => {
          const map: any = {};
          users.forEach((u) => {
            map[u.email] = u.name;
          });
          return map;
        })
      ),
      outstanding: this.weekSubject.asObservable().pipe(
        tap(() => this.spinner.turnOn()),
        mergeMap((week) =>
          this.api.getOutstandingBets(week, this.admin).pipe(
            tap((resp) => {
              if (resp.oweTally) {
                this.oweTally = resp.oweTally;
              } else {
                this.oweTally = undefined;
              }

              let total = 0;
              for (const bet of resp.bets) {
                if (bet.winner) {
                  if (bet.winner === resp.email) {
                    total += bet.amount;
                  } else {
                    total -= bet.amount;
                  }
                }
              }
              this.total = total;
            }),
            map((resp) => resp.bets)
          )
        )
      ),
      user: userService.user$.pipe(tap((user) => console.log(user))),
    }).pipe(
      tap((resp) => {
        if (this.oweTally) {
          this.oweTally.forEach((row) => {
            row.player =
              resp.names[row.player] ?? row.player.replace(/@.+$/, '');
          });
        }
        console.log('that next tho', this.oweTally);
        this.oweTallySubject.next(this.oweTally);
      }),
      map((resp) => {
        const eventMap: { [key: string]: EspnEvent } = {};
        for (const event of resp.espnEvents) {
          if (event.fullStatus.type.completed)
            eventMap[event.shortName] = event;
        }

        for (const bet of resp.outstanding) {
          const event = eventMap[bet.game];

          if (event) {
            let team1 = event.competitors[0];
            let team2 = event.competitors[1];

            let team1Score = parseInt(team1.score);
            let team2Score = parseInt(team2.score);

            const awayTeam = bet.game.replace(/^(\w{3,4})\s.+$/, '$1');
            const homeTeam = bet.game.replace(/^.+(\w{3,4})$/, '$1');
            if (team1.abbreviation === awayTeam) {
              team1Score += parseFloat(bet.spread);
            } else {
              team1Score -= parseFloat(bet.spread);
            }

            if (team1Score > team2Score) {
              bet.procd = true;
              if (team1.abbreviation === bet.personOneTeam) {
                bet.winner = bet.personOne;
              } else {
                bet.winner = bet.personTwo;
              }
            } else if (team1Score < team2Score) {
              bet.procd = true;
              if (team1.abbreviation === bet.personOneTeam) {
                bet.winner = bet.personTwo;
              } else {
                bet.winner = bet.personOne;
              }
            }
          }
        }
        this.spinner.turnOff();
        return resp;
      })
    );
  }

  ngOnInit(): void {}

  getImg(bet: Bet, email: string, isMe: boolean, adminFlag?: boolean): string {
    console.log('adminFlag', adminFlag, email, bet);
    if (adminFlag) {
      if (email === bet.personOne)
        return `assets/nfl_logos/${bet.personOneTeam}.png`;
      return `assets/nfl_logos/${bet.personTwoTeam}.png`;
    }
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

  seeAll() {
    if (this.admin) this.admin = false;
    else this.admin = true;

    this.handleWeekChange(this.week);
  }

  handleWeekChange(week: SelectItem) {
    this.week = week;
    this.weekSubject.next(week.code);
  }

  getMe(bet: Bet, email: string, isMe: boolean, small: boolean): string {
    if (isMe) {
      return bet.personOne === email
        ? small
          ? bet.personOneTeam
          : this.serv.getFullTeamName(bet.personOneTeam)
        : small
        ? bet.personTwoTeam
        : this.serv.getFullTeamName(bet.personTwoTeam);
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
    console.log('sam', bet, email);
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

  didIWin(bet: Bet, email: string): boolean {
    if (!bet.procd) return false;
    if (bet.winner === email) return true;
    return false;
  }

  didILose(bet: Bet, email: string): boolean {
    if (!bet.procd) return false;
    if (bet.winner && bet.winner !== email) return true;
    return false;
  }
  resolve(bet: Bet, email?: string): void {
    console.log(bet.personOne === email || bet.personTwo === email);
    if (bet.personOne === email || bet.personTwo === email) {
      if (bet.winner === email) {
        //mark recvd
        // this.confirmationService.confirm({
        //   message: `Are you sure that you received $${bet.amount}?`,
        //   accept: () => {
        this.spinner.turnOn();
        this.api
          .updateBet({
            recv: true,
            id: `${bet.week}#${bet.game}#${bet.id}`,
          })
          .subscribe({
            complete: () => {
              this.weekSubject.next(this.week.code);
              this.messageService.add({
                severity: 'success',
                summary: 'Success',
              });
            },
            error: () => {
              this.spinner.turnOff();
              this.messageService.add({
                severity: 'error',
                summary: 'Contact Keith',
              });
            },
          });
        //   },
        // });
      } else {
        //mark recvd
        // this.confirmationService.confirm({
        //   message: `Are you sure that you sent $${bet.amount}?`,
        //   accept: () => {
        this.spinner.turnOn();
        this.api.updateBet({ sent: true, id: bet.id }).subscribe({
          complete: () => {
            this.weekSubject.next(this.week.code);
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
            });
          },
          error: () => {
            this.spinner.turnOff();
            this.messageService.add({
              severity: 'error',
              summary: 'Contact Keith',
            });
          },
        });
        //   },
        // });
      }
    }
  }
}

type ViewModel = {
  espnEvents: EspnEvent[];
  outstanding: Bet[];
  user: User;
};

type SelectItem = {
  name: string;
  code: string;
};

function getCurrentWeek(): string {
  const startDate = new Date('2022-09-08T07:00:03.513Z');
  const currentDate = new Date();
  return String(
    Math.floor(
      Math.floor(
        (currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      ) / 7
    ) + 1
  );
}
