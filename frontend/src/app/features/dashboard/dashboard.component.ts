import { CommonModule, DatePipe } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild, effect } from '@angular/core';
import { Chart, TooltipItem } from 'chart.js/auto';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { forkJoin, timeout } from 'rxjs';
import { Router } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { DashboardKpi, MovimientoInventario, MovimientoTipoResumen, Producto, Rol } from '../../core/models';
import { ThemeService } from '../../core/theme.service';
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
        <ng-container *ngIf="loaded; else kpiSkeleton">
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
        </ng-container>
        <ng-template #kpiSkeleton>
          <app-skeleton-table [rows]="1" [columns]="4"></app-skeleton-table>
        </ng-template>
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
              <div class="doughnut-canvas">
                <canvas #movementsChart></canvas>
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
            <canvas #salesChart [class.hidden-chart]="!topSales.length"></canvas>
            <div *ngIf="!topSales.length" class="empty-state compact">
              <mat-icon>point_of_sale</mat-icon>
              <h3>Sin salidas registradas</h3>
              <p>Cuando existan salidas, este ranking se actualizara automaticamente.</p>
            </div>
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
              [loading]="loading && !loaded"
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
              [loading]="loading && !loaded"
              [paginator]="false"
              [emptyState]="actividadEmpty">
              <ng-template [appCellDef]="'fecha'" let-row>{{ row.fecha | date:'short' }}</ng-template>
              <ng-template [appCellDef]="'producto'" let-row>{{ row.producto.nombre }}</ng-template>
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

    .dashboard-chart canvas {
      min-height: 280px;
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

    .hidden-chart { display: none !important; }

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
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('movementsChart') movementsChartCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('salesChart') salesChartCanvas?: ElementRef<HTMLCanvasElement>;

  loading = false;
  loaded = false;
  kpis?: DashboardKpi;
  stockTotalResumen = 0;
  ventasTotalResumen = 0;
  productos: Producto[] = [];
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
    { key: 'producto', header: 'Producto', value: row => row.producto.nombre },
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

  private movementsChart?: Chart;
  private salesChart?: Chart;
  private viewReady = false;

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private dialog: MatDialog,
    private notify: NotifyService,
    private theme: ThemeService,
    private router: Router
  ) {
    effect(() => {
      this.theme.isDark();
      this.renderCharts();
    });
  }

  get kpiCards(): KpiCard[] {
    const k = this.kpis ?? { totalProductos: 0, stockBajo: 0, ordenesPendientes: 0, proveedoresActivos: 0 };
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

  ngAfterViewInit() {
    this.viewReady = true;
    this.renderCharts();
  }

  ngOnDestroy() {
    this.movementsChart?.destroy();
    this.salesChart?.destroy();
  }

  can(roles: Rol[]) {
    return this.auth.hasRole(roles);
  }

  load() {
    this.loading = true;
    forkJoin({
      resumen: this.api.dashboardResumen(),
      productos: this.api.productos({ size: 200 })
    }).pipe(timeout(15000)).subscribe({
      next: ({ resumen, productos }) => {
        this.kpis = resumen.kpis;
        this.stockTotalResumen = resumen.stockTotal;
        this.ventasTotalResumen = resumen.ventasTotal;
        this.productos = productos.content;
        this.productosCriticos = resumen.productosCriticos;
        this.movimientos = resumen.actividadReciente;
        this.movimientosPorTipo = resumen.movimientosPorTipo;
        this.actividadReciente = resumen.actividadReciente;
        this.topSales = resumen.topVentas.map(item => ({ producto: item.producto, cantidad: item.cantidad }));
        this.loading = false;
        this.loaded = true;
        this.renderCharts();
      },
      error: () => {
        this.loading = false;
        this.loaded = true;
        this.kpis = { totalProductos: 0, stockBajo: 0, ordenesPendientes: 0, proveedoresActivos: 0 };
        this.stockTotalResumen = 0;
        this.ventasTotalResumen = 0;
        this.productos = [];
        this.productosCriticos = [];
        this.movimientos = [];
        this.movimientosPorTipo = [];
        this.actividadReciente = [];
        this.topSales = [];
        this.renderCharts();
        this.notify.error('No se pudo cargar el dashboard');
      }
    });
  }

  agregarProducto() {
    const ref = this.dialog.open(ProductoFormDialogComponent, { width: '720px' });
    ref.afterClosed().subscribe((result?: Partial<Producto>) => {
      if (!result) return;
      this.api.crearProducto(result).subscribe(() => {
        this.notify.success('Producto guardado');
        this.load();
      });
    });
  }

  registrarEntrada(producto?: Producto) {
    if (!this.productos.length) {
      this.notify.warning('Primero registra un producto para poder hacer entradas');
      return;
    }

    const ref = this.dialog.open(StockMovementDialogComponent, { width: '520px', data: { productos: this.productos, producto, tipo: 'ENTRADA' } });
    ref.afterClosed().subscribe((result?: StockMovementDialogResult) => {
      if (!result) return;
      this.api.registrarEntrada(result).subscribe(() => {
        this.notify.success('Entrada registrada');
        this.load();
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

  private renderCharts() {
    if (!this.viewReady) return;
    try {
      this.renderMovementsChart();
      this.renderSalesChart();
    } catch (err) {
      console.error('Dashboard chart render failed', err);
    }
  }

  private renderMovementsChart() {
    if (!this.movementsChartCanvas || !this.movimientosPorTipo.length) {
      this.movementsChart?.destroy();
      this.movementsChart = undefined;
      return;
    }
    this.movementsChart?.destroy();
    const byType = this.movimientosPorTipo.reduce((acc, movimiento) => {
      acc.set(movimiento.tipoMovimiento, movimiento.cantidad);
      return acc;
    }, new Map<string, number>());
    const labels = [...byType.keys()];
    const values = [...byType.values()];

    this.movementsChart = new Chart(this.movementsChartCanvas.nativeElement, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: [
            this.cssVar('--app-success', '#2f855a'),
            this.cssVar('--app-warning', '#c47a1c'),
            this.cssVar('--app-accent', '#2f6fab')
          ],
          borderColor: this.cssVar('--app-surface', '#ffffff'),
          borderWidth: 3
        }]
      },
      options: {
        ...this.chartOptions(),
        cutout: '62%',
        plugins: {
          ...this.chartOptions().plugins,
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx: TooltipItem<'doughnut'>) => `${ctx.label}: ${ctx.parsed} unidades`
            }
          }
        }
      }
    });
  }

  private renderSalesChart() {
    if (!this.salesChartCanvas || !this.topSales.length) {
      this.salesChart?.destroy();
      return;
    }

    this.salesChart?.destroy();
    this.salesChart = new Chart(this.salesChartCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: this.topSales.map(item => item.producto),
        datasets: [{
          label: 'Salidas',
          data: this.topSales.map(item => item.cantidad),
          backgroundColor: this.cssVar('--app-brand', '#00796b'),
          borderRadius: 8
        }]
      },
      options: {
        ...this.chartOptions(),
        plugins: {
          ...this.chartOptions().plugins,
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx: TooltipItem<'bar'>) => {
                const value = Number(ctx.parsed.y ?? 0);
                return `${value} ${value === 1 ? 'unidad' : 'unidades'}`;
              }
            }
          }
        },
        scales: {
          x: {
            ticks: { color: this.cssVar('--app-muted', '#667775') },
            grid: { color: this.cssVar('--app-border', '#dfe7e4') }
          },
          y: {
            beginAtZero: true,
            ticks: { color: this.cssVar('--app-muted', '#667775'), precision: 0 },
            grid: { color: this.cssVar('--app-border', '#dfe7e4') }
          }
        }
      }
    });
  }

  private chartOptions() {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: this.cssVar('--app-muted', '#667775') }
        }
      }
    };
  }

  private cssVar(name: string, fallback: string) {
    return getComputedStyle(document.body).getPropertyValue(name).trim() || fallback;
  }
}
