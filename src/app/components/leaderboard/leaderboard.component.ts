import { Component, OnInit } from '@angular/core';
import {
  BehaviorSubject,
  combineLatest,
  map,
  mergeMap,
  Observable,
} from 'rxjs';
import { BackendService } from 'src/app/services/backend/backend.service';
import { SpinnerService } from 'src/app/services/spinner/spinner.service';
import { UserStore } from 'src/app/store/user.store';

@Component({
  selector: 'app-leaderboard',
  templateUrl: './leaderboard.component.html',
  styleUrls: ['./leaderboard.component.scss'],
})
export class LeaderboardComponent implements OnInit {
  leaderboard$: Observable<Player[]>;
  weekSubject = new BehaviorSubject<string>('All');

  constructor(
    private api: BackendService,
    private spinner: SpinnerService,
    private user: UserStore
  ) {
    spinner;
    this.spinner.turnOn();
    this.leaderboard$ = combineLatest({
      users: this.user.getUsers(),
      bets: this.weekSubject
        .asObservable()
        .pipe(mergeMap((week) => this.api.getLeaderboard())),
    }).pipe(
      map((resp) => {
        const players: { [key: string]: Player } = {};
        resp.bets.bets.forEach((bet) => {
          players[bet.personOne] = {
            name: '',
            rank: 0,
            points: 0,
            wins: 0,
            loss: 0,
            push: 0,
          };
          players[bet.personTwo] = {
            name: '',
            rank: 0,
            points: 0,
            wins: 0,
            loss: 0,
            push: 0,
          };
        });

        const userMap: any = {};

        for (const member of resp.users) {
          userMap[member.email] = member.name ?? member.email;
        }

        resp.bets.bets.forEach((bet) => {
          if (bet.winner) {
            players[bet.winner].points += bet.amount;
            players[bet.winner].wins += 1;
            if (bet.personOne === bet.winner) {
              players[bet.personTwo].loss += 1;
              players[bet.personTwo].points -= bet.amount;
            } else {
              players[bet.personOne].loss += 1;
              players[bet.personOne].points -= bet.amount;
            }
          } else {
            players[bet.personOne].push += 1;
            players[bet.personTwo].push += 1;
          }
        });

        const playersArray = Object.keys(players);

        playersArray.sort((player1, player2) => {
          return players[player2].points - players[player1].points;
        });
        this.spinner.turnOff();
        return playersArray.map((player, index) => ({
          ...players[player],
          name: userMap[player] ?? player,
          rank: index + 1,
        }));
      })
    );
  }

  ngOnInit(): void {}
}

type Player = {
  name: string;
  rank: number;
  points: number;
  wins: number;
  loss: number;
  push: number;
};
