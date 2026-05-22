import { Component, DestroyRef, Inject, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Producto, TipoMovimiento } from '../../core/models';

export interface StockMovementDialogResult {
  productoId: number;
  cantidad: number;
  referencia: string;
}

@Component({
  selector: 'app-stock-movement-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule
  ],
  template: `
    <h2 mat-dialog-title>{{ title }}</h2>
    <form [formGroup]="form" (ngSubmit)="confirmar()" novalidate>
      <mat-dialog-content>
        <div class="grid u-stack-3">
          <mat-form-field appearance="outline">
            <mat-label>Producto</mat-label>
            <input
              matInput
              [formControl]="productoSearch"
              [matAutocomplete]="auto"
              cdkFocusInitial
              placeholder="Busca por nombre o codigo">
            <mat-icon matSuffix>search</mat-icon>
            <mat-autocomplete
              #auto="matAutocomplete"
              [displayWith]="displayProducto"
              (optionSelected)="onProductoSelected($event)">
              <mat-option *ngFor="let p of productosFiltrados()" [value]="p">
                {{ p.nombre }} <small class="u-text-muted">- stock {{ p.cantidadStock }}</small>
              </mat-option>
            </mat-autocomplete>
            <mat-error *ngIf="form.controls.productoId.touched && form.controls.productoId.invalid">
              Selecciona un producto del listado.
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Cantidad</mat-label>
            <input matInput type="number" min="1" formControlName="cantidad">
            <mat-error *ngIf="form.controls.cantidad.hasError('required')">Cantidad obligatoria.</mat-error>
            <mat-error *ngIf="form.controls.cantidad.hasError('min')">Debe ser mayor a 0.</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Referencia</mat-label>
            <input matInput formControlName="referencia">
            <mat-error *ngIf="form.controls.referencia.hasError('required')">Indica una referencia.</mat-error>
          </mat-form-field>
        </div>

        <p *ngIf="productoSeleccionado()" class="preview" [class.preview--danger]="stockResultanteNegativo()">
          Stock actual <strong>{{ productoSeleccionado()!.cantidadStock }}</strong>
          <span class="preview__arrow">{{ data.tipo === 'ENTRADA' ? '+' : '-' }} {{ cantidadActual() }}</span>
          <span>= Stock resultante <strong>{{ stockResultante() }}</strong></span>
        </p>
        <p *ngIf="stockResultanteNegativo()" class="dialog-error" role="alert">
          <mat-icon>error_outline</mat-icon>
          La salida no puede superar el stock disponible.
        </p>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>Cancelar</button>
        <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid || stockResultanteNegativo()">
          <mat-icon>{{ data.tipo === 'ENTRADA' ? 'add_box' : 'remove_circle' }}</mat-icon>
          Registrar
        </button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [`
    .preview {
      margin: var(--app-space-3) 0 0;
      padding: var(--app-space-3) var(--app-space-4);
      border: 1px solid var(--app-border);
      border-radius: var(--app-radius-3);
      background: var(--app-surface-muted);
      color: var(--app-muted-strong);
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: var(--app-space-2);
    }
    .preview strong {
      color: var(--app-heading);
      font-variant-numeric: tabular-nums;
    }
    .preview__arrow {
      font-weight: var(--app-weight-bold);
      color: var(--app-brand-strong);
    }
    .preview--danger {
      border-color: rgba(176, 56, 50, 0.36);
      background: rgba(176, 56, 50, 0.08);
    }
    .preview--danger strong { color: var(--app-danger); }
    .dialog-error {
      margin: var(--app-space-2) 0 0;
      display: flex;
      align-items: center;
      gap: var(--app-space-1);
      color: var(--app-danger);
      font-size: var(--app-font-13);
    }
    .dialog-error mat-icon { font-size: 16px; width: 16px; height: 16px; }
  `]
})
export class StockMovementDialogComponent {
  private readonly destroyRef = inject(DestroyRef);

  title = this.data.tipo === 'ENTRADA' ? 'Registrar entrada' : 'Registrar salida';

  readonly productoSearch = new FormControl<Producto | string | null>(null, { nonNullable: false });

  form = this.fb.nonNullable.group({
    productoId: [this.data.producto?.id ?? 0, [Validators.required, Validators.min(1)]],
    cantidad: [1, [Validators.required, Validators.min(1)]],
    referencia: [this.data.tipo === 'ENTRADA' ? 'Entrada manual' : 'Salida manual', Validators.required]
  });

  private readonly searchSignal = toSignal(this.productoSearch.valueChanges, { initialValue: this.productoSearch.value });
  private readonly cantidadSignal = toSignal(this.form.controls.cantidad.valueChanges, { initialValue: this.form.controls.cantidad.value });
  private readonly productoIdSignal = toSignal(this.form.controls.productoId.valueChanges, { initialValue: this.form.controls.productoId.value });

  readonly productosFiltrados = computed<Producto[]>(() => {
    const term = this.searchSignal();
    if (term && typeof term === 'object') return this.data.productos;
    const q = (term ?? '').toString().toLowerCase().trim();
    if (!q) return this.data.productos;
    return this.data.productos.filter(p =>
      p.nombre.toLowerCase().includes(q) ||
      p.codigo?.toLowerCase().includes(q)
    );
  });

  readonly productoSeleccionado = computed<Producto | null>(() => {
    const id = Number(this.productoIdSignal()) || 0;
    if (!id) return null;
    return this.data.productos.find(p => p.id === id) ?? null;
  });

  readonly cantidadActual = computed(() => Math.abs(Number(this.cantidadSignal()) || 0));

  readonly stockResultante = computed(() => {
    const producto = this.productoSeleccionado();
    if (!producto) return 0;
    const delta = this.cantidadActual();
    return this.data.tipo === 'ENTRADA' ? producto.cantidadStock + delta : producto.cantidadStock - delta;
  });

  readonly stockResultanteNegativo = computed(() => this.stockResultante() < 0);

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<StockMovementDialogComponent, StockMovementDialogResult>,
    @Inject(MAT_DIALOG_DATA) public data: { productos: Producto[]; producto?: Producto; tipo: Exclude<TipoMovimiento, 'AJUSTE'> }
  ) {
    if (this.data.producto) {
      this.productoSearch.setValue(this.data.producto);
    }

    this.productoSearch.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(value => {
        if (value && typeof value === 'object') return;
        this.clearProductoSeleccionado(Boolean((value ?? '').toString().trim()));
      });
  }

  displayProducto = (producto: Producto | string | null): string => {
    if (!producto) return '';
    if (typeof producto === 'string') return producto;
    return producto.nombre;
  };

  onProductoSelected(event: MatAutocompleteSelectedEvent) {
    const producto = event.option.value as Producto;
    this.form.controls.productoId.setValue(producto.id);
    this.form.controls.productoId.markAsTouched();
  }

  confirmar() {
    if (this.form.invalid || this.stockResultanteNegativo()) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.dialogRef.close({
      productoId: Number(value.productoId),
      cantidad: Math.abs(Number(value.cantidad) || 0),
      referencia: value.referencia
    });
  }

  private clearProductoSeleccionado(markTouched: boolean) {
    if (this.form.controls.productoId.value !== 0) {
      this.form.controls.productoId.setValue(0);
    }

    if (markTouched) {
      this.form.controls.productoId.markAsTouched();
    }
  }
}
