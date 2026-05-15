import { Component, Inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Producto } from '../../core/models';

export interface AjusteStockDialogResult {
  cantidad: number;
  motivo: string;
}

@Component({
  selector: 'app-ajuste-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MatButtonModule, MatDialogModule, MatFormFieldModule, MatIconModule, MatInputModule],
  template: `
    <h2 mat-dialog-title>Ajustar stock</h2>
    <mat-dialog-content>
      <p>{{ data.producto.nombre }}</p>
      <form [formGroup]="form" class="grid">
        <mat-form-field appearance="outline">
          <mat-label>Cantidad</mat-label>
          <input matInput type="number" formControlName="cantidad">
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Motivo</mat-label>
          <input matInput formControlName="motivo">
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-raised-button color="primary" [disabled]="form.invalid" (click)="confirmar()">
        <mat-icon>check</mat-icon>
        Confirmar
      </button>
    </mat-dialog-actions>
  `
})
export class AjusteDialogComponent {
  form = this.fb.nonNullable.group({
    cantidad: [0, [Validators.required, (control: AbstractControl) => Number(control.value) === 0 ? { zero: true } : null]],
    motivo: ['Ajuste manual', Validators.required]
  });

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AjusteDialogComponent, AjusteStockDialogResult>,
    @Inject(MAT_DIALOG_DATA) public data: { producto: Producto }
  ) {}

  confirmar() {
    const value = this.form.getRawValue();
    if (Number(value.cantidad) === 0) return;
    this.dialogRef.close({ cantidad: Number(value.cantidad) || 0, motivo: value.motivo });
  }
}
