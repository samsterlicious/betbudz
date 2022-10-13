import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { Competitor, EspnEvent } from 'src/app/services/espn.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-team',
  templateUrl: './team.component.html',
  styleUrls: ['./team.component.scss'],
})
export class TeamComponent implements OnInit {
  @Input()
  betAmount!: Map<string, string>;

  @Output()
  betEvent = new EventEmitter<BetEvent>();

  @Output()
  clickedTeamEvent = new EventEmitter<ClickedTeamEvent>();

  @Input()
  event!: EspnEvent;

  @Input()
  selected?: boolean;

  @Input()
  team!: Competitor;

  @Input()
  otherTeam!: Competitor;

  constructor() {}

  ngOnInit(): void {}

  clickedTeam() {
    if (!this.isDisabled())
      this.clickedTeamEvent.emit({
        event: this.event,
        team: this.team,
        otherTeam: this.otherTeam,
      });
  }

  getLogo(teamName: string): string {
    return `assets/nfl_logos/${teamName}.png`;
  }

  isDisabled(): boolean {
    const date = this.event.date;
    return date.getTime() <= new Date().getTime();
  }

  isValidBet(): boolean {
    const amount = this.betAmount.get(
      `${this.team.abbreviation}#${this.event.shortName}`
    );
    if (!amount) return true;
    return parseInt(amount) > 0.99 && parseInt(amount) < 101;
  }

  handleBetChange(betAmount: any): void {
    this.betEvent.emit({
      amount: betAmount,
      key: this.team.abbreviation + '#' + this.event.shortName,
    });
  }

  myBetAmount(): string {
    return (
      this.betAmount.get(`${this.team.abbreviation}#${this.event.shortName}`) ??
      ''
    );
  }
}

export type BetEvent = {
  amount: string;
  key: string;
};

export type ClickedTeamEvent = {
  event: EspnEvent;
  team: Competitor;
  otherTeam: Competitor;
};
