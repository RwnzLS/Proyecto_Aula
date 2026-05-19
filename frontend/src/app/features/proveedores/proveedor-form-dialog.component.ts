import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Proveedor } from '../../core/models';

@Component({
  selector: 'app-proveedor-form-dialog',
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
    <h2 mat-dialog-title>{{ data.proveedor ? 'Editar proveedor' : 'Crear proveedor' }}</h2>
    <form [formGroup]="form" (ngSubmit)="save()" novalidate>
      <mat-dialog-content>
        <div class="grid form-grid">
          <mat-form-field appearance="outline" class="span-2">
            <mat-label>Nombre</mat-label>
            <input matInput formControlName="nombre" cdkFocusInitial required>
            <mat-error *ngIf="form.controls.nombre.hasError('required')">Nombre es obligatorio.</mat-error>
            <mat-error *ngIf="form.controls.nombre.hasError('maxlength')">Maximo 120 caracteres.</mat-error>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>RUC/NIT</mat-label>
            <input matInput formControlName="rucNit" required>
            <mat-error *ngIf="form.controls.rucNit.hasError('required')">RUC/NIT es obligatorio.</mat-error>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Telefono</mat-label>
            <input matInput formControlName="telefono" inputmode="tel">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Email</mat-label>
            <input matInput formControlName="email" type="email" inputmode="email">
            <mat-error *ngIf="form.controls.email.hasError('email')">Formato de email invalido.</mat-error>
          </mat-form-field>
          <mat-form-field appearance="outline" class="span-2">
            <mat-label>Direccion</mat-label>
            <input matInput formControlName="direccion">
          </mat-form-field>
          <div class="toggle-row span-2">
            <mat-slide-toggle formControlName="activo">Proveedor activo</mat-slide-toggle>
            <span class="toggle-note">Los inactivos no aparecen en sugerencias automaticas.</span>
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
export class ProveedorFormDialogComponent {
  form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(120)]],
    rucNit: ['', Validators.required],
    email: ['', Validators.email],
    telefono: [''],
    direccion: [''],
    activo: [true]
  });

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ProveedorFormDialogComponent, Partial<Proveedor>>,
    @Inject(MAT_DIALOG_DATA) public data: { proveedor?: Proveedor }
  ) {
    if (data.proveedor) {
      this.form.patchValue(data.proveedor);
    }
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.dialogRef.close(this.form.getRawValue());
  }
}
