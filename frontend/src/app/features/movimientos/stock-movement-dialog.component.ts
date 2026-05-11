import { Component, Inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Producto, TipoMovimiento } from '../../core/models';

export interface StockMovementDialogResult {
  productoId: number;
  cantidad: number;
  referencia: string;
}

@Component({
  selector: 'app-stock-movement-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MatButtonModule, MatDialogModule, MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule],
  template: `
    <h2 mat-dialog-title>{{ title }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="grid">
        <mat-form-field appearance="outline">
          <mat-label>Producto</mat-label>
          <mat-select formControlName="productoId">
            @for (producto of data.productos; track producto.id) {
              <mat-option [value]="producto.id">{{ producto.nombre }} - stock {{ producto.cantidadStock }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Cantidad</mat-label>
          <input matInput type="number" formControlName="cantidad">
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Referencia</mat-label>
          <input matInput formControlName="referencia">
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-raised-button color="primary" [disabled]="form.invalid" (click)="confirmar()">
        <mat-icon>{{ data.tipo === 'ENTRADA' ? 'add_box' : 'remove_circle' }}</mat-icon>
        Registrar
      </button>
    </mat-dialog-actions>
  `
})
export class StockMovementDialogComponent {
  title = this.data.tipo === 'ENTRADA' ? 'Registrar entrada' : 'Registrar salida';
  form = this.fb.nonNullable.group({
    productoId: [this.data.producto?.id ?? 0, [Validators.required, Validators.min(1)]],
    cantidad: [1, [Validators.required, Validators.min(1)]],
    referencia: [this.data.tipo === 'ENTRADA' ? 'Entrada manual' : 'Salida manual', Validators.required]
  });

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<StockMovementDialogComponent, StockMovementDialogResult>,
    @Inject(MAT_DIALOG_DATA) public data: { productos: Producto[]; producto?: Producto; tipo: Exclude<TipoMovimiento, 'AJUSTE'> }
  ) {}

  confirmar() {
    const value = this.form.getRawValue();
    this.dialogRef.close({
      productoId: Number(value.productoId),
      cantidad: Math.abs(Number(value.cantidad) || 0),
      referencia: value.referencia
    });
  }
}
