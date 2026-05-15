import { Component, Inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Producto } from '../../core/models';

export interface AjusteStockDialogResult {
  cantidad: number;
  motivo: string;
}

const MOTIVOS_PREDEFINIDOS = ['Dano', 'Conteo fisico', 'Devolucion', 'Otro'] as const;
type MotivoPredefinido = typeof MOTIVOS_PREDEFINIDOS[number];

@Component({
  selector: 'app-ajuste-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule
  ],
  template: `
    <h2 mat-dialog-title>Ajustar stock</h2>
    <form [formGroup]="form" (ngSubmit)="confirmar()" novalidate>
      <mat-dialog-content>
        <p class="producto-line">
          <strong>{{ data.producto.nombre }}</strong>
          <span class="u-text-muted">Stock actual: {{ data.producto.cantidadStock }} {{ data.producto.unidadMedida }}</span>
        </p>
        <div class="grid u-stack-3">
          <mat-form-field appearance="outline">
            <mat-label>Cantidad</mat-label>
            <input matInput type="number" formControlName="cantidad" cdkFocusInitial>
            <mat-hint>Positivo suma, negativo resta.</mat-hint>
            <mat-error *ngIf="form.controls.cantidad.hasError('required')">Cantidad obligatoria.</mat-error>
            <mat-error *ngIf="form.controls.cantidad.hasError('zero')">No puede ser cero.</mat-error>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Motivo</mat-label>
            <mat-select formControlName="motivoPredefinido">
              <mat-option *ngFor="let m of motivos" [value]="m">{{ m }}</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field *ngIf="motivoPredefinido() === 'Otro'" appearance="outline">
            <mat-label>Detalle del motivo</mat-label>
            <input matInput formControlName="motivoOtro" placeholder="Describe el motivo">
            <mat-error *ngIf="form.controls.motivoOtro.hasError('required')">El detalle es obligatorio si eliges "Otro".</mat-error>
          </mat-form-field>
        </div>
        <p class="resultado" *ngIf="resultadoVisible()">
          Stock resultante:
          <strong [class.u-text-danger]="resultadoNegativo()">{{ stockResultante() }}</strong>
        </p>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>Cancelar</button>
        <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid">
          <mat-icon>check</mat-icon>
          Confirmar
        </button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [`
    .producto-line {
      display: flex;
      flex-direction: column;
      gap: 2px;
      margin: 0 0 var(--app-space-3);
    }
    .resultado {
      margin-top: var(--app-space-4);
      color: var(--app-muted);
    }
    .resultado strong {
      color: var(--app-heading);
      margin-left: var(--app-space-1);
      font-variant-numeric: tabular-nums;
    }
  `]
})
export class AjusteDialogComponent {
  readonly motivos = MOTIVOS_PREDEFINIDOS;

  form = this.fb.nonNullable.group({
    cantidad: [0, [Validators.required, (control: AbstractControl) => Number(control.value) === 0 ? { zero: true } : null]],
    motivoPredefinido: ['Conteo fisico' as MotivoPredefinido, Validators.required],
    motivoOtro: ['']
  });

  readonly motivoPredefinido = toSignal(this.form.controls.motivoPredefinido.valueChanges, {
    initialValue: this.form.controls.motivoPredefinido.value
  });

  private readonly cantidadSignal = toSignal(this.form.controls.cantidad.valueChanges, {
    initialValue: this.form.controls.cantidad.value
  });

  readonly stockResultante = computed(() => {
    const delta = Number(this.cantidadSignal()) || 0;
    return this.data.producto.cantidadStock + delta;
  });

  readonly resultadoNegativo = computed(() => this.stockResultante() < 0);
  readonly resultadoVisible = computed(() => Number(this.cantidadSignal()) !== 0);

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AjusteDialogComponent, AjusteStockDialogResult>,
    @Inject(MAT_DIALOG_DATA) public data: { producto: Producto }
  ) {
    this.form.controls.motivoPredefinido.valueChanges.subscribe(motivo => {
      const otro = this.form.controls.motivoOtro;
      if (motivo === 'Otro') {
        otro.setValidators(Validators.required);
      } else {
        otro.clearValidators();
        otro.setValue('', { emitEvent: false });
      }
      otro.updateValueAndValidity({ emitEvent: false });
    });
  }

  confirmar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const cantidad = Number(value.cantidad) || 0;
    if (cantidad === 0) return;
    const motivo = value.motivoPredefinido === 'Otro' ? value.motivoOtro.trim() : value.motivoPredefinido;
    this.dialogRef.close({ cantidad, motivo });
  }
}
