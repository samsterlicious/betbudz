import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import {
  catchError,
  combineLatest,
  from,
  Observable,
  of,
  Subject,
  switchMap,
  take,
  tap,
} from 'rxjs';
import { SpinnerService } from 'src/app/services/spinner/spinner.service';
import { BetUser, UserStore } from 'src/app/store/user.store';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit {
  email = '';

  profileForm = new FormGroup({
    email: new FormControl(''),
    username: new FormControl('', Validators.minLength(3)),
  });

  saveUserSubject = new Subject<string>();
  user$: Observable<BetUser>;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private spinner: SpinnerService,
    private messageService: MessageService,
    private userStore: UserStore
  ) {
    this.user$ = userStore.user$.pipe(
      tap((user) => {
        if (!user.name) {
          this.messageService.add({
            severity: 'error',
            summary: 'Please set your username',
          });
        }
        this.profileForm.patchValue({
          email: user.email,
          username: user.name,
        });
      })
    );
  }

  ngOnInit(): void {}

  save(): void {
    combineLatest({
      name: of(this.username!.value!),
      activatedRoute: this.route.queryParams,
    })
      .pipe(
        tap(() => this.spinner.turnOn()),
        switchMap((resp) =>
          this.userStore.saveUser(resp.name).pipe(
            catchError(() => {
              this.spinner.turnOff();
              this.messageService.add({
                severity: 'error',
                summary: 'Please contact Keith',
              });
              return of(true);
            }),
            switchMap(() => {
              const url = resp.activatedRoute['originalRoute'];
              if (url) {
                return from(this.router.navigate([url]));
              }
              return of(true);
            })
          )
        ),
        tap(() => {
          this.spinner.turnOff();
          this.messageService.add({
            severity: 'success',
            summary: 'We have saved it',
          });
        }),
        take(1)
      )
      .subscribe();
  }

  get username() {
    return this.profileForm.get('username');
  }
}
