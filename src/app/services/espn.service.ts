import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class EspnService {
  weekMap: Map<string, string>;

  constructor(private httpClient: HttpClient) {
    this.weekMap = new Map();
    this.weekMap.set('1', '20220908-20220911');
    this.weekMap.set('2', '20220915-20220918');
    this.weekMap.set('3', '20220922-20220925');
    this.weekMap.set('4', '20220929-20221002');
    this.weekMap.set('5', '20221006-20221009');
    this.weekMap.set('6', '20221013-20221016');
    this.weekMap.set('7', '20221020-20221023');
    this.weekMap.set('8', '20221027-20221030');
    this.weekMap.set('9', '20221103-20221106');
  }

  getGamesByWeek(week: string): Observable<EspnEvent[]> {
    return this.httpClient
      .get(
        `https://site.web.api.espn.com/apis/v2/scoreboard/header?sport=football&league=nfl&region=us&lang=en&contentorigin=espn&dates=${this.weekMap.get(
          week
        )}`
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
