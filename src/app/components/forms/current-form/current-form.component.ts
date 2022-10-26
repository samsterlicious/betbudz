import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { User } from '@auth0/auth0-angular';
import dateFormat from 'dateformat';
import { ConfirmationService, MessageService } from 'primeng/api';
import {
  BehaviorSubject,
  combineLatest,
  map,
  mergeMap,
  Observable,
  of,
  ReplaySubject,
  tap,
} from 'rxjs';
import { BackendService, Pick } from 'src/app/services/backend/backend.service';
import {
  Competitor,
  EspnEvent,
  EspnService,
} from 'src/app/services/espn.service';
import { SpinnerService } from 'src/app/services/spinner/spinner.service';
import { UserStore } from 'src/app/store/user.store';
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

  daySeperators = new Map<string, string>();

  displaySidebar = false;
  displaySidebarSubject = new BehaviorSubject(false);
  displaySidebar$ = this.displaySidebarSubject.asObservable();

  showinputMapSubject = new BehaviorSubject<Map<string, boolean>>(new Map());
  showinputMap$ = this.showinputMapSubject.asObservable();
  showinputMap: Map<string, boolean>;

  viewModel$: Observable<ViewModel>;
  mapSubject: BehaviorSubject<Map<string, boolean>>;
  totalSubject = new BehaviorSubject<Total>({ amount: 0 });
  total$ = this.totalSubject.asObservable();

  latestWeek = getCurrentWeek();
  weekSubject = new BehaviorSubject<string>(this.latestWeek);
  week: SelectItem;

  weeks: SelectItem[];

  submitButtonSubject = new ReplaySubject<boolean>(1);
  submitButton$ = this.submitButtonSubject.asObservable();

  lateDay: boolean;
  oldPicks: Pick[] = [];
  constructor(
    private userStore: UserStore,
    private backend: BackendService,
    private espnService: EspnService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private spinner: SpinnerService
  ) {
    this.showinputMap = new Map();
    this.mapSubject = new BehaviorSubject(this.showinputMap);

    this.lateDay = new Date().getDay() >= 6;
    this.week = { name: `Week ${this.latestWeek}`, code: this.latestWeek };
    this.weeks = [...Array(parseInt(this.latestWeek)).keys()].map((i) => ({
      code: String(i + 1),
      name: `Week ${i + 1}`,
    }));

    this.viewModel$ = this.userStore.user$.pipe(
      tap((user) => console.log('uesrz', user)),
      mergeMap((user) =>
        combineLatest({
          displaySidebar: this.displaySidebar$,
          inputMap: this.mapSubject
            .asObservable()
            .pipe(tap(() => console.log('inputmap'))),
          events: this.weekSubject.asObservable().pipe(
            tap(() => this.spinner.turnOn()),
            mergeMap((week) =>
              combineLatest({
                events: this.espnService.getGamesByWeek(week).pipe(
                  map((events) => {
                    events = events.map((event) => {
                      event.date = new Date(event.date);
                      return event;
                    });

                    events.sort(
                      (event1, event2) =>
                        event1.date.getTime() - event2.date.getTime()
                    );

                    let previousDate = events[0].date;
                    this.daySeperators.set(
                      events[0].shortName,
                      dateFormat(previousDate, 'dddd, mmmm dS')
                    );
                    console.log(events[0], events[1]);
                    for (let i = 1; i < events.length; i++) {
                      let event = events[i];
                      console.log(previousDate, event.date);
                      if (previousDate.getDay() != event.date.getDay()) {
                        this.daySeperators.set(
                          events[i].shortName,
                          dateFormat(event.date, 'dddd, mmmm dS')
                        );
                      }
                      previousDate = event.date;
                    }
                    console.log('last', events[events.length - 1]);
                    return events;
                  })
                ),
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
                total += parseFloat(pick.amount);
              }
              this.showinputMapSubject.next(this.showinputMap);
              this.totalSubject.next({ amount: total });
              this.spinner.turnOff();
            }),
            map((resp) => resp.events),
            tap((events) => {
              this.submitButtonSubject.next(
                this.latestWeek === String(events[0].week)
              );
            })
          ),
          user: of(user).pipe(
            tap((user) => {
              console.log('user');
              this.email = user!.email!;
            })
          ),
        })
      )
    );
  }

  ngOnInit(): void {}

  getFavorite(event: EspnEvent): Competitor {
    return event.odds.details.includes(event.competitors[0].abbreviation)
      ? event.competitors[0]
      : event.competitors[1];
  }

  getUnderdog(event: EspnEvent): Competitor {
    return event.odds.details.includes(event.competitors[0].abbreviation)
      ? event.competitors[1]
      : event.competitors[0];
  }

  getTotal(): number {
    let total = 0;
    for (const amount of this.betAmount.values()) {
      total += parseFloat(amount);
    }
    return total;
  }

  anyInvalidBets(): boolean {
    for (const amount of this.betAmount.values()) {
      try {
        const dollars = parseFloat(amount);
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
      if (parseFloat(entry[1]) > 0) {
        teamPickSet.delete(entry[0].replace(/#.+$/, ''));
        totalWager += parseFloat(entry[1]);
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
      if (amount) total += parseFloat(amount);
    }
    this.totalSubject.next({ amount: total });
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

  toggleSidebar(): void {
    if (this.displaySidebar) {
      this.turnOffSidebar();
    } else {
      this.displaySidebar = true;
      this.displaySidebarSubject.next(true);
    }
  }

  turnOffSidebar(): void {
    this.displaySidebar = false;
    this.displaySidebarSubject.next(false);
  }
}

type SelectItem = {
  name: string;
  code: string;
};

type ViewModel = {
  displaySidebar: boolean;
  events: EspnEvent[];
  inputMap: Map<string, boolean>;
  user: User | undefined | null;
};

type Total = {
  amount: number;
};

export function getCurrentWeek(): string {
  const startDate = new Date('2022-09-06T07:00:03.513Z');
  const currentDate = new Date();
  return String(
    Math.floor(
      Math.floor(
        (currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      ) / 7
    ) + 1
  );
}
