import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';
import { forkJoin, map, mergeMap, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class EspnService {
  weekMap: Map<string, string>;

  constructor(
    private httpClient: HttpClient,
    private authService: AuthService
  ) {
    this.weekMap = new Map();
    this.weekMap.set('1', '20220908-20220912');
    this.weekMap.set('2', '20220915-20220919');
    this.weekMap.set('3', '20220922-20220926');
    this.weekMap.set('4', '20220929-20221003');
    this.weekMap.set('5', '20221006-20221010');
    this.weekMap.set('6', '20221013-20221017');
    this.weekMap.set('7', '20221020-20221024');
    this.weekMap.set('8', '20221027-20221031');
    this.weekMap.set('9', '20221103-20221107');
    this.weekMap.set('10', '20221110-20221114');
    this.weekMap.set('11', '20221117-20221121');
    this.weekMap.set('12', '20221124-20221128');
  }

  getSpread(details: { shortName: string; details: string }): number {
    console.log('details', details);
    const home = details.shortName.replace(/^\w+\s+@\s+/, '');
    const spreadTeam = details.details.replace(/\s+.+$/, '');
    const spread = parseFloat(details.details.replace(/\w+\s+/, ''));
    if (home === spreadTeam) {
      return spread;
    } else {
      return spread * -1;
    }
  }

  getGamesByWeek(week: string): Observable<EspnEvent[]> {
    return forkJoin({
      espn: this.httpClient
        .get(
          `https://site.web.api.espn.com/apis/v2/scoreboard/header?sport=football&league=nfl&region=us&lang=en&contentorigin=espn&dates=${this.weekMap.get(
            week
          )}`
        )
        .pipe(
          map((resp: any) => resp.sports[0].leagues[0].events as EspnEvent[])
        ),
      savedSpread: this.authService.getAccessTokenSilently().pipe(
        mergeMap((token) =>
          this.httpClient.get<{
            [game: string]: { spread: string; details: string };
          }>(`${environment.apiUrl}spread?week=${week}`, {
            headers: {
              Authorization: token,
            },
          })
        )
      ),
    }).pipe(
      map((resp) => {
        let eventz = resp.espn.filter(
          (event) => !!resp.savedSpread[event.shortName].spread
        );
        for (const event of eventz) {
          const mySpread = resp.savedSpread[event.shortName];
          event.odds.details = mySpread.details;
          event.odds.spread = this.getSpread({
            shortName: event.shortName,
            details: mySpread.details,
          });
        }
        return eventz;
      })
    );
  }
}

export type Competitor = {
  abbreviation: string;
  displayName: string;
  homeAway: string;
  logo: string;
  name: string;
  record: string;
  score: string;
};

export type EspnEvent = {
  date: Date;
  odds: Odds;
  competitors: Competitor[];
  shortName: string;
  week: number;
  fullStatus: EventStatus;
};

type Odds = {
  spread: number;
  details: string;
};

type EventStatus = {
  type: EventType;
};

type EventType = {
  completed: boolean;
};
