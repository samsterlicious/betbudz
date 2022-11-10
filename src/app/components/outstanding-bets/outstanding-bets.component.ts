import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
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
} from 'rxjs';
import {
  BackendService,
  Bet,
  OweTally,
} from 'src/app/services/backend/backend.service';
import { SpinnerService } from 'src/app/services/spinner/spinner.service';
import { UserStore } from 'src/app/store/user.store';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
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
    { amount: number; player: string; amOwed: boolean }[] | undefined
  >;
  oweTally$: Observable<
    { amount: number; player: string; amOwed: boolean }[] | undefined
  >;
  oweTally?: OweTally[];

  constructor(
    private messageService: MessageService,
    private userService: UserStore,
    private api: BackendService,
    private confirmationService: ConfirmationService,
    private spinner: SpinnerService,
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
          this.api.getOutstandingBets(week).pipe(
            tap((resp) => {
              if (resp.oweTally) {
                this.oweTally = resp.oweTally;
              } else {
                this.oweTally = undefined;
              }
              this.spinner.turnOff();
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
      })
    );
  }

  ngOnInit(): void {}

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
