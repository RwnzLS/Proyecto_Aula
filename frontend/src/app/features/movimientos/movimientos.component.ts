import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { debounceTime } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { MovimientoInventario, Page, Producto, Rol, TipoMovimiento } from '../../core/models';
import { StockMovementDialogComponent, StockMovementDialogResult } from './stock-movement-dialog.component';

@Component({
  selector: 'app-movimientos',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DatePipe,
    MatButtonModule,
    MatChipsModule,
    MatDialogModule,
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
          <span class="eyebrow">Trazabilidad</span>
          <h1>Movimientos</h1>
          <p>Audita entradas, salidas y ajustes con filtros por producto, tipo y fecha.</p>
        </div>
        <div class="module-actions">
          <button mat-stroked-button type="button" (click)="loadMovimientos()">
            <mat-icon>refresh</mat-icon>
            Actualizar
          </button>
          @if (can(['ADMIN','ALMACENISTA'])) {
            <button mat-raised-button color="primary" type="button" (click)="registrarMovimiento('ENTRADA')">
              <mat-icon>add_box</mat-icon>
              Entrada
            </button>
            <button mat-stroked-button type="button" (click)="registrarMovimiento('SALIDA')">
              <mat-icon>remove_circle</mat-icon>
              Salida
            </button>
          }
        </div>
      </div>

      <div class="filter-panel">
        <form [formGroup]="filtros" class="grid form-grid">
          <mat-form-field appearance="outline">
            <mat-label>Producto</mat-label>
            <mat-select formControlName="productoId">
              <mat-option [value]="null">Todos</mat-option>
              @for (p of productos; track p.id) {
                <mat-option [value]="p.id">{{ p.nombre }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Tipo</mat-label>
            <mat-select formControlName="tipoMovimiento">
              <mat-option [value]="null">Todos</mat-option>
              @for (tipo of tiposMovimiento; track tipo) {
                <mat-option [value]="tipo">{{ tipo }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Desde</mat-label>
            <input matInput type="date" formControlName="fechaDesde">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Hasta</mat-label>
            <input matInput type="date" formControlName="fechaHasta">
          </mat-form-field>
        </form>
        <div class="panel-actions">
          <button mat-stroked-button type="button" (click)="limpiarFiltro()">
            <mat-icon>filter_alt_off</mat-icon>
            Limpiar
          </button>
        </div>
      </div>

      @if (loading) {
        <mat-progress-bar mode="indeterminate" />
      }

      <div class="data-panel">
        <div class="panel-head">
          <div class="panel-title">
            <h2>Historial de movimientos</h2>
            <p>{{ totalMovimientos() }} movimientos encontrados</p>
          </div>
          <span class="count-pill">{{ movimientos.length }}</span>
        </div>
        @if (movimientos.length) {
          <div class="table-wrap">
            <table mat-table [dataSource]="movimientos">
              <ng-container matColumnDef="fecha"><th mat-header-cell *matHeaderCellDef>Fecha</th><td mat-cell *matCellDef="let m">{{ m.fecha | date:'short' }}</td></ng-container>
              <ng-container matColumnDef="producto"><th mat-header-cell *matHeaderCellDef>Producto</th><td mat-cell *matCellDef="let m">{{ m.producto.nombre }}</td></ng-container>
              <ng-container matColumnDef="tipo"><th mat-header-cell *matHeaderCellDef>Tipo</th><td mat-cell *matCellDef="let m"><mat-chip [class]="chipMovimiento(m.tipoMovimiento)">{{ m.tipoMovimiento }}</mat-chip></td></ng-container>
              <ng-container matColumnDef="cantidad"><th mat-header-cell *matHeaderCellDef>Cantidad</th><td mat-cell *matCellDef="let m">{{ m.cantidad }}</td></ng-container>
              <ng-container matColumnDef="referencia"><th mat-header-cell *matHeaderCellDef>Referencia</th><td mat-cell *matCellDef="let m">{{ m.referencia }}</td></ng-container>
              <tr mat-header-row *matHeaderRowDef="movCols"></tr>
              <tr mat-row *matRowDef="let row; columns: movCols;"></tr>
            </table>
            <mat-paginator [length]="movimientosPage?.totalElements ?? 0" [pageIndex]="pageIndex" [pageSize]="pageSize" [pageSizeOptions]="[10,20,50]" (page)="onPage($event)" />
          </div>
        } @else {
          <div class="empty-state">
            <mat-icon>sync_alt</mat-icon>
            <h3>No hay movimientos registrados</h3>
            <p>Registra entradas o salidas, o cambia los filtros activos.</p>
          </div>
        }
      </div>
    </section>
  `
})
export class MovimientosComponent implements OnInit {
  loading = false;
  productos: Producto[] = [];
  movimientos: MovimientoInventario[] = [];
  movimientosPage?: Page<MovimientoInventario>;
  pageIndex = 0;
  pageSize = 20;
  movCols = ['fecha', 'producto', 'tipo', 'cantidad', 'referencia'];
  tiposMovimiento: TipoMovimiento[] = ['ENTRADA', 'SALIDA', 'AJUSTE'];
  filtros = this.fb.group({
    productoId: [null as number | null],
    tipoMovimiento: [null as TipoMovimiento | null],
    fechaDesde: [''],
    fechaHasta: ['']
  });

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private snack: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadProductos();
    this.loadMovimientos();
    this.filtros.valueChanges.pipe(debounceTime(300)).subscribe(() => this.loadMovimientos(0, this.pageSize));
  }

  can(roles: Rol[]) {
    return this.auth.hasRole(roles);
  }

  loadProductos() {
    this.api.productos({ size: 200 }).subscribe(page => this.productos = page.content);
  }

  loadMovimientos(page = this.pageIndex, size = this.pageSize) {
    this.pageIndex = page;
    this.pageSize = size;
    const values = this.filtros.getRawValue();
    this.loading = true;
    this.api.movimientos({ ...values, page, size }).subscribe({
      next: movimientosPage => {
        this.movimientosPage = movimientosPage;
        this.movimientos = movimientosPage.content;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  onPage(event: PageEvent) {
    this.loadMovimientos(event.pageIndex, event.pageSize);
  }

  limpiarFiltro() {
    this.filtros.reset({ productoId: null, tipoMovimiento: null, fechaDesde: '', fechaHasta: '' }, { emitEvent: false });
    this.loadMovimientos(0, this.pageSize);
  }

  registrarMovimiento(tipo: Exclude<TipoMovimiento, 'AJUSTE'>) {
    if (!this.productos.length) {
      this.snack.open('Primero registra un producto', 'Cerrar', { duration: 3000 });
      return;
    }

    const ref = this.dialog.open(StockMovementDialogComponent, { width: '520px', data: { productos: this.productos, tipo } });
    ref.afterClosed().subscribe((result?: StockMovementDialogResult) => {
      if (!result) return;
      const call = tipo === 'ENTRADA' ? this.api.registrarEntrada(result) : this.api.registrarSalida(result);
      call.subscribe(() => {
        this.snack.open(tipo === 'ENTRADA' ? 'Entrada registrada' : 'Salida registrada', 'Cerrar', { duration: 2500 });
        this.loadProductos();
        this.loadMovimientos(0, this.pageSize);
      });
    });
  }

  chipMovimiento(tipo: TipoMovimiento) {
    if (tipo === 'ENTRADA') return 'success';
    if (tipo === 'SALIDA') return 'warn';
    return 'primary';
  }

  totalMovimientos() {
    return this.movimientosPage?.totalElements ?? this.movimientos.length;
  }
}
