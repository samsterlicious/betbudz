import { Component, OnInit } from '@angular/core';
import { AuthService, User } from '@auth0/auth0-angular';
import { ConfirmationService, MessageService } from 'primeng/api';
import { BehaviorSubject, combineLatest, Observable, tap } from 'rxjs';
import { BackendService, Pick } from 'src/app/services/backend/backend.service';
import {
  Competitor,
  EspnEvent,
  EspnService
} from 'src/app/services/espn.service';
import { SpinnerService } from 'src/app/services/spinner/spinner.service';
@Component({
  selector: 'app-current-form',
  templateUrl: './current-form.component.html',
  styleUrls: ['./current-form.component.scss'],
})
export class CurrentFormComponent implements OnInit {
  email: string = '';
  betAmount: Map<string, string>;
  viewModel$: Observable<ViewModel>;
  showinputMap: Map<string, boolean>;
  mapSubject: BehaviorSubject<Map<string, boolean>>;
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
    this.betAmount = new Map();
    this.mapSubject = new BehaviorSubject(this.showinputMap);
    this.spinner.turnOn();
    this.viewModel$ = combineLatest({
      events: espnService.getCurrentGames(),
      inputMap: this.mapSubject.asObservable(),
      user: this.authService.user$,
    }).pipe(
      tap((resp) => {
        this.email = resp.user?.email!;
        this.backend
          .getForm(String(resp.events[0].week), this.email)
          .subscribe({
            next: (picks) => {
              this.oldPicks = picks;
              for (const pick of picks) {
                console.log('p', pick);
                this.showinputMap.set(pick.team, true);
                this.betAmount.set(`${pick.team}#${pick.game}`, pick.amount);
              }
              this.spinner.turnOff();
            },
          });
      })
    );
  }

  ngOnInit(): void {}

  clickedTeam(
    team: Competitor,
    other: Competitor,
    game: string,
    event: EspnEvent
  ) {
    if (!this.isDisabledEvent(event)) {
      this.showinputMap.set(team.abbreviation, true);
      this.showinputMap.set(other.abbreviation, false);

      this.betAmount.set(`${team.abbreviation}#${game}`, '');
      this.betAmount.set(`${other.abbreviation}#${game}`, '');
    }
  }

  getFavorite(event: EspnEvent): Competitor {
    return event.odds.spread > 0 ? event.competitors[1] : event.competitors[0];
  }

  getUnderdog(event: EspnEvent): Competitor {
    return event.odds.spread > 0 ? event.competitors[0] : event.competitors[1];
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

  isDisabledEvent(event: EspnEvent): boolean {
    console.log(event.date);
    console.log(event.date <= new Date());
    const date = new Date(event.date);
    date.setMinutes(date.getMinutes() - 260);
    return date <= new Date();
  }
}

type ViewModel = {
  events: EspnEvent[];
  inputMap: Map<string, boolean>;
  user: User | undefined | null;
};
