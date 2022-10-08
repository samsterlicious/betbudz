import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class EspnService {
  constructor(private httpClient: HttpClient) {}

  getCurrentGames(): Observable<EspnEvent[]> {
    return this.httpClient
      .get(
        'https://site.web.api.espn.com/apis/v2/scoreboard/header?sport=football&league=nfl&region=us&lang=en&contentorigin=espn'
      )
      .pipe(map((resp: any) => resp.sports[0].leagues[0].events));
  }
}

export type Competitor = {
  abbreviation: string;
  displayName: string;
  homeAway: string;
  logo: string;
  name: string;
  record: string;
};

export type EspnEvent = {
  date: Date;
  odds: Odds;
  competitors: Competitor[];
  shortName: string;
  week: number;
};

type Odds = {
  spread: number;
};
