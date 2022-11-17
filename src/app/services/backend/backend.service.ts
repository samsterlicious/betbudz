import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';
import { map, mergeMap, Observable } from 'rxjs';
import { getCurrentWeek } from 'src/app/components/forms/current-form/current-form.component';
import { UserStore } from 'src/app/store/user.store';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class BackendService {
  constructor(
    private httpClient: HttpClient,
    private authService: AuthService,
    private user: UserStore
  ) {}

  getLeaderboard(): Observable<GetBetEndpointResponse> {
    return this.httpClient.get<GetBetEndpointResponse>(
      'https://r858btxg3d.execute-api.us-east-1.amazonaws.com/prod/bets/leaderboard',
      {
        headers: {
          'x-api-key': environment.apiKey,
        },
        params: {
          leaderboard: true,
        },
      }
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

  getLiveBets(week?: string): Observable<GetBetEndpointResponse> {
    return this.user.user$.pipe(
      mergeMap((user) =>
        this.authService.getAccessTokenSilently().pipe(
          mergeMap((token) =>
            this.httpClient.get<GetBetEndpointResponse>(
              'https://r858btxg3d.execute-api.us-east-1.amazonaws.com/prod/bets',
              {
                headers: {
                  Authorization: token,
                },
                params: {
                  live: true,
                  week: getCurrentWeek(),
                  email: user.email,
                },
              }
            )
          )
        )
      )
    );
  }

  getOutstandingBets(
    week: string,
    admin?: boolean
  ): Observable<{ bets: Bet[]; email: string; oweTally: OweTally[] }> {
    const params: any = {};
    if (getCurrentWeek() === week) {
      params.live = true;
    } else {
      params.outstanding = true;
    }
    return this.user.user$.pipe(
      mergeMap((user) =>
        this.authService.getAccessTokenSilently().pipe(
          mergeMap((token) =>
            this.httpClient.get<GetBetEndpointResponse>(
              'https://r858btxg3d.execute-api.us-east-1.amazonaws.com/prod/bets',
              {
                headers: {
                  Authorization: token,
                },
                params: {
                  email: user.email!,
                  week,
                  ...params,
                  ...(admin && { admin: true }),
                },
              }
            )
          ),
          map((resp) => ({
            bets: resp.bets,
            email: user.email!,
            oweTally: resp.oweTally,
          }))
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

type GetBetEndpointResponse = {
  bets: Bet[];
  oweTally: OweTally[];
};

export type OweTally = {
  ogPlayer?: string;
  amount: number;
  player: string;
  amOwed: boolean;
};
