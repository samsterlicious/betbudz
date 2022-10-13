import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { map, Observable } from 'rxjs';
import { UserStore } from 'src/app/store/user.store';

@Injectable({
  providedIn: 'root',
})
export class UsernameGuard implements CanActivate {
  constructor(private router: Router, private userstore: UserStore) {}
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ):
    | Observable<boolean | UrlTree>
    | Promise<boolean | UrlTree>
    | boolean
    | UrlTree {
    return this.userstore.user$.pipe(
      map((user) => {
        if (user.email && !user.name) {
          return this.router.createUrlTree(['/profile'], {
            queryParams: {
              originalRoute: state.url,
            },
          });
        } else {
          return true;
        }
      })
    );
  }
}
