import { Component, OnInit } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';
import {
  ConfirmationService,
  MenuItem,
  MessageService,
  PrimeNGConfig,
} from 'primeng/api';
import { SpinnerService } from 'src/app/services/spinner/spinner.service';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
  providers: [ConfirmationService, MessageService],
})
export class MainComponent implements OnInit {
  userItems: MenuItem[] = [
    { label: 'Profile', icon: 'pi pi-fw pi-pencil', routerLink: '/profile' },
    {
      label: 'Sign out',
      command: () => {
        this.auth.logout();
      },
    },
  ];

  items: MenuItem[] = [
    {
      label: 'My Picks',
      icon: 'pi pi-fw pi-pencil',
      routerLink: '/bets/current',
    },
    {
      label: 'My Bets',
      items: [
        {
          label: 'Current Bets',
          routerLink: '/bets/live',
          icon: 'pi pi-fw pi-heart-fill',
        },
        {
          label: 'Bet Results',
          icon: 'pi pi-fw pi-exclamation-circle',
          routerLink: '/bets/outstanding',
        },
      ],
    },
    {
      label: 'Reports',
      icon: 'pi pi-fw pi-calendar',
      routerLink: '/leaderboard',
    },
  ];
  constructor(
    private primengConfig: PrimeNGConfig,
    public spinner: SpinnerService,
    private auth: AuthService
  ) {
    this.primengConfig.ripple = true;
    this.auth.user$.subscribe({
      next: (user) => {
        if (!user) {
          this.userItems = [
            {
              label: 'Sign In',
              command: () => {
                this.auth.loginWithRedirect();
              },
            },
          ];
        }
      },
    });
  }

  ngOnInit(): void {}
}
