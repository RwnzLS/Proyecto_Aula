import { Component, Inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Proveedor } from '../../core/models';

@Component({
  selector: 'app-proveedor-form-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MatButtonModule, MatDialogModule, MatFormFieldModule, MatIconModule, MatInputModule],
  template: `
    <h2 mat-dialog-title>{{ data.proveedor ? 'Editar proveedor' : 'Crear proveedor' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="grid form-grid">
        <mat-form-field appearance="outline"><mat-label>Nombre</mat-label><input matInput formControlName="nombre"></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>RUC/NIT</mat-label><input matInput formControlName="rucNit"></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Email</mat-label><input matInput formControlName="email"></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Telefono</mat-label><input matInput formControlName="telefono"></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Direccion</mat-label><input matInput formControlName="direccion"></mat-form-field>
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
export class ProveedorFormDialogComponent {
  form = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    rucNit: [''],
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
    this.dialogRef.close(this.form.getRawValue());
  }
}
