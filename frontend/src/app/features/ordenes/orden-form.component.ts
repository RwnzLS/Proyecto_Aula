import { Component, EventEmitter, OnInit, Output, computed, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '../../core/api.service';
import { Producto, Proveedor } from '../../core/models';
import { NotifyService } from '../../shared/notify.service';

@Component({
  selector: 'app-orden-form',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    DatePipe,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatSelectModule,
    MatStepperModule,
    MatTooltipModule
  ],
  template: `
    <div class="form-panel orden-form">
      <div class="panel-head">
        <div class="panel-title">
          <h2>Nueva orden de compra</h2>
          <p>Sigue los tres pasos: proveedor, items y confirmacion.</p>
        </div>
        <button mat-stroked-button type="button" (click)="limpiarOrden()" matTooltip="Reiniciar todo el formulario">
          <mat-icon>backspace</mat-icon>
          Limpiar
        </button>
      </div>

      @if (loading()) {
        <mat-progress-bar mode="indeterminate" />
      }

      <mat-stepper linear #stepper>
        <mat-step [stepControl]="proveedorGroup" label="Proveedor" state="provider">
          <form [formGroup]="proveedorGroup" class="step-body">
            <div class="grid form-grid">
              <mat-form-field appearance="outline">
                <mat-label>Proveedor</mat-label>
                <mat-select formControlName="proveedorId" (selectionChange)="sugerirPreciosOrden()" cdkFocusInitial>
                  @for (p of proveedores; track p.id) {
                    <mat-option [value]="p.id">{{ p.nombre }}</mat-option>
                  }
                </mat-select>
                <mat-error *ngIf="proveedorGroup.controls.proveedorId.hasError('required') || proveedorGroup.controls.proveedorId.hasError('min')">
                  Selecciona un proveedor.
                </mat-error>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Fecha esperada</mat-label>
                <input matInput type="date" formControlName="fechaEsperada">
              </mat-form-field>
              <mat-form-field appearance="outline" class="span-2">
                <mat-label>Observaciones</mat-label>
                <input matInput formControlName="observaciones" placeholder="Notas internas opcionales">
              </mat-form-field>
            </div>
            <div class="step-actions">
              <button mat-raised-button color="primary" type="button" [disabled]="proveedorGroup.invalid" matStepperNext>
                Continuar
                <mat-icon iconPositionEnd>arrow_forward</mat-icon>
              </button>
            </div>
          </form>
        </mat-step>

        <mat-step [stepControl]="detallesArray" label="Items" state="items">
          <form [formGroup]="detallesGroup" class="step-body">
            <div formArrayName="detalles" class="grid lines-grid">
              @for (row of detallesArray.controls; track $index) {
                <div [formGroupName]="$index" class="linea">
                  <mat-form-field appearance="outline" class="linea-producto">
                    <mat-label>Producto</mat-label>
                    <input matInput
                      [matAutocomplete]="auto"
                      [value]="productoLabel($index)"
                      (input)="onProductoInput($index, $event)"
                      placeholder="Buscar producto...">
                    <mat-autocomplete #auto="matAutocomplete" (optionSelected)="onProductoSeleccion($index, $event.option.value)" [displayWith]="productoDisplay">
                      @for (p of filtrarProductos($index); track p.id) {
                        <mat-option [value]="p">{{ p.nombre }} <span class="opt-meta">({{ p.codigo }})</span></mat-option>
                      }
                    </mat-autocomplete>
                    <mat-error *ngIf="row.get('productoId')?.hasError('required') || row.get('productoId')?.hasError('min')">Producto obligatorio.</mat-error>
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="linea-num">
                    <mat-label>Cantidad</mat-label>
                    <input matInput type="number" min="1" formControlName="cantidadSolicitada" (input)="recomputarTotal()">
                    <mat-error *ngIf="row.get('cantidadSolicitada')?.hasError('min')">Minimo 1.</mat-error>
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="linea-num">
                    <mat-label>Precio</mat-label>
                    <input matInput type="number" min="0" step="0.01" formControlName="precioUnitario" (input)="recomputarTotal()">
                    <mat-error *ngIf="row.get('precioUnitario')?.hasError('min')">No negativo.</mat-error>
                  </mat-form-field>
                  <div class="linea-subtotal" aria-live="polite">
                    <span class="u-text-muted">Subtotal</span>
                    <strong>{{ subtotalLinea($index) | currency:'COP' }}</strong>
                  </div>
                  <button mat-icon-button type="button" title="Eliminar linea" [disabled]="detallesArray.length === 1" (click)="removeDetalle($index)">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
              }
            </div>
            <div class="step-actions step-actions--split">
              <button mat-stroked-button type="button" (click)="addDetalle()">
                <mat-icon>add</mat-icon>
                Agregar linea
              </button>
              <div class="step-actions">
                <button mat-button type="button" matStepperPrevious>
                  <mat-icon>arrow_back</mat-icon>
                  Atras
                </button>
                <button mat-raised-button color="primary" type="button" [disabled]="detallesArray.invalid" matStepperNext>
                  Revisar
                  <mat-icon iconPositionEnd>arrow_forward</mat-icon>
                </button>
              </div>
            </div>
          </form>
        </mat-step>

        <mat-step label="Confirmar" state="confirm">
          <div class="step-body resumen">
            <div class="resumen-grid">
              <div>
                <span class="u-text-muted">Proveedor</span>
                <strong>{{ proveedorActual()?.nombre || '—' }}</strong>
              </div>
              <div>
                <span class="u-text-muted">Fecha esperada</span>
                <strong>{{ fechaEsperada() ? (fechaEsperada() | date:'mediumDate') : '—' }}</strong>
              </div>
              <div class="resumen-obs" *ngIf="observaciones()">
                <span class="u-text-muted">Observaciones</span>
                <strong>{{ observaciones() }}</strong>
              </div>
            </div>
            <div class="resumen-tabla">
              <table class="lineas">
                <thead><tr><th>Producto</th><th class="num">Cantidad</th><th class="num">Precio</th><th class="num">Subtotal</th></tr></thead>
                <tbody>
                  @for (row of detallesArray.controls; track $index) {
                    <tr>
                      <td>{{ productoLabel($index) || '—' }}</td>
                      <td class="num">{{ row.get('cantidadSolicitada')?.value }}</td>
                      <td class="num">{{ row.get('precioUnitario')?.value | currency:'COP' }}</td>
                      <td class="num">{{ subtotalLinea($index) | currency:'COP' }}</td>
                    </tr>
                  }
                </tbody>
                <tfoot>
                  <tr><td colspan="3" class="num"><strong>Total</strong></td><td class="num"><strong>{{ totalOrden() | currency:'COP' }}</strong></td></tr>
                </tfoot>
              </table>
            </div>
            <div class="step-actions step-actions--split">
              <button mat-button type="button" matStepperPrevious>
                <mat-icon>arrow_back</mat-icon>
                Editar items
              </button>
              <button mat-raised-button color="primary" type="button" [disabled]="ordenInvalid() || loading()" (click)="crearOrden()">
                <mat-icon>check_circle</mat-icon>
                Crear orden
              </button>
            </div>
          </div>
        </mat-step>
      </mat-stepper>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .orden-form .panel-head {
      margin: calc(var(--app-space-5) * -1) calc(var(--app-space-5) * -1) var(--app-space-5);
    }
    .step-body { display: grid; gap: var(--app-space-4); padding: var(--app-space-4) 0; }
    .step-actions {
      display: flex;
      gap: var(--app-space-3);
      align-items: center;
      flex-wrap: wrap;
    }
    .step-actions--split { justify-content: space-between; }

    .lines-grid { gap: var(--app-space-3); }
    .linea {
      display: grid;
      grid-template-columns: minmax(220px, 2fr) 100px 130px 130px 44px;
      gap: var(--app-space-3);
      align-items: center;
      padding: var(--app-space-3);
      background: var(--app-surface-soft);
      border: 1px solid var(--app-border);
      border-radius: var(--app-radius-2);
    }
    .linea-num { width: 100%; }
    .linea-subtotal {
      display: grid;
      gap: 2px;
      font-variant-numeric: tabular-nums;
    }
    .linea-subtotal strong { color: var(--app-heading); }
    .opt-meta { color: var(--app-muted); font-size: var(--app-font-12); }

    .resumen-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: var(--app-space-4);
    }
    .resumen-grid > div { display: grid; gap: 2px; }
    .resumen-grid strong { color: var(--app-heading); }
    .resumen-obs { grid-column: 1 / -1; }

    .resumen-tabla { overflow-x: auto; }
    .lineas {
      width: 100%;
      border-collapse: collapse;
      background: var(--app-surface);
      border-radius: var(--app-radius-2);
      overflow: hidden;
      border: 1px solid var(--app-border);
    }
    .lineas th, .lineas td {
      padding: var(--app-space-2) var(--app-space-3);
      text-align: left;
      border-bottom: 1px solid var(--app-border);
    }
    .lineas th { color: var(--app-muted); background: var(--app-surface-soft); font-weight: var(--app-weight-semibold); }
    .lineas td.num, .lineas th.num { text-align: right; font-variant-numeric: tabular-nums; }
    .lineas tfoot td { border-bottom: none; padding-top: var(--app-space-3); }

    .span-2 { grid-column: span 2; }

    @media (max-width: 760px) {
      .linea { grid-template-columns: 1fr 1fr; }
      .linea-producto { grid-column: 1 / -1; }
      .span-2 { grid-column: auto; }
    }
  `]
})
export class OrdenFormComponent implements OnInit {
  @Output() saved = new EventEmitter<void>();

  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  private readonly notify = inject(NotifyService);

  readonly loading = signal(false);
  productos: Producto[] = [];
  proveedores: Proveedor[] = [];
  private readonly productoInputs = signal<string[]>(['']);
  private readonly totalSignal = signal(0);

  readonly proveedorGroup = this.fb.nonNullable.group({
    proveedorId: [0, [Validators.required, Validators.min(1)]],
    fechaEsperada: [''],
    observaciones: ['']
  });

  readonly detallesGroup = this.fb.nonNullable.group({
    detalles: this.fb.array([this.crearLinea()])
  });

  get detallesArray(): FormArray {
    return this.detallesGroup.controls.detalles;
  }

  readonly proveedorActual = computed(() => {
    const id = this.proveedorGroup.controls.proveedorId.value;
    return this.proveedores.find(p => p.id === id);
  });

  fechaEsperada = () => this.proveedorGroup.controls.fechaEsperada.value;
  observaciones = () => this.proveedorGroup.controls.observaciones.value;

  ngOnInit() {
    this.loadCatalogos();
  }

  loadCatalogos() {
    this.api.productos({ size: 200 }).subscribe(page => this.productos = page.content);
    this.api.proveedores({ size: 200 }).subscribe(page => this.proveedores = page.content);
  }

  private crearLinea() {
    return this.fb.nonNullable.group({
      productoId: [0, [Validators.required, Validators.min(1)]],
      cantidadSolicitada: [1, [Validators.required, Validators.min(1)]],
      precioUnitario: [0, [Validators.required, Validators.min(0)]]
    });
  }

  addDetalle() {
    this.detallesArray.push(this.crearLinea());
    this.productoInputs.update(values => [...values, '']);
  }

  removeDetalle(index: number) {
    if (this.detallesArray.length <= 1) return;
    this.detallesArray.removeAt(index);
    this.productoInputs.update(values => values.filter((_, i) => i !== index));
    this.recomputarTotal();
  }

  limpiarOrden() {
    while (this.detallesArray.length > 1) this.detallesArray.removeAt(1);
    this.detallesArray.at(0).reset({ productoId: 0, cantidadSolicitada: 1, precioUnitario: 0 });
    this.productoInputs.set(['']);
    this.proveedorGroup.reset({ proveedorId: 0, fechaEsperada: '', observaciones: '' });
    this.recomputarTotal();
  }

  productoLabel(index: number): string {
    const productoId = Number(this.detallesArray.at(index).get('productoId')?.value);
    if (productoId) {
      const producto = this.productos.find(p => p.id === productoId);
      if (producto) return producto.nombre;
    }
    return this.productoInputs()[index] ?? '';
  }

  productoDisplay = (value: Producto | string | null): string => {
    if (!value) return '';
    return typeof value === 'string' ? value : value.nombre;
  };

  onProductoInput(index: number, event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.productoInputs.update(values => values.map((v, i) => i === index ? value : v));
    if (this.productoLabel(index) !== value) {
      this.detallesArray.at(index).patchValue({ productoId: 0 });
    }
  }

  onProductoSeleccion(index: number, producto: Producto) {
    this.detallesArray.at(index).patchValue({ productoId: producto.id });
    this.productoInputs.update(values => values.map((v, i) => i === index ? producto.nombre : v));
    this.sugerirPrecio(index);
  }

  filtrarProductos(index: number): Producto[] {
    const term = (this.productoInputs()[index] ?? '').trim().toLowerCase();
    if (!term) return this.productos.slice(0, 20);
    return this.productos
      .filter(p => p.nombre.toLowerCase().includes(term) || p.codigo?.toLowerCase().includes(term))
      .slice(0, 20);
  }

  subtotalLinea(index: number): number {
    const row = this.detallesArray.at(index);
    const cantidad = Number(row.get('cantidadSolicitada')?.value) || 0;
    const precio = Number(row.get('precioUnitario')?.value) || 0;
    return cantidad * precio;
  }

  totalOrden(): number {
    return this.totalSignal();
  }

  recomputarTotal() {
    const total = this.detallesArray.controls.reduce((sum, row) => {
      const cantidad = Number(row.get('cantidadSolicitada')?.value) || 0;
      const precio = Number(row.get('precioUnitario')?.value) || 0;
      return sum + cantidad * precio;
    }, 0);
    this.totalSignal.set(total);
  }

  ordenInvalid(): boolean {
    return this.proveedorGroup.invalid || this.detallesArray.invalid;
  }

  sugerirPreciosOrden() {
    this.detallesArray.controls.forEach((_, index) => this.sugerirPrecio(index));
  }

  sugerirPrecio(index: number) {
    const proveedorId = Number(this.proveedorGroup.controls.proveedorId.value);
    const row = this.detallesArray.at(index);
    const productoId = Number(row.get('productoId')?.value);
    if (!proveedorId || !productoId) return;

    this.api.ultimoPrecio({ proveedorId, productoId }).subscribe({
      next: precio => {
        row.patchValue({ precioUnitario: Number(precio.precioUnitario) });
        this.recomputarTotal();
      },
      error: () => {}
    });
  }

  crearOrden() {
    if (this.ordenInvalid()) {
      this.proveedorGroup.markAllAsTouched();
      this.detallesArray.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    const payload = {
      ...this.proveedorGroup.getRawValue(),
      detalles: this.detallesArray.getRawValue()
    };
    this.api.crearOrden(payload).subscribe({
      next: () => {
        this.notify.success('Orden creada');
        this.limpiarOrden();
        this.loading.set(false);
        this.saved.emit();
      },
      error: () => this.loading.set(false)
    });
  }
}
