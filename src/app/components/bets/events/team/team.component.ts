import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { DateTime, Interval } from 'luxon';
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
  oldWeek!: boolean;

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
    if (this.oldWeek) return true;
    const date = DateTime.fromJSDate(this.event.date, { zone: 'est' });
    const currentDate = DateTime.fromJSDate(new Date(), { zone: 'est' });

    const diff = Interval.fromDateTimes(date, currentDate);
    const diffDays = diff.length('days');
    console.log('currentDate.day ', currentDate.weekday);
    if (diffDays > 5) return true;
    if (
      date.weekday === 4 &&
      (currentDate.weekday === 2 ||
        currentDate.weekday === 3 ||
        (currentDate.weekday === 4 && date.hour > currentDate.hour))
    )
      return false;
    if (
      date.weekday !== 4 &&
      (currentDate.weekday === 2 ||
        currentDate.weekday === 3 ||
        currentDate.weekday === 4 ||
        currentDate.weekday === 5 ||
        currentDate.weekday === 6)
    )
      return false;
    return true;
  }

  isValidBet(): boolean {
    const amount = this.betAmount.get(
      `${this.team.abbreviation}#${this.event.shortName}`
    );
    if (!amount) return true;
    return parseFloat(amount) > 0.99 && parseFloat(amount) < 101;
  }

  handleBetChange(betAmount: any): void {
    if (!this.isDisabled()) {
      this.betEvent.emit({
        amount: betAmount,
        key: this.team.abbreviation + '#' + this.event.shortName,
      });
    }
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
