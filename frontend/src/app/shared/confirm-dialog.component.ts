import { Component, HostBinding, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';

export type ConfirmVariant = 'default' | 'danger';

export interface ConfirmDialogData {
  title?: string;
  message?: string;
  mensaje?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [MatButtonModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title>{{ title }}</h2>
    <mat-dialog-content>{{ message }}</mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close cdkFocusInitial>{{ cancelLabel }}</button>
      <button
        mat-raised-button
        [color]="variant === 'danger' ? 'warn' : 'primary'"
        [mat-dialog-close]="true">
        {{ confirmLabel }}
      </button>
    </mat-dialog-actions>
  `
})
export class ConfirmDialogComponent {
  readonly title: string;
  readonly message: string;
  readonly confirmLabel: string;
  readonly cancelLabel: string;
  readonly variant: ConfirmVariant;

  @HostBinding('attr.role') readonly role = 'alertdialog';

  constructor(@Inject(MAT_DIALOG_DATA) data: ConfirmDialogData) {
    this.title = data.title ?? 'Confirmar';
    this.message = data.message ?? data.mensaje ?? '';
    this.confirmLabel = data.confirmLabel ?? 'Confirmar';
    this.cancelLabel = data.cancelLabel ?? 'Cancelar';
    this.variant = data.variant ?? 'default';
  }
}
