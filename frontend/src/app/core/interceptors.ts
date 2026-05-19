import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { NotifyService } from '../shared/notify.service';

// El JWT viaja en una cookie HttpOnly; basta con enviar las credenciales en cada peticion.
export const credentialsInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req.clone({ withCredentials: true }));
};

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notify = inject(NotifyService);
  const auth = inject(AuthService);
  return next(req).pipe(catchError((error: HttpErrorResponse) => {
    if (error.status === 401) {
      if (!isAuthEndpoint(req.url)) {
        notify.warning('Sesion expirada');
        auth.logout();
      }
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

function isAuthEndpoint(url: string): boolean {
  return /\/auth\/(login|logout)(\?|$)/.test(url);
}
