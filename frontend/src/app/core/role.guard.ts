import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { Rol } from './models';

export const roleGuard = (roles: Rol[]): CanActivateFn => () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.hasRole(roles)) return true;
  return auth.session() ? router.createUrlTree(['/dashboard']) : router.createUrlTree(['/login']);
};
