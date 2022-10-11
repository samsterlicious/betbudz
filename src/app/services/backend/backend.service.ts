import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';
import { mergeMap, Observable, tap } from 'rxjs';
import { getCurrentWeek } from 'src/app/components/forms/current-form/current-form.component';

@Injectable({
  providedIn: 'root',
})
export class BackendService {
  constructor(
    private httpClient: HttpClient,
    private authService: AuthService
  ) {}

  getLeaderboard(): Observable<Bet[]> {
    return this.authService.getAccessTokenSilently().pipe(
      tap((token) => console.log(token)),
      mergeMap((token) =>
        this.httpClient.get<Bet[]>(
          'https://r858btxg3d.execute-api.us-east-1.amazonaws.com/prod/bets',
          {
            headers: {
              Authorization: token,
            },
            params: {
              leaderboard: true,
            },
          }
        )
      )
    );
  }

  updateBet(params: {
    recv?: boolean;
    sent?: boolean;
    id: string;
  }): Observable<void> {
    return this.authService.getAccessTokenSilently().pipe(
      mergeMap((token) =>
        this.httpClient.put<void>(
          'https://r858btxg3d.execute-api.us-east-1.amazonaws.com/prod/bets',
          params,
          {
            headers: {
              Authorization: token,
            },
          }
        )
      )
    );
  }

  getLiveBets(week?: string): Observable<Bet[]> {
    return this.authService.getAccessTokenSilently().pipe(
      mergeMap((token) =>
        this.httpClient.get<Bet[]>(
          'https://r858btxg3d.execute-api.us-east-1.amazonaws.com/prod/bets',
          {
            headers: {
              Authorization: token,
            },
            params: {
              live: true,
              week: getCurrentWeek(),
            },
          }
        )
      )
    );
  }

  getOutstandingBets(): Observable<Bet[]> {
    return this.authService.getAccessTokenSilently().pipe(
      mergeMap((token) =>
        this.httpClient.get<Bet[]>(
          'https://r858btxg3d.execute-api.us-east-1.amazonaws.com/prod/bets',
          {
            headers: {
              Authorization: token,
            },
            params: {
              outstanding: true,
            },
          }
        )
      )
    );
  }

  getForm(week: string, user: string): Observable<Pick[]> {
    return this.authService.getAccessTokenSilently().pipe(
      mergeMap((token) =>
        this.httpClient.get<Pick[]>(
          'https://r858btxg3d.execute-api.us-east-1.amazonaws.com/prod/forms',
          {
            params: { week, email: user },
            headers: {
              Authorization: token,
            },
          }
        )
      )
    );
  }

  postForm(body: Body): Observable<any> {
    return this.authService.getAccessTokenSilently().pipe(
      mergeMap((token) =>
        this.httpClient.post(
          'https://r858btxg3d.execute-api.us-east-1.amazonaws.com/prod/forms',
          body,
          {
            headers: {
              Authorization: token,
            },
          }
        )
      )
    );
  }
}

type Body = {
  email: string;
  picks: Pick[];
  week: number;
};

export type Pick = {
  team: string;
  game: string;
  amount: string;
  shouldDelete?: boolean;
};

export type Bet = {
  personOne: string;
  personOneTeam: string;
  personTwo: string;
  personTwoTeam: string;
  spread: string;
  amount: number;
  winner: string;
  procd: boolean;
  recv: boolean;
  sent: boolean;
  id: string;
  game: string;
  week: string;
};
