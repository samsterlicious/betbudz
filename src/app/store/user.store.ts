import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';
import {
  combineLatest,
  distinctUntilChanged,
  map,
  Observable,
  of,
  ReplaySubject,
  switchMap,
  tap,
} from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UserStore {
  auth0User$: Observable<BetUser>;

  private readonly userSubject = new ReplaySubject<BetUser>(1);

  readonly user$: Observable<BetUser>;

  constructor(private authService: AuthService, private http: HttpClient) {
    this.user$ = this.userSubject.asObservable();

    this.auth0User$ = this.authService.user$.pipe(
      distinctUntilChanged((prev, curr) => {
        return prev?.email === curr?.email;
      }),
      switchMap((auth0User) => {
        if (auth0User) {
          return this.authService.getAccessTokenSilently().pipe(
            switchMap((token) =>
              this.http
                .get<BetUser>(
                  `${environment.apiUrl}user/${auth0User!.email!}`,
                  { headers: { Authorization: token } }
                )
                .pipe(
                  map((betUser) => ({
                    ...betUser,
                    email: auth0User!.email!,
                  }))
                )
            )
          );
        } else {
          return of({ email: '', name: '' });
        }
      }),
      tap((betUser) => {
        this.updateUserState(betUser);
      })
    );
  }

  private updateUserState(user: BetUser): void {
    this.userSubject.next(user);
  }

  getUsers(): Observable<BetUser[]> {
    return this.http.get<BetUser[]>(`${environment.apiUrl}users`, {
      headers: {
        'x-api-key': environment.apiKey,
      },
    });
  }

  saveUser(name: string): Observable<any> {
    return combineLatest({
      token: this.authService
        .getAccessTokenSilently()
        .pipe(tap((tok) => console.log('tok'))),
      user: this.user$.pipe(tap((u) => console.log('samz', u))),
    }).pipe(
      switchMap((resp) => {
        return this.http.put<BetUser>(
          `${environment.apiUrl}user/${resp.user.email!}`,
          { name },
          { headers: { Authorization: resp.token } }
        );
      }),
      tap((betUser) => this.updateUserState(betUser))
    );
  }
}

export type BetUser = {
  email: string;
  name: string;
};
