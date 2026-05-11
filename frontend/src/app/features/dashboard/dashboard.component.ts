import { DatePipe } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild, effect } from '@angular/core';
import { Chart } from 'chart.js/auto';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { DashboardKpi, MovimientoInventario, Producto, Rol } from '../../core/models';
import { ThemeService } from '../../core/theme.service';
import { WorkspaceNavigationService } from '../../core/workspace-navigation.service';
import { StockMovementDialogComponent, StockMovementDialogResult } from '../movimientos/stock-movement-dialog.component';
import { ProductoFormDialogComponent } from '../productos/producto-form-dialog.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    DatePipe,
    MatButtonModule,
    MatChipsModule,
    MatDialogModule,
    MatIconModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatTableModule
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
          <button mat-stroked-button type="button" (click)="load()">
            <mat-icon>refresh</mat-icon>
            Actualizar
          </button>
        </div>
      </div>

      @if (loading) {
        <mat-progress-bar mode="indeterminate" />
      }

      <section class="dashboard-section">
        <div class="section-heading">
          <span class="eyebrow">KPIs principales</span>
        </div>
        <div class="grid kpi-grid">
          @for (item of kpiCards; track item.label) {
            <article class="metric-card">
              <div class="metric-top">
                <div>
                  <p class="metric-label">{{ item.label }}</p>
                  <h2 class="metric-value">{{ item.value }}</h2>
                </div>
                <div class="metric-icon"><mat-icon>{{ item.icon }}</mat-icon></div>
              </div>
              <p class="metric-note">{{ item.note }}</p>
            </article>
          }
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
            <canvas #movementsChart></canvas>
          </article>
          <article class="chart-box dashboard-chart">
            <div class="panel-title">
              <h2>Productos mas vendidos</h2>
              <p>Ranking calculado con movimientos de tipo SALIDA.</p>
            </div>
            <canvas #salesChart [class.hidden-chart]="!topSales.length"></canvas>
            @if (!topSales.length) {
              <div class="empty-state compact">
                <mat-icon>point_of_sale</mat-icon>
                <h3>Sin salidas registradas</h3>
                <p>Cuando existan salidas, este ranking se actualizara automaticamente.</p>
              </div>
            }
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
            @if (productosCriticos.length) {
              <div class="table-wrap">
                <table mat-table [dataSource]="productosCriticos">
                  <ng-container matColumnDef="codigo"><th mat-header-cell *matHeaderCellDef>Codigo</th><td mat-cell *matCellDef="let p">{{ p.codigo }}</td></ng-container>
                  <ng-container matColumnDef="nombre"><th mat-header-cell *matHeaderCellDef>Producto</th><td mat-cell *matCellDef="let p">{{ p.nombre }}</td></ng-container>
                  <ng-container matColumnDef="stock"><th mat-header-cell *matHeaderCellDef>Stock</th><td mat-cell *matCellDef="let p"><mat-chip class="chip-danger">{{ p.cantidadStock }} / {{ p.stockMinimo }}</mat-chip></td></ng-container>
                  <ng-container matColumnDef="accion">
                    <th mat-header-cell *matHeaderCellDef>Accion</th>
                    <td mat-cell *matCellDef="let p">
                      @if (can(['ADMIN','ALMACENISTA'])) {
                        <button mat-icon-button title="Registrar entrada" (click)="registrarEntrada(p)"><mat-icon>add_box</mat-icon></button>
                      }
                    </td>
                  </ng-container>
                  <tr mat-header-row *matHeaderRowDef="criticosCols"></tr>
                  <tr mat-row *matRowDef="let row; columns: criticosCols;"></tr>
                </table>
              </div>
            } @else {
              <div class="empty-state compact">
                <mat-icon>task_alt</mat-icon>
                <h3>Inventario estable</h3>
                <p>No hay productos por debajo del minimo.</p>
              </div>
            }
          </article>

          <article class="data-panel">
            <div class="panel-head">
              <div class="panel-title">
                <h2>Actividad reciente</h2>
                <p>Ultimos movimientos registrados.</p>
              </div>
              <span class="count-pill">{{ actividadReciente.length }}</span>
            </div>
            @if (actividadReciente.length) {
              <div class="table-wrap">
                <table mat-table [dataSource]="actividadReciente">
                  <ng-container matColumnDef="fecha"><th mat-header-cell *matHeaderCellDef>Fecha</th><td mat-cell *matCellDef="let m">{{ m.fecha | date:'short' }}</td></ng-container>
                  <ng-container matColumnDef="producto"><th mat-header-cell *matHeaderCellDef>Producto</th><td mat-cell *matCellDef="let m">{{ m.producto.nombre }}</td></ng-container>
                  <ng-container matColumnDef="tipo"><th mat-header-cell *matHeaderCellDef>Tipo</th><td mat-cell *matCellDef="let m"><mat-chip [class]="chipMovimiento(m.tipoMovimiento)">{{ m.tipoMovimiento }}</mat-chip></td></ng-container>
                  <ng-container matColumnDef="cantidad"><th mat-header-cell *matHeaderCellDef>Cant.</th><td mat-cell *matCellDef="let m">{{ m.cantidad }}</td></ng-container>
                  <tr mat-header-row *matHeaderRowDef="actividadCols"></tr>
                  <tr mat-row *matRowDef="let row; columns: actividadCols;"></tr>
                </table>
              </div>
            } @else {
              <div class="empty-state compact">
                <mat-icon>history</mat-icon>
                <h3>Sin actividad reciente</h3>
                <p>Las entradas, salidas y ajustes apareceran aqui.</p>
              </div>
            }
          </article>
        </div>
      </section>

      <section class="dashboard-section">
        <div class="section-heading">
          <span class="eyebrow">Acciones rapidas</span>
        </div>
        <div class="quick-actions">
          @if (can(['ADMIN'])) {
            <button mat-stroked-button type="button" class="quick-action" (click)="agregarProducto()">
              <mat-icon>add</mat-icon>
              <span>Agregar producto</span>
            </button>
          }
          @if (can(['ADMIN','ALMACENISTA'])) {
            <button mat-stroked-button type="button" class="quick-action" (click)="registrarEntrada()">
              <mat-icon>inventory</mat-icon>
              <span>Registrar entrada</span>
            </button>
          }
          @if (can(['ADMIN','GERENTE'])) {
            <button mat-stroked-button type="button" class="quick-action" (click)="crearOrden()">
              <mat-icon>receipt_long</mat-icon>
              <span>Crear orden</span>
            </button>
          }
        </div>
      </section>
    </section>
  `,
  styles: [`
    .dashboard-section {
      display: grid;
      gap: 12px;
    }

    .section-heading {
      display: flex;
      align-items: center;
      justify-content: space-between;
      min-height: 24px;
    }

    .dashboard-charts,
    .dashboard-tables {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 18px;
      align-items: stretch;
    }

    .dashboard-chart {
      display: grid;
      gap: 16px;
      min-height: 390px;
    }

    .dashboard-chart canvas {
      min-height: 290px;
    }

    .hidden-chart {
      display: none !important;
    }

    .quick-actions {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 14px;
    }

    .quick-action {
      min-height: 64px;
      justify-content: flex-start;
      padding: 0 18px;
      border-color: var(--app-border-strong);
      background: var(--app-surface);
      box-shadow: var(--app-shadow);
    }

    .quick-action mat-icon {
      margin-right: 10px;
      color: var(--app-brand-strong);
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
    }
  `]
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('movementsChart') movementsChartCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('salesChart') salesChartCanvas?: ElementRef<HTMLCanvasElement>;

  loading = false;
  kpis?: DashboardKpi;
  productos: Producto[] = [];
  productosCriticos: Producto[] = [];
  movimientos: MovimientoInventario[] = [];
  actividadReciente: MovimientoInventario[] = [];
  topSales: { producto: string; cantidad: number }[] = [];
  criticosCols = ['codigo', 'nombre', 'stock', 'accion'];
  actividadCols = ['fecha', 'producto', 'tipo', 'cantidad'];
  private movementsChart?: Chart;
  private salesChart?: Chart;
  private viewReady = false;

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private dialog: MatDialog,
    private snack: MatSnackBar,
    private theme: ThemeService,
    private navigation: WorkspaceNavigationService
  ) {
    effect(() => {
      this.theme.isDark();
      this.renderCharts();
    });
  }

  get kpiCards() {
    const k = this.kpis ?? { totalProductos: 0, stockBajo: 0, ordenesPendientes: 0, proveedoresActivos: 0 };
    return [
      { label: 'Stock', value: this.stockTotal, icon: 'inventory_2', note: `${k.totalProductos} referencias activas en catalogo.` },
      { label: 'Ventas', value: this.ventasTotal, icon: 'point_of_sale', note: 'Salidas registradas desde movimientos.' },
      { label: 'Ordenes', value: k.ordenesPendientes, icon: 'pending_actions', note: 'Ordenes abiertas o pendientes de recepcion.' },
      { label: 'Alertas', value: k.stockBajo, icon: 'warning', note: 'Productos por debajo del minimo definido.' }
    ];
  }

  get stockTotal() {
    return this.productos.reduce((total, producto) => total + producto.cantidadStock, 0);
  }

  get ventasTotal() {
    return this.movimientos
      .filter(movimiento => movimiento.tipoMovimiento === 'SALIDA')
      .reduce((total, movimiento) => total + Math.abs(movimiento.cantidad), 0);
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
      kpis: this.api.dashboard(),
      productos: this.api.productos({ size: 100 }),
      criticos: this.api.productos({ stockBajo: true, size: 5 }),
      movimientos: this.api.movimientos({ size: 100 })
    }).subscribe({
      next: ({ kpis, productos, criticos, movimientos }) => {
        this.kpis = kpis;
        this.productos = productos.content;
        this.productosCriticos = criticos.content;
        this.movimientos = movimientos.content;
        this.actividadReciente = [...movimientos.content]
          .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
          .slice(0, 6);
        this.topSales = this.buildTopSales(movimientos.content);
        this.loading = false;
        this.renderCharts();
      },
      error: () => {
        this.loading = false;
        this.snack.open('No se pudo cargar el dashboard', 'Cerrar', { duration: 3000 });
      }
    });
  }

  agregarProducto() {
    const ref = this.dialog.open(ProductoFormDialogComponent, { width: '720px' });
    ref.afterClosed().subscribe((result?: Partial<Producto>) => {
      if (!result) return;
      this.api.crearProducto(result).subscribe(() => {
        this.snack.open('Producto guardado', 'Cerrar', { duration: 2500 });
        this.load();
      });
    });
  }

  registrarEntrada(producto?: Producto) {
    if (!this.productos.length) {
      this.snack.open('Primero registra un producto para poder hacer entradas', 'Cerrar', { duration: 3000 });
      return;
    }

    const ref = this.dialog.open(StockMovementDialogComponent, { width: '520px', data: { productos: this.productos, producto, tipo: 'ENTRADA' } });
    ref.afterClosed().subscribe((result?: StockMovementDialogResult) => {
      if (!result) return;
      this.api.registrarEntrada(result).subscribe(() => {
        this.snack.open('Entrada registrada', 'Cerrar', { duration: 2500 });
        this.load();
      });
    });
  }

  crearOrden() {
    this.navigation.go(4);
  }

  chipMovimiento(tipo: string) {
    if (tipo === 'ENTRADA') return 'success';
    if (tipo === 'SALIDA') return 'warn';
    return 'primary';
  }

  private buildTopSales(movimientos: MovimientoInventario[]) {
    const totals = new Map<string, number>();
    movimientos
      .filter(movimiento => movimiento.tipoMovimiento === 'SALIDA')
      .forEach(movimiento => {
        totals.set(movimiento.producto.nombre, (totals.get(movimiento.producto.nombre) ?? 0) + Math.abs(movimiento.cantidad));
      });

    return [...totals.entries()]
      .map(([producto, cantidad]) => ({ producto, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5);
  }

  private renderCharts() {
    if (!this.viewReady) return;
    this.renderMovementsChart();
    this.renderSalesChart();
  }

  private renderMovementsChart() {
    if (!this.movementsChartCanvas) return;
    this.movementsChart?.destroy();
    const byType = this.movimientos.reduce((acc, movimiento) => {
      acc.set(movimiento.tipoMovimiento, (acc.get(movimiento.tipoMovimiento) ?? 0) + Math.abs(movimiento.cantidad));
      return acc;
    }, new Map<string, number>());
    const labels = byType.size ? [...byType.keys()] : ['Sin movimientos'];
    const values = byType.size ? [...byType.values()] : [0];

    this.movementsChart = new Chart(this.movementsChartCanvas.nativeElement, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: [
            this.cssVar('--app-success', '#2f855a'),
            this.cssVar('--app-accent', '#2f6fab'),
            this.cssVar('--app-warning', '#c47a1c')
          ],
          borderColor: this.cssVar('--app-surface', '#ffffff'),
          borderWidth: 3
        }]
      },
      options: this.chartOptions()
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
          labels: {
            color: this.cssVar('--app-muted', '#667775')
          }
        }
      }
    };
  }

  private cssVar(name: string, fallback: string) {
    return getComputedStyle(document.body).getPropertyValue(name).trim() || fallback;
  }
}
