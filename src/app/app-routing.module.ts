import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '@auth0/auth0-angular';
import { CurrentFormComponent } from './components/forms/current-form/current-form.component';
import { HomeComponent } from './components/home/home.component';
import { LeaderboardComponent } from './components/leaderboard/leaderboard.component';
import { LiveBetsComponent } from './components/live-bets/live-bets.component';
import { OutstandingBetsComponent } from './components/outstanding-bets/outstanding-bets.component';
import { ProfileComponent } from './components/profile/profile/profile.component';
import { UsernameGuard } from './guards/username/username.guard';

const routes: Routes = [
  {
    path: 'bets/current',
    component: CurrentFormComponent,
    canActivate: [AuthGuard, UsernameGuard],
  },
  {
    path: 'bets/live',
    component: LiveBetsComponent,
    canActivate: [AuthGuard, UsernameGuard],
  },
  {
    path: 'bets/outstanding',
    component: OutstandingBetsComponent,
    canActivate: [AuthGuard, UsernameGuard],
  },
  {
    path: 'leaderboard',
    component: LeaderboardComponent,
    canActivate: [AuthGuard, UsernameGuard],
  },
  {
    path: 'home',
    component: HomeComponent,
    canActivate: [UsernameGuard],
  },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [AuthGuard],
  },
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: '**', redirectTo: '', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
