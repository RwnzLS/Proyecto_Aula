import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { ApiService } from '../../core/api.service';
import { MovimientoInventario, Page, Producto } from '../../core/models';

@Component({
  selector: 'app-movimientos',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DatePipe,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatSelectModule,
    MatTableModule
  ],
  template: `
    <section class="module-page">
      <div class="module-hero">
        <div class="module-title">
          <span class="eyebrow">Trazabilidad</span>
          <h1>Movimientos</h1>
          <p>Audita entradas, salidas y ajustes de inventario por producto.</p>
        </div>
        <div class="module-actions">
          <button mat-stroked-button type="button" (click)="loadMovimientos()">
            <mat-icon>refresh</mat-icon>
            Actualizar
          </button>
        </div>
      </div>

      <div class="filter-panel">
        <mat-form-field appearance="outline">
          <mat-label>Producto</mat-label>
          <mat-select [formControl]="productoFiltro">
            <mat-option [value]="null">Todos</mat-option>
            @for (p of productos; track p.id) {
              <mat-option [value]="p.id">{{ p.nombre }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
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
              <ng-container matColumnDef="tipo"><th mat-header-cell *matHeaderCellDef>Tipo</th><td mat-cell *matCellDef="let m">{{ m.tipoMovimiento }}</td></ng-container>
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
            <p>Los ajustes y recepciones apareceran aqui.</p>
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
  productoFiltro = this.fb.control<number | null>(null);

  constructor(private api: ApiService, private fb: FormBuilder) {}

  ngOnInit() {
    this.loadProductos();
    this.loadMovimientos();
    this.productoFiltro.valueChanges.subscribe(() => this.loadMovimientos(0, this.pageSize));
  }

  loadProductos() {
    this.api.productos({ size: 100 }).subscribe(page => this.productos = page.content);
  }

  loadMovimientos(page = this.pageIndex, size = this.pageSize) {
    this.pageIndex = page;
    this.pageSize = size;
    const productoId = this.productoFiltro.value ?? undefined;
    this.loading = true;
    this.api.movimientos({ productoId, page, size }).subscribe({
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
    this.productoFiltro.setValue(null, { emitEvent: false });
    this.loadMovimientos(0, this.pageSize);
  }

  totalMovimientos() {
    return this.movimientosPage?.totalElements ?? this.movimientos.length;
  }
}
