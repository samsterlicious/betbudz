import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { AuthModule } from '@auth0/auth0-angular';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CurrentFormComponent } from './components/forms/current-form/current-form.component';
import { HomeComponent } from './components/home/home.component';
import { LeaderboardComponent } from './components/leaderboard/leaderboard.component';
import { LiveBetsComponent } from './components/live-bets/live-bets.component';
import { MainComponent } from './components/main/main.component';
import { OutstandingBetsComponent } from './components/outstanding-bets/outstanding-bets.component';
import { PrimengModule } from './modules/primeng/primeng.module';

@NgModule({
  declarations: [
    AppComponent,
    MainComponent,
    LeaderboardComponent,
    HomeComponent,
    CurrentFormComponent,
    LiveBetsComponent,
    OutstandingBetsComponent,
  ],
  imports: [
    AuthModule.forRoot({
      clientId: '0ylwHbbehaMjTanFRBgNNfA6cfRYUtCG',
      domain: 'dev-33fncjbn.us.auth0.com',
      audience: 'https://dev-33fncjbn.us.auth0.com/api/v2/',
      cacheLocation: 'localstorage',
    }),
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
    PrimengModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
