import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).token();
  return next(token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req);
};

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const snack = inject(MatSnackBar);
  const auth = inject(AuthService);
  const router = inject(Router);
  return next(req).pipe(catchError((error: HttpErrorResponse) => {
    if (error.status === 401 || error.status === 403) {
      snack.open('Sesion expirada o sin permisos', 'Cerrar', { duration: 3500 });
      auth.logout();
      router.navigateByUrl('/login');
    } else if (error.status === 0) {
      snack.open('API no disponible. Revisa que el backend este corriendo en localhost:8080', 'Cerrar', { duration: 4500 });
    } else {
      snack.open(error.error?.message ?? 'No se pudo completar la accion', 'Cerrar', { duration: 3500 });
    }
    return throwError(() => error);
  }));
};
