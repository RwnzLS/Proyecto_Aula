import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '../../core/api.service';
import { PrecioProveedor, Producto, Proveedor } from '../../core/models';
import { NotifyService } from '../../shared/notify.service';
import { EmptyStateComponent } from '../../shared/empty-state.component';
import { PageHeaderComponent } from '../../shared/page-header.component';

const PRICE_CHART = {
  width: 640,
  height: 320,
  top: 20,
  right: 20,
  bottom: 48,
  left: 56
};

interface PriceChartPoint {
  x: number;
  y: number;
  fecha: string;
  fechaCorta: string;
  precio: number;
  moneda: string;
  producto: string;
}

interface PriceChartData {
  points: string;
  pointsData: PriceChartPoint[];
  yTicks: { y: number; value: number }[];
  xTicks: { x: number; label: string }[];
  moneda: string;
  plotLeft: number;
  plotRight: number;
}

@Component({
  selector: 'app-precios',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CurrencyPipe,
    DatePipe,
    MatButtonModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatSelectModule,
    MatTableModule,
    MatTooltipModule,
    EmptyStateComponent,
    PageHeaderComponent
  ],
  template: `
    <section class="module-page">
      <app-page-header eyebrow="Analitica de compras" title="Precios" subtitle="Registra precios por proveedor y revisa la tendencia historica por producto.">
        <button actions mat-stroked-button type="button" (click)="refresh()">
          <mat-icon>refresh</mat-icon>
          Actualizar
        </button>
      </app-page-header>

      <div class="form-panel">
        <div class="panel-head">
          <div class="panel-title">
            <h2>Registrar precio</h2>
            <p>La combinacion producto/proveedor se guarda como historial.</p>
          </div>
        </div>
        <form [formGroup]="precioForm" (ngSubmit)="registrarPrecio()" class="grid form-grid" novalidate>
          <mat-form-field appearance="outline">
            <mat-label>Producto</mat-label>
            <mat-select formControlName="productoId">
              @for (p of productos; track p.id) {
                <mat-option [value]="p.id">{{ p.nombre }}</mat-option>
              }
            </mat-select>
            <mat-error *ngIf="precioForm.controls.productoId.hasError('min')">Selecciona un producto.</mat-error>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Proveedor</mat-label>
            <mat-select formControlName="proveedorId">
              @for (p of proveedores; track p.id) {
                <mat-option [value]="p.id">{{ p.nombre }}</mat-option>
              }
            </mat-select>
            <mat-error *ngIf="precioForm.controls.proveedorId.hasError('min')">Selecciona un proveedor.</mat-error>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Precio</mat-label>
            <input matInput type="number" min="0" step="0.01" formControlName="precioUnitario">
            <mat-error *ngIf="precioForm.controls.precioUnitario.hasError('min')">No negativo.</mat-error>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Moneda</mat-label>
            <input matInput formControlName="moneda" maxlength="3">
          </mat-form-field>
          <button mat-raised-button color="primary" type="submit" [disabled]="precioForm.invalid">
            <mat-icon>add_chart</mat-icon>
            Registrar
          </button>
        </form>
      </div>

      <div class="filter-panel filter-panel--chips">
        <div class="filter-stack">
          <mat-form-field appearance="outline" class="filter-select">
            <mat-label>Producto del grafico</mat-label>
            <mat-select [formControl]="productoFiltro">
              <mat-option [value]="null">Todos</mat-option>
              @for (p of productos; track p.id) {
                <mat-option [value]="p.id">{{ p.nombre }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          <mat-chip-set aria-label="Filtros activos" class="chip-filters">
            @if (filtroSeleccionado(); as filtro) {
              <mat-chip class="chip-active" (removed)="limpiarFiltroGrafico()">
                <mat-icon matChipAvatar>inventory_2</mat-icon>
                {{ filtro.nombre }}
                <button matChipRemove aria-label="Quitar filtro">
                  <mat-icon>cancel</mat-icon>
                </button>
              </mat-chip>
            } @else {
              <span class="u-text-muted chip-empty">Sin filtros activos</span>
            }
          </mat-chip-set>
        </div>
        <div class="resumen-mini" *ngIf="resumen() as r">
          <div class="resumen-cell">
            <span class="u-text-muted">Ultimo precio</span>
            <strong>{{ r.ultimo | currency:'COP' }}</strong>
          </div>
          <div class="resumen-cell">
            <span class="u-text-muted">Variacion</span>
            <strong [class]="r.delta > 0 ? 'u-text-warning' : r.delta < 0 ? 'u-text-success' : 'u-text-muted'">
              <mat-icon>{{ r.delta > 0 ? 'trending_up' : r.delta < 0 ? 'trending_down' : 'trending_flat' }}</mat-icon>
              {{ r.delta > 0 ? '+' : '' }}{{ r.delta | number:'1.0-2' }}%
            </strong>
          </div>
          <div class="sparkline-wrap" matTooltip="Tendencia ultimas {{ r.serie.length }} muestras">
            <svg class="sparkline" viewBox="0 0 140 44" preserveAspectRatio="none" aria-hidden="true">
              <polyline *ngIf="sparklinePoints() as points" [attr.points]="points" />
            </svg>
          </div>
        </div>
      </div>

      @if (loading) {
        <mat-progress-bar mode="indeterminate" />
      }

      <div class="chart-box price-chart-box">
        <ng-container *ngIf="priceChartData() as chart">
          <svg
            *ngIf="chart.pointsData.length; else sinDatosGrafico"
            class="price-chart"
            viewBox="0 0 640 320"
            role="img"
            [attr.aria-label]="'Historial de precios con ' + chart.pointsData.length + ' registros'">
            <g class="price-grid">
              <line
                *ngFor="let tick of chart.yTicks"
                [attr.x1]="chart.plotLeft"
                [attr.x2]="chart.plotRight"
                [attr.y1]="tick.y"
                [attr.y2]="tick.y" />
            </g>
            <polyline class="price-line" [attr.points]="chart.points" />
            <g class="price-points">
              <circle *ngFor="let point of chart.pointsData" [attr.cx]="point.x" [attr.cy]="point.y" r="4" tabindex="0">
                <title>{{ point.producto }} - {{ point.fecha }} - {{ point.precio | currency:point.moneda }}</title>
              </circle>
            </g>
            <g class="price-axis price-axis-y">
              <text *ngFor="let tick of chart.yTicks" x="48" [attr.y]="tick.y + 4" text-anchor="end">
                {{ tick.value | currency:chart.moneda:'symbol':'1.0-0' }}
              </text>
            </g>
            <g class="price-axis price-axis-x">
              <text *ngFor="let tick of chart.xTicks" [attr.x]="tick.x" y="304" text-anchor="middle">
                {{ tick.label }}
              </text>
            </g>
          </svg>
          <ng-template #sinDatosGrafico>
            <app-empty-state icon="show_chart" title="Sin datos para graficar" message="Registra precios para construir el historial." />
          </ng-template>
        </ng-container>
      </div>

      <div class="data-panel">
        <div class="panel-head">
          <div class="panel-title">
            <h2>Historial de precios</h2>
            <p>{{ precios.length }} registros historicos</p>
          </div>
          <span class="count-pill">{{ preciosPagina.length }}</span>
        </div>
        @if (preciosPagina.length) {
          <div class="table-wrap">
            <table mat-table [dataSource]="preciosPagina">
              <ng-container matColumnDef="fecha"><th mat-header-cell *matHeaderCellDef>Fecha</th><td mat-cell *matCellDef="let p">{{ p.fechaRegistro | date:'short' }}</td></ng-container>
              <ng-container matColumnDef="producto"><th mat-header-cell *matHeaderCellDef>Producto</th><td mat-cell *matCellDef="let p">{{ p.producto.nombre }}</td></ng-container>
              <ng-container matColumnDef="proveedor"><th mat-header-cell *matHeaderCellDef>Proveedor</th><td mat-cell *matCellDef="let p">{{ p.proveedor.nombre }}</td></ng-container>
              <ng-container matColumnDef="precio"><th mat-header-cell *matHeaderCellDef>Precio</th><td mat-cell *matCellDef="let p">{{ p.precioUnitario | currency:p.moneda }}</td></ng-container>
              <tr mat-header-row *matHeaderRowDef="precioCols"></tr>
              <tr mat-row *matRowDef="let row; columns: precioCols;"></tr>
            </table>
            <mat-paginator [length]="precios.length" [pageIndex]="pageIndex" [pageSize]="pageSize" [pageSizeOptions]="[10,20,50]" (page)="onPage($event)" />
          </div>
        } @else {
          <app-empty-state icon="monitoring" title="No hay precios registrados" message="Registra un precio o cambia el producto seleccionado." />
        }
      </div>
    </section>
  `,
  styles: [`
    .filter-panel--chips {
      grid-template-columns: 1fr auto;
      align-items: center;
    }
    .filter-stack {
      display: grid;
      gap: var(--app-space-2);
    }
    .filter-select { max-width: 320px; }
    .chip-filters {
      display: flex;
      flex-wrap: wrap;
      gap: var(--app-space-2);
      min-height: 32px;
    }
    .chip-active {
      --mdc-chip-elevated-container-color: color-mix(in srgb, var(--app-brand) 12%, var(--app-surface));
      color: var(--app-brand-strong);
    }
    .chip-empty { font-size: var(--app-font-13); }
    .resumen-mini {
      display: flex;
      align-items: center;
      gap: var(--app-space-4);
      padding: var(--app-space-3) var(--app-space-4);
      border: 1px solid var(--app-border);
      border-radius: var(--app-radius-3);
      background: var(--app-surface-soft);
    }
    .resumen-cell {
      display: grid;
      gap: 2px;
      font-variant-numeric: tabular-nums;
    }
    .resumen-cell strong {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      color: var(--app-heading);
    }
    .resumen-cell strong mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .sparkline-wrap {
      width: 140px;
      height: 44px;
    }
    .sparkline {
      width: 100%;
      height: 100%;
      display: block;
      color: var(--app-brand);
    }
    .sparkline polyline {
      fill: none;
      stroke: currentColor;
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
    .price-chart-box {
      display: grid;
      align-items: stretch;
    }
    .price-chart {
      width: 100%;
      min-height: 300px;
      display: block;
      overflow: visible;
    }
    .price-grid line {
      stroke: var(--app-border);
      stroke-width: 1;
    }
    .price-line {
      fill: none;
      stroke: var(--app-brand);
      stroke-width: 3;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
    .price-points circle {
      fill: var(--app-surface);
      stroke: var(--app-warning);
      stroke-width: 2;
      outline: none;
    }
    .price-points circle:hover,
    .price-points circle:focus {
      fill: var(--app-warning);
      stroke: var(--app-brand-strong);
    }
    .price-axis text {
      fill: var(--app-muted);
      font-size: 11px;
      font-variant-numeric: tabular-nums;
    }

    @media (max-width: 760px) {
      .filter-panel--chips { grid-template-columns: 1fr; }
      .resumen-mini { flex-wrap: wrap; }
      .sparkline-wrap { width: 100%; }
    }
  `]
})
export class PreciosComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  private readonly notify = inject(NotifyService);

  loading = false;
  productos: Producto[] = [];
  proveedores: Proveedor[] = [];
  precios: PrecioProveedor[] = [];
  preciosPagina: PrecioProveedor[] = [];
  precioCols = ['fecha', 'producto', 'proveedor', 'precio'];
  pageIndex = 0;
  pageSize = 20;

  readonly preciosSignal = signal<PrecioProveedor[]>([]);
  readonly productosSignal = signal<Producto[]>([]);

  productoFiltro = this.fb.control<number | null>(null);

  readonly filtroSeleccionado = computed(() => {
    const id = this.productoFiltro.value;
    return id ? this.productosSignal().find(p => p.id === id) ?? null : null;
  });

  readonly resumen = computed(() => {
    const precios = this.preciosSignal();
    if (!precios.length) return null;
    const ordenado = [...precios].sort((a, b) => new Date(a.fechaRegistro).getTime() - new Date(b.fechaRegistro).getTime());
    const serie = ordenado.slice(-12).map(p => Number(p.precioUnitario));
    const ultimo = serie[serie.length - 1] ?? 0;
    const primero = serie[0] ?? ultimo;
    const delta = primero ? ((ultimo - primero) / primero) * 100 : 0;
    return { ultimo, delta, serie };
  });

  readonly priceChartData = computed(() => this.buildPriceChartData(this.preciosSignal()));
  readonly sparklinePoints = computed(() => this.buildSparklinePoints(this.resumen()?.serie ?? []));

  precioForm = this.fb.nonNullable.group({
    productoId: [0, [Validators.required, Validators.min(1)]],
    proveedorId: [0, [Validators.required, Validators.min(1)]],
    precioUnitario: [0, [Validators.required, Validators.min(0)]],
    moneda: ['COP', Validators.required]
  });

  ngOnInit() {
    this.loadProductos();
    this.loadProveedores();
    this.loadPrecios();
    this.productoFiltro.valueChanges.subscribe(() => this.loadPrecios());
  }

  loadProductos() {
    this.api.productos({ size: 100 }).subscribe(page => {
      this.productos = page.content;
      this.productosSignal.set(page.content);
    });
  }

  loadProveedores() {
    this.api.proveedores({ size: 100 }).subscribe(page => this.proveedores = page.content);
  }

  refresh() {
    this.loadProductos();
    this.loadProveedores();
    this.loadPrecios();
  }

  loadPrecios() {
    const productoId = this.productoFiltro.value ?? undefined;
    this.loading = true;
    this.api.historialPrecios(productoId ? { productoId } : {}).subscribe({
      next: precios => {
        this.precios = precios;
        this.preciosSignal.set(precios);
        this.pageIndex = 0;
        this.updatePage();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  registrarPrecio() {
    if (this.precioForm.invalid) {
      this.precioForm.markAllAsTouched();
      return;
    }
    const value = this.precioForm.getRawValue();
    this.api.registrarPrecio({
      productoId: Number(value.productoId),
      proveedorId: Number(value.proveedorId),
      precioUnitario: Number(value.precioUnitario),
      moneda: value.moneda
    }).subscribe(() => {
      this.notify.success('Precio registrado');
      this.precioForm.reset({ productoId: 0, proveedorId: 0, precioUnitario: 0, moneda: 'COP' });
      this.loadPrecios();
    });
  }

  onPage(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updatePage();
  }

  limpiarFiltroGrafico() {
    this.productoFiltro.setValue(null);
  }

  private updatePage() {
    const start = this.pageIndex * this.pageSize;
    this.preciosPagina = this.precios.slice(start, start + this.pageSize);
  }

  private buildPriceChartData(precios: PrecioProveedor[]): PriceChartData {
    const plotRight = PRICE_CHART.width - PRICE_CHART.right;
    const plotBottom = PRICE_CHART.height - PRICE_CHART.bottom;
    const plotWidth = plotRight - PRICE_CHART.left;
    const plotHeight = plotBottom - PRICE_CHART.top;
    const empty = {
      points: '',
      pointsData: [],
      yTicks: [],
      xTicks: [],
      moneda: 'COP',
      plotLeft: PRICE_CHART.left,
      plotRight
    };

    const ordered = [...precios].sort((a, b) => new Date(a.fechaRegistro).getTime() - new Date(b.fechaRegistro).getTime());
    if (!ordered.length) return empty;

    const values = ordered.map(precio => Math.max(0, Number(precio.precioUnitario) || 0));
    let min = Math.min(...values);
    let max = Math.max(...values);
    if (min === max) {
      const padding = max === 0 ? 1 : max * 0.1;
      min = Math.max(0, min - padding);
      max += padding;
    }
    const range = max - min || 1;

    const pointsData = ordered.map((precio, index) => {
      const value = Math.max(0, Number(precio.precioUnitario) || 0);
      const x = PRICE_CHART.left + (ordered.length === 1 ? plotWidth / 2 : (index / (ordered.length - 1)) * plotWidth);
      const y = PRICE_CHART.top + (1 - ((value - min) / range)) * plotHeight;
      const fecha = new Date(precio.fechaRegistro);
      return {
        x,
        y,
        fecha: fecha.toLocaleString(),
        fechaCorta: fecha.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        precio: value,
        moneda: precio.moneda || 'COP',
        producto: precio.producto?.nombre ?? 'Producto'
      };
    });

    const yTicks = [0, 1, 2, 3, 4].map(index => {
      const ratio = index / 4;
      return {
        y: PRICE_CHART.top + ratio * plotHeight,
        value: max - ratio * range
      };
    });

    return {
      points: pointsData.map(point => `${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(' '),
      pointsData,
      yTicks,
      xTicks: this.buildXAxisTicks(pointsData),
      moneda: pointsData[pointsData.length - 1]?.moneda ?? 'COP',
      plotLeft: PRICE_CHART.left,
      plotRight
    };
  }

  private buildXAxisTicks(points: PriceChartPoint[]) {
    if (points.length <= 5) {
      return points.map(point => ({ x: point.x, label: point.fechaCorta }));
    }

    const indexes = [0, 0.25, 0.5, 0.75, 1].map(ratio => Math.round((points.length - 1) * ratio));
    return [...new Set(indexes)].map(index => ({ x: points[index].x, label: points[index].fechaCorta }));
  }

  private buildSparklinePoints(serie: number[]) {
    if (serie.length < 2) return '';

    const width = 140;
    const height = 44;
    const padding = 4;
    const values = serie.map(value => Math.max(0, Number(value) || 0));
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;
    const plotWidth = width - padding * 2;
    const plotHeight = height - padding * 2;

    return values.map((value, index) => {
      const x = padding + (index / (values.length - 1)) * plotWidth;
      const y = range === 0 ? height / 2 : padding + (1 - ((value - min) / range)) * plotHeight;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    }).join(' ');
  }
}
