import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Producto } from '../../core/models';

@Component({
  selector: 'app-producto-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSlideToggleModule
  ],
  template: `
    <h2 mat-dialog-title>{{ data.producto ? 'Editar producto' : 'Crear producto' }}</h2>
    <form [formGroup]="form" (ngSubmit)="save()" novalidate>
      <mat-dialog-content>
        <div class="grid form-grid">
          <mat-form-field appearance="outline">
            <mat-label>Nombre</mat-label>
            <input matInput formControlName="nombre" cdkFocusInitial required>
            <mat-error *ngIf="form.controls.nombre.hasError('required')">Nombre es obligatorio.</mat-error>
            <mat-error *ngIf="form.controls.nombre.hasError('maxlength')">Maximo 120 caracteres.</mat-error>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Codigo</mat-label>
            <input matInput formControlName="codigo" required>
            <mat-error *ngIf="form.controls.codigo.hasError('required')">Codigo es obligatorio.</mat-error>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Categoria</mat-label>
            <input matInput formControlName="categoria">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Unidad de medida</mat-label>
            <input matInput formControlName="unidadMedida">
          </mat-form-field>
          <mat-form-field appearance="outline" class="span-2">
            <mat-label>Descripcion</mat-label>
            <input matInput formControlName="descripcion">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Stock {{ data.producto ? '(no editable)' : 'inicial' }}</mat-label>
            <input matInput type="number" min="0" formControlName="cantidadStock" [readonly]="!!data.producto">
            <mat-hint *ngIf="data.producto">Usa "Ajustar stock" para modificarlo.</mat-hint>
            <mat-error *ngIf="form.controls.cantidadStock.hasError('min')">No puede ser negativo.</mat-error>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Stock minimo</mat-label>
            <input matInput type="number" min="0" formControlName="stockMinimo">
            <mat-error *ngIf="form.controls.stockMinimo.hasError('min')">No puede ser negativo.</mat-error>
          </mat-form-field>
          <div class="toggle-row span-2">
            <mat-slide-toggle formControlName="activo">Producto activo</mat-slide-toggle>
            <span class="toggle-note">Los inactivos no aparecen en filtros operativos.</span>
          </div>
        </div>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>Cancelar</button>
        <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid">
          <mat-icon>save</mat-icon>
          Guardar
        </button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [`
    .span-2 { grid-column: span 2; }
    .toggle-row {
      display: flex;
      align-items: center;
      gap: var(--app-space-3);
      padding: var(--app-space-3) 0;
    }
    .toggle-note {
      color: var(--app-muted);
      font-size: var(--app-font-13);
    }
    @media (max-width: 720px) {
      .span-2 { grid-column: auto; }
    }
  `]
})
export class ProductoFormDialogComponent {
  form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(120)]],
    descripcion: [''],
    codigo: ['', Validators.required],
    categoria: [''],
    cantidadStock: [0, Validators.min(0)],
    stockMinimo: [0, Validators.min(0)],
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
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.dialogRef.close({
      ...value,
      cantidadStock: Number(value.cantidadStock) || 0,
      stockMinimo: Number(value.stockMinimo) || 0
    });
  }
}
