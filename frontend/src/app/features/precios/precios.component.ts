import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild, computed, effect, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Chart } from 'chart.js/auto';
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
import { ThemeService } from '../../core/theme.service';
import { NotifyService } from '../../shared/notify.service';
import { EmptyStateComponent } from '../../shared/empty-state.component';
import { PageHeaderComponent } from '../../shared/page-header.component';

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
            <canvas #sparkline class="sparkline"></canvas>
          </div>
        </div>
      </div>

      @if (loading) {
        <mat-progress-bar mode="indeterminate" />
      }

      <div class="chart-box">
        <canvas #priceChart></canvas>
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
    .sparkline { width: 100%; height: 100%; display: block; }

    @media (max-width: 760px) {
      .filter-panel--chips { grid-template-columns: 1fr; }
      .resumen-mini { flex-wrap: wrap; }
      .sparkline-wrap { width: 100%; }
    }
  `]
})
export class PreciosComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('priceChart') chartCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('sparkline') sparklineCanvas?: ElementRef<HTMLCanvasElement>;

  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  private readonly notify = inject(NotifyService);
  private readonly theme = inject(ThemeService);

  loading = false;
  productos: Producto[] = [];
  proveedores: Proveedor[] = [];
  precios: PrecioProveedor[] = [];
  preciosPagina: PrecioProveedor[] = [];
  precioCols = ['fecha', 'producto', 'proveedor', 'precio'];
  pageIndex = 0;
  pageSize = 20;
  chart?: Chart;
  sparkline?: Chart;

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

  precioForm = this.fb.nonNullable.group({
    productoId: [0, [Validators.required, Validators.min(1)]],
    proveedorId: [0, [Validators.required, Validators.min(1)]],
    precioUnitario: [0, [Validators.required, Validators.min(0)]],
    moneda: ['COP', Validators.required]
  });

  constructor() {
    effect(() => {
      this.theme.isDark();
      this.renderChart();
      this.renderSparkline();
    });
    effect(() => {
      this.preciosSignal();
      queueMicrotask(() => this.renderSparkline());
    });
  }

  ngOnInit() {
    this.loadProductos();
    this.loadProveedores();
    this.loadPrecios();
    this.productoFiltro.valueChanges.subscribe(() => this.loadPrecios());
  }

  ngAfterViewInit() {
    this.renderChart();
    this.renderSparkline();
  }

  ngOnDestroy() {
    this.chart?.destroy();
    this.sparkline?.destroy();
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
        this.renderChart();
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

  private renderChart() {
    if (!this.chartCanvas) return;
    this.chart?.destroy();
    const ordered = [...this.precios].reverse();
    const textColor = this.cssVar('--app-muted', '#667775');
    const gridColor = this.cssVar('--app-border', '#dfe7e4');
    const brandColor = this.cssVar('--app-brand', '#00796b');
    const accentColor = this.cssVar('--app-warning', '#c47a1c');
    this.chart = new Chart(this.chartCanvas.nativeElement, {
      type: 'line',
      data: {
        labels: ordered.map(precio => new Date(precio.fechaRegistro).toLocaleDateString()),
        datasets: [{
          label: 'Precio',
          data: ordered.map(precio => precio.precioUnitario),
          borderColor: brandColor,
          backgroundColor: accentColor,
          pointBackgroundColor: accentColor,
          pointBorderColor: brandColor,
          tension: 0.25
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: textColor } } },
        scales: {
          x: { ticks: { color: textColor }, grid: { color: gridColor } },
          y: { ticks: { color: textColor }, grid: { color: gridColor } }
        }
      }
    });
  }

  private renderSparkline() {
    if (!this.sparklineCanvas) return;
    const resumen = this.resumen();
    this.sparkline?.destroy();
    if (!resumen || resumen.serie.length < 2) return;
    const brandColor = this.cssVar('--app-brand', '#00796b');
    this.sparkline = new Chart(this.sparklineCanvas.nativeElement, {
      type: 'line',
      data: {
        labels: resumen.serie.map((_, index) => String(index + 1)),
        datasets: [{
          data: resumen.serie,
          borderColor: brandColor,
          backgroundColor: 'transparent',
          pointRadius: 0,
          borderWidth: 2,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: { x: { display: false }, y: { display: false } },
        elements: { line: { capBezierPoints: true } }
      }
    });
  }

  private cssVar(name: string, fallback: string) {
    return getComputedStyle(document.body).getPropertyValue(name).trim() || fallback;
  }
}
