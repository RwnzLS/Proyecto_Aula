import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { NotifyService } from '../shared/notify.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).token();
  return next(token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req);
};

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notify = inject(NotifyService);
  const auth = inject(AuthService);
  const router = inject(Router);
  return next(req).pipe(catchError((error: HttpErrorResponse) => {
    if (error.status === 401) {
      notify.warning('Sesion expirada');
      auth.logout();
      router.navigateByUrl('/login');
    } else if (error.status === 403) {
      notify.warning('No tienes permisos para esta accion');
    } else if (error.status === 0) {
      notify.error('API no disponible. Revisa que el backend este corriendo en localhost:8080');
    } else {
      notify.error(error.error?.message ?? 'No se pudo completar la accion');
    }
    return throwError(() => error);
  }));
};
