import { AfterViewInit, Component, ElementRef, OnInit, ViewChild, effect } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Chart } from 'chart.js/auto';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { ApiService } from '../../core/api.service';
import { PrecioProveedor, Producto, Proveedor } from '../../core/models';
import { ThemeService } from '../../core/theme.service';

@Component({
  selector: 'app-precios',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CurrencyPipe,
    DatePipe,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatSelectModule,
    MatSnackBarModule,
    MatTableModule
  ],
  template: `
    <section class="module-page">
      <div class="module-hero">
        <div class="module-title">
          <span class="eyebrow">Analitica de compras</span>
          <h1>Precios</h1>
          <p>Registra precios por proveedor y revisa la tendencia historica por producto.</p>
        </div>
        <div class="module-actions">
          <button mat-stroked-button type="button" (click)="refresh()">
            <mat-icon>refresh</mat-icon>
            Actualizar
          </button>
        </div>
      </div>

      <div class="form-panel">
        <div class="panel-head">
          <div class="panel-title">
            <h2>Registrar precio</h2>
            <p>La combinacion producto/proveedor se guarda como historial.</p>
          </div>
        </div>
        <form [formGroup]="precioForm" (ngSubmit)="registrarPrecio()" class="grid form-grid">
          <mat-form-field appearance="outline">
            <mat-label>Producto</mat-label>
            <mat-select formControlName="productoId">
              @for (p of productos; track p.id) {
                <mat-option [value]="p.id">{{ p.nombre }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Proveedor</mat-label>
            <mat-select formControlName="proveedorId">
              @for (p of proveedores; track p.id) {
                <mat-option [value]="p.id">{{ p.nombre }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Precio</mat-label><input matInput type="number" formControlName="precioUnitario"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Moneda</mat-label><input matInput formControlName="moneda"></mat-form-field>
          <button mat-raised-button color="primary" type="submit" [disabled]="precioForm.invalid">
            <mat-icon>add_chart</mat-icon>
            Registrar
          </button>
        </form>
      </div>

      <div class="filter-panel">
        <mat-form-field appearance="outline">
          <mat-label>Producto del grafico</mat-label>
          <mat-select [formControl]="productoFiltro">
            <mat-option [value]="null">Todos</mat-option>
            @for (p of productos; track p.id) {
              <mat-option [value]="p.id">{{ p.nombre }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <div class="panel-actions">
          <button mat-stroked-button type="button" (click)="limpiarFiltroGrafico()">
            <mat-icon>filter_alt_off</mat-icon>
            Limpiar
          </button>
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
          <div class="empty-state">
            <mat-icon>monitoring</mat-icon>
            <h3>No hay precios registrados</h3>
            <p>Registra un precio o cambia el producto seleccionado.</p>
          </div>
        }
      </div>
    </section>
  `
})
export class PreciosComponent implements OnInit, AfterViewInit {
  @ViewChild('priceChart') chartCanvas?: ElementRef<HTMLCanvasElement>;
  loading = false;
  productos: Producto[] = [];
  proveedores: Proveedor[] = [];
  precios: PrecioProveedor[] = [];
  preciosPagina: PrecioProveedor[] = [];
  precioCols = ['fecha', 'producto', 'proveedor', 'precio'];
  pageIndex = 0;
  pageSize = 20;
  chart?: Chart;
  productoFiltro = this.fb.control<number | null>(null);
  precioForm = this.fb.nonNullable.group({
    productoId: [0, [Validators.required, Validators.min(1)]],
    proveedorId: [0, [Validators.required, Validators.min(1)]],
    precioUnitario: [0, [Validators.required, Validators.min(0)]],
    moneda: ['COP', Validators.required]
  });

  constructor(private api: ApiService, private fb: FormBuilder, private snack: MatSnackBar, private theme: ThemeService) {
    effect(() => {
      this.theme.isDark();
      this.renderChart();
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
  }

  loadProductos() {
    this.api.productos({ size: 100 }).subscribe(page => this.productos = page.content);
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
    if (this.precioForm.invalid) return;
    const value = this.precioForm.getRawValue();
    this.api.registrarPrecio({
      productoId: Number(value.productoId),
      proveedorId: Number(value.proveedorId),
      precioUnitario: Number(value.precioUnitario),
      moneda: value.moneda
    }).subscribe(() => {
      this.snack.open('Precio registrado', 'Cerrar', { duration: 2500 });
      this.precioForm.reset({ productoId: 0, proveedorId: 0, precioUnitario: 0, moneda: 'COP' });
      this.loadPrecios();
      this.loadProveedores();
    });
  }

  onPage(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updatePage();
  }

  limpiarFiltroGrafico() {
    this.productoFiltro.setValue(null, { emitEvent: false });
    this.loadPrecios();
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
        plugins: {
          legend: {
            labels: {
              color: textColor
            }
          }
        },
        scales: {
          x: {
            ticks: { color: textColor },
            grid: { color: gridColor }
          },
          y: {
            ticks: { color: textColor },
            grid: { color: gridColor }
          }
        }
      }
    });
  }

  private cssVar(name: string, fallback: string) {
    return getComputedStyle(document.body).getPropertyValue(name).trim() || fallback;
  }
}
