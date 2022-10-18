import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { User } from '@auth0/auth0-angular';
import { ConfirmationService, MessageService } from 'primeng/api';
import {
  BehaviorSubject,
  combineLatest,
  mergeMap,
  Observable,
  tap,
} from 'rxjs';
import { BackendService, Bet } from 'src/app/services/backend/backend.service';
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
  actionSubject: BehaviorSubject<boolean>;

  constructor(
    private messageService: MessageService,
    private userService: UserStore,
    private api: BackendService,
    private confirmationService: ConfirmationService,
    private spinner: SpinnerService
  ) {
    this.spinner.turnOn();
    this.actionSubject = new BehaviorSubject(true);

    this.viewModel$ = combineLatest({
      outstanding: this.actionSubject.asObservable().pipe(
        mergeMap(() =>
          this.api.getOutstandingBets().pipe(
            tap(() => {
              this.spinner.turnOff();
            })
          )
        )
      ),
      user: userService.user$.pipe(tap((user) => console.log(user))),
    });
  }

  ngOnInit(): void {}

  getImg(team: string): string {
    return `assets/nfl_logos/${team}.png`;
  }

  stripDomain(email: string): string {
    return email.replace(/@.+$/, '');
  }

  resolve(bet: Bet, email?: string): void {
    console.log(bet.personOne === email || bet.personTwo === email);
    if (bet.personOne === email || bet.personTwo === email) {
      if (bet.winner === email) {
        //mark recvd
        this.confirmationService.confirm({
          message: `Are you sure that you received $${bet.amount}?`,
          accept: () => {
            this.spinner.turnOn();
            this.api
              .updateBet({
                recv: true,
                id: `${bet.week}#${bet.game}#${bet.id}`,
              })
              .subscribe({
                complete: () => {
                  this.actionSubject.next(true);
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
          },
        });
      } else {
        //mark recvd
        this.confirmationService.confirm({
          message: `Are you sure that you sent $${bet.amount}?`,
          accept: () => {
            this.spinner.turnOn();
            this.api.updateBet({ sent: true, id: bet.id }).subscribe({
              complete: () => {
                this.actionSubject.next(true);
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
          },
        });
      }
    }
  }
}

type ViewModel = {
  outstanding: Bet[];
  user: User | undefined | null;
};
