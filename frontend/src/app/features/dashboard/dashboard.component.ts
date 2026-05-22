import { CommonModule, DatePipe } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { catchError, finalize, of, timeout } from 'rxjs';
import { Router } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { DashboardKpi, MovimientoInventario, MovimientoTipoResumen, Producto, Rol } from '../../core/models';
import { NotifyService } from '../../shared/notify.service';
import {
  CellDefDirective,
  DataTableComponent,
  TableColumn
} from '../../shared/data-table.component';
import { SkeletonTableComponent } from '../../shared/skeleton-table.component';
import { StockMovementDialogComponent, StockMovementDialogResult } from '../movimientos/stock-movement-dialog.component';
import { ProductoFormDialogComponent } from '../productos/producto-form-dialog.component';

type KpiTone = 'stock' | 'sales' | 'orders' | 'alerts';

interface KpiCard {
  label: string;
  value: number;
  icon: string;
  note: string;
  tone: KpiTone;
  trend?: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    DataTableComponent,
    CellDefDirective,
    SkeletonTableComponent
  ],
  template: `
    <section class="module-page dashboard-page">
      <div class="module-hero">
        <div class="module-title">
          <span class="eyebrow">Resumen operativo</span>
          <h1>Dashboard</h1>
          <p>Lectura rapida de stock, salidas, ordenes, alertas y actividad reciente.</p>
        </div>
        <div class="module-actions">
          <button mat-stroked-button type="button" (click)="load()" [disabled]="loading">
            <mat-icon>refresh</mat-icon>
            Actualizar
          </button>
        </div>
      </div>

      <section class="dashboard-section">
        <div class="section-heading">
          <span class="eyebrow">KPIs principales</span>
        </div>
        <div class="grid kpi-grid">
          <article *ngFor="let item of kpiCards" class="metric-card" [class]="'metric-card--' + item.tone">
            <div class="metric-top">
              <div class="metric-info">
                <p class="metric-label">{{ item.label }}</p>
                <h2 class="metric-value">{{ item.value }}</h2>
              </div>
              <div class="metric-icon" [class]="'metric-icon--' + item.tone">
                <mat-icon>{{ item.icon }}</mat-icon>
              </div>
            </div>
            <div class="metric-bottom">
              <p class="metric-note">{{ item.note }}</p>
              <span *ngIf="item.trend" class="metric-trend">{{ item.trend }}</span>
            </div>
          </article>
        </div>
      </section>

      <section class="dashboard-section">
        <div class="section-heading">
          <span class="eyebrow">Graficas</span>
        </div>
        <div class="dashboard-charts">
          <article class="chart-box dashboard-chart">
            <div class="panel-title">
              <h2>Movimientos</h2>
              <p>Distribucion por tipo en los ultimos registros.</p>
            </div>
            <div class="doughnut-layout">
              <div class="doughnut-canvas" *ngIf="movimientosPorTipo.length">
                <div
                  class="doughnut-chart"
                  [style.background]="movementsDonutGradient"
                  role="img"
                  [attr.aria-label]="'Distribucion de movimientos, total ' + movimientosTotal + ' unidades'">
                  <span class="doughnut-hole">
                    <strong>{{ movimientosTotal }}</strong>
                    <small>unidades</small>
                  </span>
                </div>
              </div>
              <ul class="doughnut-legend" *ngIf="movimientosPorTipo.length; else sinMovimientos">
                <li *ngFor="let item of movimientosPorTipo">
                  <span class="legend-dot" [class]="'legend-dot--' + chipMovimiento(item.tipoMovimiento)"></span>
                  <span class="legend-label">{{ item.tipoMovimiento }}</span>
                  <span class="legend-value">{{ item.cantidad }} <small>unidades</small></span>
                </li>
              </ul>
              <ng-template #sinMovimientos>
                <p class="doughnut-empty">Sin movimientos registrados aun.</p>
              </ng-template>
            </div>
          </article>
          <article class="chart-box dashboard-chart">
            <div class="panel-title">
              <h2>Productos mas vendidos</h2>
              <p>Ranking calculado con movimientos de tipo SALIDA.</p>
            </div>
            <div *ngIf="topSales.length; else sinVentas" class="sales-bars" role="list" aria-label="Productos mas vendidos">
              <div *ngFor="let item of topSales" class="sales-bar-row" role="listitem">
                <div class="sales-bar-header">
                  <span class="sales-product" [title]="item.producto">{{ item.producto }}</span>
                  <strong>{{ item.cantidad }} <small>unidades</small></strong>
                </div>
                <div class="sales-bar-track" [attr.aria-label]="item.producto + ': ' + item.cantidad + ' unidades'">
                  <span class="sales-bar-fill" [style.width.%]="salesPercent(item.cantidad)"></span>
                </div>
              </div>
            </div>
            <ng-template #sinVentas>
              <div class="empty-state compact">
                <mat-icon>point_of_sale</mat-icon>
                <h3>Sin salidas registradas</h3>
                <p>Cuando existan salidas, este ranking se actualizara automaticamente.</p>
              </div>
            </ng-template>
          </article>
        </div>
      </section>

      <section class="dashboard-section">
        <div class="section-heading">
          <span class="eyebrow">Tablas</span>
        </div>
        <div class="dashboard-tables">
          <article class="data-panel">
            <div class="panel-head">
              <div class="panel-title">
                <h2>Productos criticos</h2>
                <p>Stock igual o inferior al minimo.</p>
              </div>
              <span class="count-pill">{{ productosCriticos.length }}</span>
            </div>
            <app-data-table
              [columns]="criticosColumns"
              [rows]="productosCriticos"
              [loading]="false"
              [paginator]="false"
              [emptyState]="criticosEmpty">
              <ng-template [appCellDef]="'stock'" let-row>
                <span class="status-pill status-pill--danger">{{ row.cantidadStock }} / {{ row.stockMinimo }}</span>
              </ng-template>
              <ng-template [appCellDef]="'accion'" let-row>
                <div class="actions">
                  <button
                    *ngIf="can(['ADMIN','ALMACENISTA'])"
                    mat-icon-button
                    title="Registrar entrada"
                    (click)="registrarEntrada(row)">
                    <mat-icon>add_box</mat-icon>
                  </button>
                </div>
              </ng-template>
            </app-data-table>
          </article>

          <article class="data-panel">
            <div class="panel-head">
              <div class="panel-title">
                <h2>Actividad reciente</h2>
                <p>Ultimos movimientos registrados.</p>
              </div>
              <span class="count-pill">{{ actividadReciente.length }}</span>
            </div>
            <app-data-table
              [columns]="actividadColumns"
              [rows]="actividadReciente"
              [loading]="false"
              [paginator]="false"
              [emptyState]="actividadEmpty">
              <ng-template [appCellDef]="'fecha'" let-row>{{ row.fecha | date:'short' }}</ng-template>
              <ng-template [appCellDef]="'producto'" let-row>{{ row.producto?.nombre || 'Producto no disponible' }}</ng-template>
              <ng-template [appCellDef]="'tipo'" let-row>
                <span [class]="'status-pill status-pill--' + chipMovimiento(row.tipoMovimiento)">{{ row.tipoMovimiento }}</span>
              </ng-template>
            </app-data-table>
          </article>
        </div>
      </section>

      <section class="dashboard-section">
        <div class="section-heading">
          <span class="eyebrow">Acciones rapidas</span>
        </div>
        <div class="quick-actions">
          <button
            *ngIf="can(['ADMIN'])"
            type="button"
            class="quick-action"
            (click)="agregarProducto()">
            <span class="quick-action__icon"><mat-icon>add</mat-icon></span>
            <span class="quick-action__body">
              <strong>Agregar producto</strong>
              <small>Crea un SKU nuevo con stock minimo.</small>
            </span>
          </button>
          <button
            *ngIf="can(['ADMIN','ALMACENISTA'])"
            type="button"
            class="quick-action"
            (click)="registrarEntrada()">
            <span class="quick-action__icon"><mat-icon>inventory</mat-icon></span>
            <span class="quick-action__body">
              <strong>Registrar entrada</strong>
              <small>Recibe mercancia y suma al inventario.</small>
            </span>
          </button>
          <button
            *ngIf="can(['ADMIN','GERENTE'])"
            type="button"
            class="quick-action"
            (click)="crearOrden()">
            <span class="quick-action__icon"><mat-icon>receipt_long</mat-icon></span>
            <span class="quick-action__body">
              <strong>Crear orden</strong>
              <small>Inicia una compra a proveedor.</small>
            </span>
          </button>
        </div>
      </section>
    </section>
  `,
  styles: [`
    .dashboard-section {
      display: grid;
      gap: var(--app-space-3);
    }

    .section-heading {
      display: flex;
      align-items: center;
      justify-content: space-between;
      min-height: 24px;
    }

    .metric-card {
      display: grid;
      gap: var(--app-space-3);
    }

    .metric-info { display: grid; gap: var(--app-space-1); }

    .metric-icon {
      width: 44px;
      height: 44px;
      display: grid;
      place-items: center;
      border-radius: var(--app-radius-3);
      color: var(--app-brand-strong);
      background: var(--app-surface-muted);
    }

    .metric-icon--stock { color: var(--app-brand-strong); background: rgba(0, 121, 107, 0.12); }
    .metric-icon--sales { color: var(--app-accent); background: rgba(47, 111, 171, 0.14); }
    .metric-icon--orders { color: var(--app-warning); background: rgba(181, 106, 20, 0.14); }
    .metric-icon--alerts { color: var(--app-danger); background: rgba(176, 56, 50, 0.14); }

    body.theme-dark .metric-icon--stock { background: rgba(65, 199, 181, 0.18); }
    body.theme-dark .metric-icon--sales { background: rgba(122, 167, 223, 0.18); }
    body.theme-dark .metric-icon--orders { background: rgba(225, 168, 75, 0.18); }
    body.theme-dark .metric-icon--alerts { background: rgba(224, 107, 101, 0.20); }

    .metric-bottom {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--app-space-2);
    }

    .metric-trend {
      padding: 2px 8px;
      border-radius: var(--app-radius-pill);
      background: var(--app-surface-muted);
      color: var(--app-muted-strong);
      font-size: var(--app-font-12);
      font-weight: var(--app-weight-semibold);
    }

    .dashboard-charts,
    .dashboard-tables {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: var(--app-space-5);
      align-items: stretch;
    }

    .dashboard-chart {
      display: grid;
      gap: var(--app-space-4);
      min-height: 390px;
    }

    .doughnut-layout {
      display: grid;
      grid-template-columns: minmax(180px, 1fr) minmax(160px, 220px);
      gap: var(--app-space-4);
      align-items: center;
    }

    .doughnut-canvas {
      position: relative;
      min-height: 240px;
      display: grid;
      place-items: center;
    }

    .doughnut-chart {
      width: min(240px, 100%);
      aspect-ratio: 1;
      display: grid;
      place-items: center;
      border-radius: 50%;
      box-shadow: inset 0 0 0 1px var(--app-border);
    }

    .doughnut-hole {
      width: 58%;
      aspect-ratio: 1;
      display: grid;
      place-items: center;
      align-content: center;
      gap: 2px;
      border-radius: 50%;
      background: var(--app-surface);
      color: var(--app-heading);
      box-shadow: var(--app-elevation-1);
      font-variant-numeric: tabular-nums;
    }

    .doughnut-hole strong {
      font-size: var(--app-font-28);
      line-height: 1;
    }

    .doughnut-hole small {
      color: var(--app-muted);
      font-size: var(--app-font-12);
    }

    .doughnut-legend {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      gap: var(--app-space-3);
    }

    .doughnut-legend li {
      display: grid;
      grid-template-columns: auto 1fr auto;
      align-items: center;
      gap: var(--app-space-3);
      font-size: var(--app-font-14);
      color: var(--app-text);
    }

    .doughnut-legend small {
      color: var(--app-muted);
      margin-left: 2px;
      font-size: var(--app-font-12);
    }

    .legend-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--app-muted);
    }

    .legend-dot--success { background: var(--app-success); }
    .legend-dot--warn { background: var(--app-warning); }
    .legend-dot--primary { background: var(--app-accent); }

    .legend-value {
      font-variant-numeric: tabular-nums;
      color: var(--app-heading);
      font-weight: var(--app-weight-semibold);
    }

    .doughnut-empty {
      grid-column: 1 / -1;
      margin: 0;
      color: var(--app-muted);
      text-align: center;
    }

    .sales-bars {
      display: grid;
      gap: var(--app-space-4);
      align-content: center;
      min-height: 280px;
    }

    .sales-bar-row {
      display: grid;
      gap: var(--app-space-2);
    }

    .sales-bar-header {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: baseline;
      gap: var(--app-space-3);
      color: var(--app-text);
      font-size: var(--app-font-14);
    }

    .sales-product {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: var(--app-heading);
      font-weight: var(--app-weight-semibold);
    }

    .sales-bar-header strong {
      color: var(--app-heading);
      font-variant-numeric: tabular-nums;
    }

    .sales-bar-header small {
      color: var(--app-muted);
      font-size: var(--app-font-12);
      font-weight: var(--app-weight-semibold);
    }

    .sales-bar-track {
      height: 12px;
      overflow: hidden;
      border-radius: var(--app-radius-pill);
      background: var(--app-surface-muted);
      box-shadow: inset 0 0 0 1px var(--app-border);
    }

    .sales-bar-fill {
      display: block;
      height: 100%;
      border-radius: inherit;
      background: linear-gradient(90deg, var(--app-brand), var(--app-accent));
    }

    .status-pill {
      display: inline-flex;
      align-items: center;
      padding: 2px 10px;
      border-radius: var(--app-radius-pill);
      font-size: var(--app-font-12);
      font-weight: var(--app-weight-semibold);
      background: var(--app-surface-muted);
      color: var(--app-text);
      white-space: nowrap;
    }

    .status-pill--danger { background: var(--app-danger); color: white; }
    .status-pill--success { background: var(--app-success); color: white; }
    .status-pill--warn { background: var(--app-warning); color: white; }
    .status-pill--primary { background: var(--app-accent); color: white; }

    .quick-actions {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: var(--app-space-4);
    }

    .quick-action {
      display: grid;
      grid-template-columns: auto 1fr;
      align-items: center;
      gap: var(--app-space-4);
      padding: var(--app-space-4) var(--app-space-5);
      min-height: 88px;
      text-align: left;
      border: 1px solid var(--app-border-strong);
      border-radius: var(--app-radius-3);
      background: var(--app-surface);
      color: var(--app-text);
      box-shadow: var(--app-elevation-2);
      cursor: pointer;
      transition: transform var(--app-dur-fast) var(--app-ease-out),
                  box-shadow var(--app-dur-fast) var(--app-ease-out),
                  border-color var(--app-dur-fast) var(--app-ease-out);
    }

    .quick-action:hover {
      transform: translateY(-1px);
      box-shadow: var(--app-elevation-3);
      border-color: var(--app-brand);
    }

    .quick-action__icon {
      width: 44px;
      height: 44px;
      display: grid;
      place-items: center;
      border-radius: var(--app-radius-3);
      background: var(--app-surface-muted);
      color: var(--app-brand-strong);
    }

    .quick-action__body {
      display: grid;
      gap: 2px;
    }

    .quick-action__body strong {
      color: var(--app-heading);
      font-weight: var(--app-weight-bold);
    }

    .quick-action__body small {
      color: var(--app-muted);
      font-size: var(--app-font-12);
    }

    .compact {
      min-height: 220px;
    }

    @media (max-width: 980px) {
      .dashboard-charts,
      .dashboard-tables,
      .quick-actions {
        grid-template-columns: 1fr;
      }

      .doughnut-layout {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  loading = false;
  loaded = true;
  kpis: DashboardKpi = { totalProductos: 0, stockBajo: 0, ordenesPendientes: 0, proveedoresActivos: 0 };
  stockTotalResumen = 0;
  ventasTotalResumen = 0;
  productosCriticos: Producto[] = [];
  movimientos: MovimientoInventario[] = [];
  movimientosPorTipo: MovimientoTipoResumen[] = [];
  actividadReciente: MovimientoInventario[] = [];
  topSales: { producto: string; cantidad: number }[] = [];

  readonly criticosColumns: TableColumn<Producto>[] = [
    { key: 'codigo', header: 'Codigo' },
    { key: 'nombre', header: 'Producto' },
    { key: 'stock', header: 'Stock', value: row => row.cantidadStock },
    { key: 'accion', header: 'Accion', align: 'end' }
  ];

  readonly actividadColumns: TableColumn<MovimientoInventario>[] = [
    { key: 'fecha', header: 'Fecha', value: row => row.fecha },
    { key: 'producto', header: 'Producto', value: row => row.producto?.nombre ?? 'Producto no disponible' },
    { key: 'tipo', header: 'Tipo', value: row => row.tipoMovimiento },
    { key: 'cantidad', header: 'Cant.', align: 'end', value: row => row.cantidad }
  ];

  readonly criticosEmpty = {
    icon: 'task_alt',
    title: 'Inventario estable',
    message: 'No hay productos por debajo del minimo.'
  };

  readonly actividadEmpty = {
    icon: 'history',
    title: 'Sin actividad reciente',
    message: 'Las entradas, salidas y ajustes apareceran aqui.'
  };

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private dialog: MatDialog,
    private notify: NotifyService,
    private router: Router
  ) {}

  get kpiCards(): KpiCard[] {
    const k = this.kpis;
    return [
      { label: 'Stock', value: this.stockTotalResumen, icon: 'inventory_2', tone: 'stock', note: `${k.totalProductos} referencias activas en catalogo.` },
      { label: 'Ventas', value: this.ventasTotalResumen, icon: 'point_of_sale', tone: 'sales', note: 'Salidas registradas desde movimientos.' },
      { label: 'Ordenes', value: k.ordenesPendientes, icon: 'pending_actions', tone: 'orders', note: 'Ordenes abiertas o pendientes de recepcion.' },
      { label: 'Alertas', value: k.stockBajo, icon: 'warning', tone: 'alerts', note: 'Productos por debajo del minimo definido.' }
    ];
  }

  ngOnInit() {
    this.load();
  }

  can(roles: Rol[]) {
    return this.auth.hasRole(roles);
  }

  get movimientosTotal() {
    return this.movimientosPorTipo.reduce((total, item) => total + Math.max(0, Number(item.cantidad) || 0), 0);
  }

  get movementsDonutGradient() {
    const total = this.movimientosTotal;
    if (!total) return 'conic-gradient(var(--app-border) 0deg 360deg)';

    const items = this.movimientosPorTipo
      .map(item => ({ tipoMovimiento: item.tipoMovimiento, cantidad: Math.max(0, Number(item.cantidad) || 0) }))
      .filter(item => item.cantidad > 0);

    let start = 0;
    const segments = items.map((item, index) => {
      const end = index === items.length - 1 ? 360 : start + (item.cantidad / total) * 360;
      const segment = `${this.movementColorVar(item.tipoMovimiento)} ${start.toFixed(2)}deg ${end.toFixed(2)}deg`;
      start = end;
      return segment;
    });

    return `conic-gradient(${segments.join(', ')})`;
  }

  salesPercent(cantidad: number) {
    const max = this.topSales.reduce((mayor, item) => Math.max(mayor, Number(item.cantidad) || 0), 0);
    if (!max || cantidad <= 0) return 0;
    return Math.max(4, (cantidad / max) * 100);
  }

  load() {
    this.loading = true;
    this.api.dashboardResumen().pipe(
      timeout(8000),
      catchError(() => {
        this.resetDashboard();
        this.notify.error('No se pudo cargar el dashboard');
        return of(null);
      }),
      finalize(() => {
        this.loading = false;
        this.loaded = true;
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(resumen => {
      if (resumen) {
        this.kpis = resumen.kpis;
        this.stockTotalResumen = resumen.stockTotal;
        this.ventasTotalResumen = resumen.ventasTotal;
        this.productosCriticos = resumen.productosCriticos;
        this.movimientos = resumen.actividadReciente;
        this.movimientosPorTipo = resumen.movimientosPorTipo;
        this.actividadReciente = resumen.actividadReciente;
        this.topSales = resumen.topVentas.map(item => ({ producto: item.producto, cantidad: item.cantidad }));
      }
    });
  }

  private resetDashboard() {
    this.kpis = { totalProductos: 0, stockBajo: 0, ordenesPendientes: 0, proveedoresActivos: 0 };
    this.stockTotalResumen = 0;
    this.ventasTotalResumen = 0;
    this.productosCriticos = [];
    this.movimientos = [];
    this.movimientosPorTipo = [];
    this.actividadReciente = [];
    this.topSales = [];
  }

  agregarProducto() {
    const ref = this.dialog.open(ProductoFormDialogComponent, { width: '720px', data: {} });
    ref.afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result?: Partial<Producto>) => {
        if (!result) return;
        this.api.crearProducto(result)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.notify.success('Producto guardado');
              this.load();
            },
            error: () => this.notify.error('No se pudo guardar el producto')
          });
      });
  }

  registrarEntrada(producto?: Producto) {
    this.api.productos({ size: 200 }).pipe(
      timeout(8000),
      catchError(() => of({ content: [] as Producto[] })),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(result => {
      const prods = result.content;
      if (!prods.length) {
        this.notify.warning('Primero registra un producto para poder hacer entradas');
        return;
      }
      const ref = this.dialog.open(StockMovementDialogComponent, { width: '520px', data: { productos: prods, producto, tipo: 'ENTRADA' } });
      ref.afterClosed()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((dialogResult?: StockMovementDialogResult) => {
          if (!dialogResult) return;
          this.api.registrarEntrada(dialogResult)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
              next: () => {
                this.notify.success('Entrada registrada');
                this.load();
              },
              error: () => this.notify.error('No se pudo registrar la entrada')
            });
        });
    });
  }

  crearOrden() {
    this.router.navigate(['/ordenes']);
  }

  chipMovimiento(tipo: string) {
    if (tipo === 'ENTRADA') return 'success';
    if (tipo === 'SALIDA') return 'warn';
    return 'primary';
  }

  private movementColorVar(tipo: string) {
    if (tipo === 'ENTRADA') return 'var(--app-success)';
    if (tipo === 'SALIDA') return 'var(--app-warning)';
    return 'var(--app-accent)';
  }
}
