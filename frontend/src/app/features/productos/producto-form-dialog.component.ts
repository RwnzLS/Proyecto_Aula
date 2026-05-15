import { Component, Inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Producto } from '../../core/models';

@Component({
  selector: 'app-producto-form-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MatButtonModule, MatDialogModule, MatFormFieldModule, MatIconModule, MatInputModule],
  template: `
    <h2 mat-dialog-title>{{ data.producto ? 'Editar producto' : 'Crear producto' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="grid form-grid">
        <mat-form-field appearance="outline"><mat-label>Nombre</mat-label><input matInput formControlName="nombre"></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Codigo</mat-label><input matInput formControlName="codigo"></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Categoria</mat-label><input matInput formControlName="categoria"></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Descripcion</mat-label><input matInput formControlName="descripcion"></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Stock</mat-label><input matInput type="number" formControlName="cantidadStock" [readonly]="!!data.producto"></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Minimo</mat-label><input matInput type="number" formControlName="stockMinimo"></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Unidad</mat-label><input matInput formControlName="unidadMedida"></mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-raised-button color="primary" [disabled]="form.invalid" (click)="save()">
        <mat-icon>save</mat-icon>
        Guardar
      </button>
    </mat-dialog-actions>
  `
})
export class ProductoFormDialogComponent {
  form = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    descripcion: [''],
    codigo: ['', Validators.required],
    categoria: [''],
    cantidadStock: [0],
    stockMinimo: [0],
    unidadMedida: ['unidad'],
    activo: [true]
  });

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ProductoFormDialogComponent, Partial<Producto>>,
    @Inject(MAT_DIALOG_DATA) public data: { producto?: Producto }
  ) {
    if (data.producto) {
      this.form.patchValue(data.producto);
    }
  }

  save() {
    const value = this.form.getRawValue();
    this.dialogRef.close({
      ...value,
      cantidadStock: Number(value.cantidadStock) || 0,
      stockMinimo: Number(value.stockMinimo) || 0
    });
  }
}
