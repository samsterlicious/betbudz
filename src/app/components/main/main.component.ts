import { Component, OnInit } from '@angular/core';
import { ConfirmationService, MenuItem, MessageService, PrimeNGConfig } from 'primeng/api';
import { SpinnerService } from 'src/app/services/spinner/spinner.service';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
  providers: [ConfirmationService,MessageService],
})
export class MainComponent implements OnInit {
  items: MenuItem[];

  constructor(
    private primengConfig: PrimeNGConfig,
    public spinner: SpinnerService
  ) {
    this.primengConfig.ripple = true;
    this.items = [
      {
        label: 'Forms',
        icon: 'pi pi-fw pi-pencil',
        items: [
          {
            label: 'Current',
            routerLink: '/forms/current',
          },
          {
            label: 'Past',
            icon: 'pi pi-fw pi-align-right',
          },
        ],
      },
      {
        label: 'Users',
        icon: 'pi pi-fw pi-user',
        items: [
          {
            label: 'Search',
            icon: 'pi pi-fw pi-users',
            routerLink: '/users/serach',
          },
        ],
      },
      {
        label: 'Leaderboard',
        icon: 'pi pi-fw pi-calendar',
        routerLink: '/leaderboard',
      },
      {
        label: 'Bets',
        icon: 'pi pi-fw pi-dollar',
        items: [
          {
            label: 'Live',
            routerLink: '/bets/live',
            icon: 'pi pi-fw pi-heart-fill',
          },
          {
            label: 'Outstanding',
            icon: 'pi pi-fw pi-exclamation-circle',
            routerLink: '/bets/outstanding'
          },
        ],
      },
    ];
  }

  ngOnInit(): void {}
}
