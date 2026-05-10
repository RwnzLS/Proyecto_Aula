import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService } from '../../core/api.service';
import { Producto, Proveedor } from '../../core/models';

@Component({
  selector: 'app-orden-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CurrencyPipe,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatSelectModule,
    MatSnackBarModule
  ],
  template: `
    <div class="form-panel">
      <div class="panel-head">
        <div class="panel-title">
          <h2>Nueva orden de compra</h2>
          <p>Selecciona proveedor y agrega al menos un producto solicitado.</p>
        </div>
        <button mat-stroked-button type="button" (click)="limpiarOrden()">
          <mat-icon>backspace</mat-icon>
          Limpiar
        </button>
      </div>
      <form [formGroup]="ordenForm" (ngSubmit)="crearOrden()" class="grid">
        @if (loading) {
          <mat-progress-bar mode="indeterminate" />
        }
        <div class="grid form-grid">
          <mat-form-field appearance="outline">
            <mat-label>Proveedor</mat-label>
            <mat-select formControlName="proveedorId">
              @for (p of proveedores; track p.id) {
                <mat-option [value]="p.id">{{ p.nombre }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Fecha esperada</mat-label><input matInput type="date" formControlName="fechaEsperada"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Observaciones</mat-label><input matInput formControlName="observaciones"></mat-form-field>
        </div>
        <div formArrayName="detalles" class="grid">
          @for (row of detalles.controls; track $index) {
            <div [formGroupName]="$index" class="grid form-grid">
              <mat-form-field appearance="outline">
                <mat-label>Producto</mat-label>
                <mat-select formControlName="productoId">
                  @for (p of productos; track p.id) {
                    <mat-option [value]="p.id">{{ p.nombre }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Cantidad</mat-label><input matInput type="number" formControlName="cantidadSolicitada"></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Precio</mat-label><input matInput type="number" formControlName="precioUnitario"></mat-form-field>
              <button mat-icon-button type="button" title="Eliminar" [disabled]="detalles.length === 1" (click)="removeDetalle($index)"><mat-icon>delete</mat-icon></button>
            </div>
          }
        </div>
        <div class="actions">
          <button mat-stroked-button type="button" (click)="addDetalle()"><mat-icon>add</mat-icon>Fila</button>
          <strong class="inline-total">Total: {{ totalOrden() | currency:'COP' }}</strong>
          <button mat-raised-button color="primary" type="submit" [disabled]="ordenForm.invalid || loading"><mat-icon>send</mat-icon>Crear</button>
        </div>
      </form>
    </div>
  `
})
export class OrdenFormComponent implements OnInit {
  @Output() saved = new EventEmitter<void>();
  loading = false;
  productos: Producto[] = [];
  proveedores: Proveedor[] = [];
  ordenForm = this.fb.nonNullable.group({
    proveedorId: [0, [Validators.required, Validators.min(1)]],
    fechaEsperada: [''],
    observaciones: [''],
    detalles: this.fb.array([])
  });

  constructor(private api: ApiService, private fb: FormBuilder, private snack: MatSnackBar) {}

  get detalles(): FormArray {
    return this.ordenForm.controls.detalles;
  }

  ngOnInit() {
    this.addDetalle();
    this.loadCatalogos();
  }

  loadCatalogos() {
    this.api.productos({ size: 100 }).subscribe(page => this.productos = page.content);
    this.api.proveedores({ size: 100 }).subscribe(page => this.proveedores = page.content);
  }

  addDetalle() {
    this.detalles.push(this.fb.nonNullable.group({
      productoId: [0, [Validators.required, Validators.min(1)]],
      cantidadSolicitada: [1, [Validators.required, Validators.min(1)]],
      precioUnitario: [0, [Validators.required, Validators.min(0)]]
    }));
  }

  removeDetalle(index: number) {
    if (this.detalles.length > 1) {
      this.detalles.removeAt(index);
    }
  }

  limpiarOrden() {
    this.detalles.clear();
    this.addDetalle();
    this.ordenForm.reset({ proveedorId: 0, fechaEsperada: '', observaciones: '' });
  }

  totalOrden() {
    return this.detalles.controls.reduce((sum, control) => {
      const value = control.value;
      return sum + (Number(value.cantidadSolicitada) || 0) * (Number(value.precioUnitario) || 0);
    }, 0);
  }

  crearOrden() {
    if (this.ordenForm.invalid) return;
    this.loading = true;
    this.api.crearOrden(this.ordenForm.getRawValue()).subscribe({
      next: () => {
        this.snack.open('Orden creada', 'Cerrar', { duration: 2500 });
        this.detalles.clear();
        this.addDetalle();
        this.ordenForm.reset({ proveedorId: 0, fechaEsperada: '', observaciones: '' });
        this.loading = false;
        this.saved.emit();
      },
      error: () => {
        this.loading = false;
      }
    });
  }
}
