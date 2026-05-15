import { Injectable, inject } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

export type NotifyVariant = 'success' | 'info' | 'warning' | 'error';

const DEFAULT_DURATIONS: Record<NotifyVariant, number> = {
  success: 3000,
  info: 3000,
  warning: 4000,
  error: 4500
};

@Injectable({ providedIn: 'root' })
export class NotifyService {
  private readonly snack = inject(MatSnackBar);

  success(message: string, action: string = 'Cerrar', config?: MatSnackBarConfig): void {
    this.open('success', message, action, config);
  }

  info(message: string, action: string = 'Cerrar', config?: MatSnackBarConfig): void {
    this.open('info', message, action, config);
  }

  warning(message: string, action: string = 'Cerrar', config?: MatSnackBarConfig): void {
    this.open('warning', message, action, config);
  }

  error(message: string, action: string = 'Cerrar', config?: MatSnackBarConfig): void {
    this.open('error', message, action, config);
  }

  private open(variant: NotifyVariant, message: string, action: string, config?: MatSnackBarConfig): void {
    const baseClasses = ['app-notify', `notify-${variant}`];
    const extraClasses = config?.panelClass;
    const panelClass = extraClasses
      ? [...baseClasses, ...(Array.isArray(extraClasses) ? extraClasses : [extraClasses])]
      : baseClasses;

    this.snack.open(message, action, {
      duration: DEFAULT_DURATIONS[variant],
      verticalPosition: 'top',
      horizontalPosition: 'center',
      ...config,
      panelClass
    });
  }
}
