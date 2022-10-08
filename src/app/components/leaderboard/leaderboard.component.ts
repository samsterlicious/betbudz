import { Component, OnInit } from '@angular/core';
import { map, Observable } from 'rxjs';
import { BackendService } from 'src/app/services/backend/backend.service';

@Component({
  selector: 'app-leaderboard',
  templateUrl: './leaderboard.component.html',
  styleUrls: ['./leaderboard.component.scss']
})
export class LeaderboardComponent implements OnInit {

  leaderboard$: Observable<Player[]>;
  constructor(private api: BackendService) { 
    this.leaderboard$ = api.getLeaderboard().pipe(
      map(bets => {
        const players: any = {}
        bets.forEach(bet=>{
          players[bet.personOne] = 0;
          players[bet.personTwo] = 0;
        })

        bets.forEach(bet=>{
          players[bet.winner] += bet.amount;
        })

        const playersArray = Object.keys(players);
        
        playersArray.sort((player1, player2) => {
          return players[player2] - players[player1];
        })

        return playersArray.map((player, index) => ({
          email: player,
          rank: index + 1,
          winnings: players[player]
        }))
      })
    )
  }

  ngOnInit(): void {
  }

}

type Player = {
  email: string;
  rank: number; 
  winnings: number;
}
