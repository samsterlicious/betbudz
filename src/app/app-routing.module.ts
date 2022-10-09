import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '@auth0/auth0-angular';
import { CurrentFormComponent } from './components/forms/current-form/current-form.component';
import { HomeComponent } from './components/home/home.component';
import { LeaderboardComponent } from './components/leaderboard/leaderboard.component';
import { LiveBetsComponent } from './components/live-bets/live-bets.component';
import { OutstandingBetsComponent } from './components/outstanding-bets/outstanding-bets.component';

const routes: Routes = [
  {
    path: 'forms/current',
    component: CurrentFormComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'bets/live',
    component: LiveBetsComponent,
  },
  {
    path: 'bets/outstanding',
    component: OutstandingBetsComponent,
  },
  {
    path: 'leaderboard',
    component: LeaderboardComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'home',
    component: HomeComponent,
  },
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: '**', redirectTo: '', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
