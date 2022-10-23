import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { Competitor, EspnEvent } from 'src/app/services/espn.service';
import { BetEvent, ClickedTeamEvent } from '../team/team.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-event',
  templateUrl: './event.component.html',
  styleUrls: ['./event.component.scss'],
})
export class EventComponent implements OnInit {
  currentMap = new Map<string, boolean>();

  @Input()
  betAmount!: Map<string, string>;

  @Input()
  favorite!: Competitor;

  @Input()
  underdog!: Competitor;

  @Input()
  event!: EspnEvent;

  @Input()
  oldWeek!: boolean;

  @Input()
  showInputMap!: Map<string, boolean>;

  @Output()
  eventBetEvent = new EventEmitter<BetEvent>();

  @Output()
  eventSelectEvent = new EventEmitter<SelectEventEvent>();

  constructor() {}

  ngOnInit(): void {}

  getSpread(spread: number): string {
    if (spread > 0) return String(spread * -1);
    else if (spread === 0) return 'Pick';
    else return String(spread);
  }

  clickTeam(clickEvent: ClickedTeamEvent) {
    const clickMap = new Map<string, boolean>();
    clickMap.set(clickEvent.team.abbreviation, true);
    clickMap.set(clickEvent.otherTeam.abbreviation, false);
    this.eventSelectEvent.emit({
      team: clickEvent.team.abbreviation,
      otherTeam: clickEvent.otherTeam.abbreviation,
      game: clickEvent.event.shortName,
    });

    this.eventBetEvent.emit({
      amount: '',
      key: `${clickEvent.team.abbreviation}#${clickEvent.event.shortName}`,
    });
    this.eventBetEvent.emit({
      amount: '',
      key: `${clickEvent.otherTeam.abbreviation}#${clickEvent.event.shortName}`,
    });
  }

  setBet(betEvent: BetEvent) {
    console.log('e', betEvent);
    this.eventBetEvent.emit(betEvent);
  }
}

export type SelectEventEvent = {
  team: string;
  game: string;
  otherTeam: string;
};
