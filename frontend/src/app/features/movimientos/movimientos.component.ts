import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { BreakpointObserver } from '@angular/cdk/layout';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, debounceTime, finalize, map, of, timeout } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { MovimientoInventario, Page, Producto, Rol, TipoMovimiento } from '../../core/models';
import { NotifyService } from '../../shared/notify.service';
import {
  CellDefDirective,
  DataTableComponent,
  TableColumn
} from '../../shared/data-table.component';
import { StockMovementDialogComponent, StockMovementDialogResult } from './stock-movement-dialog.component';

@Component({
  selector: 'app-movimientos',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DatePipe,
    MatButtonModule,
    MatChipsModule,
    MatDialogModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    DataTableComponent,
    CellDefDirective
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
          <button mat-stroked-button type="button" (click)="exportarCsv()" [disabled]="!movimientos.length">
            <mat-icon>download</mat-icon>
            CSV
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

      <mat-expansion-panel
        class="filters-panel"
        [expanded]="!isMobile()"
        [hideToggle]="!isMobile()">
        <mat-expansion-panel-header>
          <mat-panel-title>
            <mat-icon>filter_list</mat-icon>
            <span>Filtros</span>
          </mat-panel-title>
          <mat-panel-description *ngIf="isMobile()">{{ filtrosResumen() }}</mat-panel-description>
        </mat-expansion-panel-header>
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
      </mat-expansion-panel>

      <div class="data-panel">
        <div class="panel-head">
          <div class="panel-title">
            <h2>Historial de movimientos</h2>
            <p>{{ totalMovimientos() }} movimientos encontrados</p>
          </div>
          <span class="count-pill">{{ movimientos.length }}</span>
        </div>
        <app-data-table
          [columns]="columns"
          [rows]="movimientos"
          [loading]="loading"
          [length]="movimientosPage?.totalElements ?? 0"
          [pageIndex]="pageIndex"
          [pageSize]="pageSize"
          [emptyState]="emptyState"
          (page)="onPage($event)">
          <ng-template [appCellDef]="'fecha'" let-row>{{ row.fecha | date:'short' }}</ng-template>
          <ng-template [appCellDef]="'producto'" let-row>{{ row.producto.nombre }}</ng-template>
          <ng-template [appCellDef]="'tipo'" let-row>
            <mat-chip [class]="chipMovimiento(row.tipoMovimiento)">
              <mat-icon class="chip-icon">{{ iconoMovimiento(row.tipoMovimiento) }}</mat-icon>
              {{ row.tipoMovimiento }}
            </mat-chip>
          </ng-template>
        </app-data-table>
      </div>
    </section>
  `,
  styles: [`
    .filters-panel {
      background: var(--app-surface);
      border: 1px solid var(--app-border);
      border-radius: var(--app-radius-3);
      box-shadow: var(--app-elevation-2);
    }
    .filters-panel mat-panel-title {
      display: flex;
      align-items: center;
      gap: var(--app-space-2);
      color: var(--app-heading);
      font-weight: var(--app-weight-semibold);
    }
    .filters-panel mat-panel-description { color: var(--app-muted); }
    .chip-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      margin-right: 4px;
    }
    .mat-mdc-chip.info {
      --mdc-chip-elevated-container-color: var(--app-accent);
      color: white;
    }
  `]
})
export class MovimientosComponent implements OnInit {
  private readonly breakpoint = inject(BreakpointObserver);

  loading = false;
  productos: Producto[] = [];
  movimientos: MovimientoInventario[] = [];
  movimientosPage?: Page<MovimientoInventario>;
  pageIndex = 0;
  pageSize = 20;
  tiposMovimiento: TipoMovimiento[] = ['ENTRADA', 'SALIDA', 'AJUSTE'];
  filtros = this.fb.group({
    productoId: [null as number | null],
    tipoMovimiento: [null as TipoMovimiento | null],
    fechaDesde: [''],
    fechaHasta: ['']
  });

  readonly isMobile = toSignal(
    this.breakpoint.observe('(max-width: 768px)').pipe(map(state => state.matches)),
    { initialValue: false }
  );

  readonly columns: TableColumn<MovimientoInventario>[] = [
    { key: 'fecha', header: 'Fecha', sortable: true, value: row => row.fecha },
    { key: 'producto', header: 'Producto', sortable: true, value: row => row.producto?.nombre ?? 'Producto no disponible' },
    { key: 'tipo', header: 'Tipo', sortable: true, value: row => row.tipoMovimiento },
    { key: 'cantidad', header: 'Cantidad', sortable: true, align: 'end', value: row => row.cantidad },
    { key: 'referencia', header: 'Referencia', value: row => row.referencia }
  ];

  readonly emptyState = {
    icon: 'sync_alt',
    title: 'No hay movimientos registrados',
    message: 'Registra entradas o salidas, o cambia los filtros activos.'
  };

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private notify: NotifyService
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
    this.api.productos({ size: 200 }).pipe(
      timeout(8000),
      catchError(() => of({ content: [] }))
    ).subscribe(page => this.productos = page.content);
  }

  loadMovimientos(page = this.pageIndex, size = this.pageSize) {
    this.pageIndex = page;
    this.pageSize = size;
    const values = this.filtros.getRawValue();
    this.loading = true;
    this.api.movimientos({ ...values, page, size }).pipe(
      timeout(8000),
      finalize(() => this.loading = false)
    ).subscribe({
      next: movimientosPage => {
        this.movimientosPage = movimientosPage;
        this.movimientos = movimientosPage.content;
      },
      error: () => {
        this.movimientosPage = undefined;
        this.movimientos = [];
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

  filtrosResumen(): string {
    const value = this.filtros.getRawValue();
    const parts: string[] = [];
    if (value.tipoMovimiento) parts.push(`tipo: ${value.tipoMovimiento}`);
    if (value.productoId) {
      const p = this.productos.find(prod => prod.id === value.productoId);
      if (p) parts.push(`producto: ${p.nombre}`);
    }
    if (value.fechaDesde) parts.push(`desde: ${value.fechaDesde}`);
    if (value.fechaHasta) parts.push(`hasta: ${value.fechaHasta}`);
    return parts.length ? parts.join(' - ') : 'Sin filtros activos';
  }

  registrarMovimiento(tipo: Exclude<TipoMovimiento, 'AJUSTE'>) {
    if (!this.productos.length) {
      this.notify.warning('Primero registra un producto');
      return;
    }

    const ref = this.dialog.open(StockMovementDialogComponent, { width: '520px', data: { productos: this.productos, tipo } });
    ref.afterClosed().subscribe((result?: StockMovementDialogResult) => {
      if (!result) return;
      const call = tipo === 'ENTRADA' ? this.api.registrarEntrada(result) : this.api.registrarSalida(result);
      call.subscribe(() => {
        this.notify.success(tipo === 'ENTRADA' ? 'Entrada registrada' : 'Salida registrada');
        this.loadProductos();
        this.loadMovimientos(0, this.pageSize);
      });
    });
  }

  chipMovimiento(tipo: TipoMovimiento) {
    if (tipo === 'ENTRADA') return 'success';
    if (tipo === 'SALIDA') return 'warn';
    return 'info';
  }

  iconoMovimiento(tipo: TipoMovimiento) {
    if (tipo === 'ENTRADA') return 'south_west';
    if (tipo === 'SALIDA') return 'north_east';
    return 'tune';
  }

  totalMovimientos() {
    return this.movimientosPage?.totalElements ?? this.movimientos.length;
  }

  exportarCsv() {
    if (!this.movimientos.length) return;
    const header = ['Fecha', 'Producto', 'Codigo', 'Tipo', 'Cantidad', 'Referencia'];
    const rows = this.movimientos.map(m => [
      m.fecha,
      m.producto?.nombre ?? 'Producto no disponible',
      m.producto?.codigo ?? '',
      m.tipoMovimiento,
      String(m.cantidad),
      m.referencia ?? ''
    ]);
    const csv = [header, ...rows].map(row => row.map(this.csvCell).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const fechaArchivo = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `movimientos-${fechaArchivo}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    this.notify.success(`Exportados ${this.movimientos.length} movimientos`);
  }

  private csvCell(value: string): string {
    const needsQuotes = /[",\n]/.test(value);
    const escaped = value.replace(/"/g, '""');
    return needsQuotes ? `"${escaped}"` : escaped;
  }
}
