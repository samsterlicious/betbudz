import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { AuthService, User } from '@auth0/auth0-angular';
import { ConfirmationService, MessageService } from 'primeng/api';
import {
  BehaviorSubject,
  combineLatest,
  map,
  mergeMap,
  Observable,
  tap,
} from 'rxjs';
import { BackendService, Pick } from 'src/app/services/backend/backend.service';
import {
  Competitor,
  EspnEvent,
  EspnService,
} from 'src/app/services/espn.service';
import { SpinnerService } from 'src/app/services/spinner/spinner.service';
import { SelectEventEvent } from '../../bets/events/event/event.component';
import { BetEvent } from '../../bets/events/team/team.component';
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-current-form',
  templateUrl: './current-form.component.html',
  styleUrls: ['./current-form.component.scss'],
})
export class CurrentFormComponent implements OnInit {
  email: string = '';
  betAmount: Map<string, string> = new Map();
  betAmountSubject = new BehaviorSubject<Map<string, string>>(this.betAmount);
  betAmount$ = this.betAmountSubject.asObservable();

  showinputMapSubject = new BehaviorSubject<Map<string, boolean>>(new Map());
  showinputMap$ = this.showinputMapSubject.asObservable();
  showinputMap: Map<string, boolean>;

  viewModel$: Observable<ViewModel>;
  mapSubject: BehaviorSubject<Map<string, boolean>>;
  totalSubject = new BehaviorSubject<Total>({ amount: 0 });
  total$ = this.totalSubject.asObservable();

  latestWeek = this.getCurrentWeek();
  weekSubject = new BehaviorSubject<string>(this.latestWeek);
  week: SelectItem;

  weeks: SelectItem[];

  oldPicks: Pick[] = [];
  constructor(
    private authService: AuthService,
    private backend: BackendService,
    private espnService: EspnService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private spinner: SpinnerService
  ) {
    this.showinputMap = new Map();
    this.mapSubject = new BehaviorSubject(this.showinputMap);

    this.week = { name: `Week ${this.latestWeek}`, code: this.latestWeek };
    this.weeks = [
      { name: 'Week 1', code: '1' },
      { name: 'Week 2', code: '2' },
      { name: 'Week 3', code: '3' },
      { name: 'Week 4', code: '4' },
      { name: 'Week 5', code: '5' },
      { name: 'Week 6', code: '6' },
      { name: 'Week 7', code: '7' },
      { name: 'Week 8', code: '8' },
      { name: 'Week 9', code: '9' },
    ].filter((week) => {
      const code = parseInt(week.code);
      return parseInt(this.latestWeek) >= code;
    });

    this.viewModel$ = this.authService.user$.pipe(
      mergeMap((user) =>
        combineLatest({
          inputMap: this.mapSubject.asObservable(),
          events: this.weekSubject.asObservable().pipe(
            tap(() => this.spinner.turnOn()),
            tap((week) => console.log('weekz', week)),
            mergeMap((week) =>
              combineLatest({
                events: this.espnService.getGamesByWeek(week),
                picks: this.backend.getForm(week, user!.email!),
              })
            ),
            tap((resp) => {
              this.oldPicks = resp.picks;
              let total = 0;
              this.showinputMap.clear();
              this.betAmount.clear();
              for (const pick of resp.picks) {
                this.showinputMap.set(pick.team, true);
                this.betAmount.set(`${pick.team}#${pick.game}`, pick.amount);
                total += parseInt(pick.amount);
              }
              this.showinputMapSubject.next(this.showinputMap);
              this.totalSubject.next({ amount: total });
              this.spinner.turnOff();
            }),
            map((resp) => resp.events)
          ),
          user: this.authService.user$,
        })
      )
    );
  }

  ngOnInit(): void {}

  getFavorite(event: EspnEvent): Competitor {
    return event.odds.spread > 0 ? event.competitors[1] : event.competitors[0];
  }

  getUnderdog(event: EspnEvent): Competitor {
    return event.odds.spread > 0 ? event.competitors[0] : event.competitors[1];
  }

  getTotal(): number {
    let total = 0;
    for (const amount of this.betAmount.values()) {
      total += parseInt(amount);
    }
    return total;
  }

  anyInvalidBets(): boolean {
    for (const amount of this.betAmount.values()) {
      try {
        const dollars = parseInt(amount);
        if (dollars > 100 || dollars < 1) return true;
      } catch {
        return true;
      }
    }
    return false;
  }

  submit(viewModel: ViewModel): void {
    const week = viewModel.events[0].week;
    const picks: Pick[] = [];
    let totalWager = 0;
    const teamPickSet: Set<string> = new Set();
    for (const oldPick of this.oldPicks) {
      teamPickSet.add(oldPick.team);
    }

    for (const entry of this.betAmount.entries()) {
      if (parseInt(entry[1]) > 0) {
        teamPickSet.delete(entry[0].replace(/#.+$/, ''));
        totalWager += parseInt(entry[1]);
        picks.push({
          amount: entry[1],
          game: entry[0].replace(/^.+#/, ''),
          team: entry[0].replace(/#.+$/, ''),
        });
      }
    }

    for (const oldPick of teamPickSet.keys()) {
      picks.push({
        amount: '0',
        game: 'sam',
        team: oldPick,
        shouldDelete: true,
      });
    }

    this.confirmationService.confirm({
      message: `Are you sure that you want to wager $${totalWager}?`,
      accept: () => {
        this.spinner.turnOn();
        this.backend
          .postForm({
            email: this.email,
            week,
            picks,
          })
          .subscribe({
            next: () => {
              this.messageService.add({
                severity: 'success',
                summary: 'Success',
              });
              this.spinner.turnOff();
            },
          });
      },
    });
  }

  setBet(betEvent: BetEvent) {
    this.betAmount.set(betEvent.key, betEvent.amount);
    this.betAmountSubject.next(this.betAmount);

    let total = 0;
    for (const amount of this.betAmount.values()) {
      if (amount) total += parseInt(amount);
    }
    console.log('totla', total);
    this.totalSubject.next({ amount: total });
  }

  getCurrentWeek(): string {
    const startDate = new Date('2022-09-08');
    const currentDate = new Date();
    return String(
      Math.round(
        Math.round(
          (currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
        ) / 7
      ) + 1
    );
  }

  handleSelectEvent(selectEvent: SelectEventEvent) {
    this.showinputMap.set(selectEvent.otherTeam, false);
    if (this.showinputMap.get(selectEvent.team)) {
      this.showinputMap.set(selectEvent.team, false);
    } else {
      this.showinputMap.set(selectEvent.team, true);
    }
    this.showinputMapSubject.next(this.showinputMap);
  }

  handleWeekChange(week: SelectItem) {
    this.week = week;
    this.weekSubject.next(week.code);
  }
}

type SelectItem = {
  name: string;
  code: string;
};

type ViewModel = {
  events: EspnEvent[];
  inputMap: Map<string, boolean>;
  user: User | undefined | null;
};

type Total = {
  amount: number;
};
