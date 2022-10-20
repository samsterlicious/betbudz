import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';
import { map, mergeMap, Observable, tap } from 'rxjs';
import { getCurrentWeek } from 'src/app/components/forms/current-form/current-form.component';
import { UserStore } from 'src/app/store/user.store';

@Injectable({
  providedIn: 'root',
})
export class BackendService {
  constructor(
    private httpClient: HttpClient,
    private authService: AuthService,
    private user: UserStore
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

  getOutstandingBets(week: string): Observable<{ bets: Bet[]; email: string }> {
    return this.user.user$.pipe(
      mergeMap((user) =>
        this.authService.getAccessTokenSilently().pipe(
          mergeMap((token) =>
            this.httpClient.get<Bet[]>(
              'https://r858btxg3d.execute-api.us-east-1.amazonaws.com/prod/bets',
              {
                headers: {
                  Authorization: token,
                },
                params: {
                  outstanding: true,
                  // email: 'keithmcg7@gmail.com',
                  email: user.email!,
                  week,
                },
              }
            )
          ),
          map((bets) => ({ bets, email: user.email! }))
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

  fullTeamNames: any = {
    ARI: 'Arizona Cardinals',
    ATL: 'Atlanta Falcons',
    BAL: 'Baltimore Ravens',
    BUF: 'Buffalo Bills',
    CAR: 'Carolina Panthers',
    CHI: 'Chicago Bears',
    CIN: 'Cincinnati Bengals',
    CLE: 'Cleveland Browns',
    DAL: 'Dallas Cowboys',
    DEN: 'Denver Broncos',
    DET: 'Detroit Lions',
    GB: 'Green Bay Packers',
    HOU: 'Houston Texans',
    IND: 'Indianapolis Colts',
    JAX: 'Jacksonville Jaguars',
    KC: 'Kansas City Chiefs',
    LAC: 'Los Angeles Chargers',
    LAR: 'Los Angeles Rams',
    LV: 'Las Vegas Raiders',
    MIA: 'Miami Dolphins',
    MIN: 'Minnesota Vikings',
    NE: 'New England Patriots',
    NO: 'Arizona Cardinals',
    NYG: 'New York Giants',
    NYJ: 'New York Jets',
    PHI: 'Philadelphia Eagles',
    PIT: 'Pittsburgh Steelers',
    SEA: 'Seattle Seahawks',
    SF: 'San Francisco 49ers',
    TB: 'Tampa Bay Buccaneers',
    TEN: 'Tennessee Titans',
    WSH: 'Washington Commanders',
  };
  getFullTeamName(team: string): string {
    return this.fullTeamNames[team];
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
