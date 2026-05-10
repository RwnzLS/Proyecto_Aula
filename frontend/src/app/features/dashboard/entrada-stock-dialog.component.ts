import { Component, Inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Producto } from '../../core/models';

export interface EntradaStockDialogResult {
  productoId: number;
  cantidad: number;
  motivo: string;
}

@Component({
  selector: 'app-entrada-stock-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MatButtonModule, MatDialogModule, MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule],
  template: `
    <h2 mat-dialog-title>Registrar entrada</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="grid">
        <mat-form-field appearance="outline">
          <mat-label>Producto</mat-label>
          <mat-select formControlName="productoId">
            @for (producto of data.productos; track producto.id) {
              <mat-option [value]="producto.id">{{ producto.nombre }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Cantidad</mat-label>
          <input matInput type="number" formControlName="cantidad">
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Referencia</mat-label>
          <input matInput formControlName="motivo">
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-raised-button color="primary" [disabled]="form.invalid" (click)="confirmar()">
        <mat-icon>inventory</mat-icon>
        Registrar
      </button>
    </mat-dialog-actions>
  `
})
export class EntradaStockDialogComponent {
  form = this.fb.nonNullable.group({
    productoId: [this.data.producto?.id ?? 0, [Validators.required, Validators.min(1)]],
    cantidad: [1, [Validators.required, Validators.min(1)]],
    motivo: ['Entrada manual', Validators.required]
  });

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<EntradaStockDialogComponent, EntradaStockDialogResult>,
    @Inject(MAT_DIALOG_DATA) public data: { productos: Producto[]; producto?: Producto }
  ) {}

  confirmar() {
    const value = this.form.getRawValue();
    this.dialogRef.close({
      productoId: Number(value.productoId),
      cantidad: Math.abs(Number(value.cantidad) || 0),
      motivo: value.motivo
    });
  }
}
