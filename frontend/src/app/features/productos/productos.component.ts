import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BreakpointObserver } from '@angular/cdk/layout';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { debounceTime, map } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { Page, Producto, Rol } from '../../core/models';
import { ConfirmService } from '../../shared/confirm.service';
import { NotifyService } from '../../shared/notify.service';
import {
  CellDefDirective,
  DataTableComponent,
  TableColumn
} from '../../shared/data-table.component';
import { AjusteDialogComponent, AjusteStockDialogResult } from './ajuste-dialog.component';
import { ProductoFormDialogComponent } from './producto-form-dialog.component';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatChipsModule,
    MatDialogModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
    MatProgressBarModule,
    MatSelectModule,
    DataTableComponent,
    CellDefDirective
  ],
  template: `
    <section class="module-page">
      <div class="module-hero">
        <div class="module-title">
          <span class="eyebrow">Catalogo</span>
          <h1>Productos</h1>
          <p>Consulta, filtra y ajusta el stock sin salir del flujo de inventario.</p>
        </div>
        <div class="module-actions">
          <button mat-stroked-button type="button" (click)="loadProductos()">
            <mat-icon>refresh</mat-icon>
            Actualizar
          </button>
          @if (can(['ADMIN'])) {
            <button mat-raised-button color="primary" type="button" (click)="abrirProducto()">
              <mat-icon>add</mat-icon>
              Producto
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
        <form [formGroup]="productoFiltro" class="grid form-grid">
          <mat-form-field appearance="outline"><mat-label>Nombre</mat-label><input matInput formControlName="nombre"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Categoria</mat-label><input matInput formControlName="categoria"></mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Stock bajo</mat-label>
            <mat-select formControlName="stockBajo">
              <mat-option [value]="null">Todos</mat-option>
              <mat-option [value]="true">Si</mat-option>
              <mat-option [value]="false">No</mat-option>
            </mat-select>
          </mat-form-field>
          @if (can(['ADMIN'])) {
            <mat-form-field appearance="outline">
              <mat-label>Estado</mat-label>
              <mat-select formControlName="activo">
                <mat-option [value]="true">Activos</mat-option>
                <mat-option [value]="false">Inactivos</mat-option>
              </mat-select>
            </mat-form-field>
          }
        </form>
        <div class="panel-actions">
          <button mat-stroked-button type="button" (click)="limpiarFiltros()">
            <mat-icon>filter_alt_off</mat-icon>
            Limpiar
          </button>
        </div>
      </mat-expansion-panel>

      <div class="data-panel">
        <div class="panel-head">
          <div class="panel-title">
            <h2>Inventario disponible</h2>
            <p>{{ totalProductos() }} productos encontrados</p>
          </div>
          <span class="count-pill">{{ productos.length }}</span>
        </div>
        <app-data-table
          [columns]="columns"
          [rows]="productos"
          [loading]="loading"
          [length]="productosPage?.totalElements ?? 0"
          [pageIndex]="pageIndex"
          [pageSize]="pageSize"
          [emptyState]="emptyState"
          (page)="onPage($event)">
          <ng-template [appCellDef]="'nombre'" let-row>
            <div class="nombre-cell">
              <span class="nombre-cell__text u-truncate">{{ row.nombre }}</span>
              <mat-chip *ngIf="!row.activo" class="chip-inactivo" disableRipple>Inactivo</mat-chip>
            </div>
          </ng-template>
          <ng-template [appCellDef]="'stock'" let-row>
            <div class="stock-cell" [class.stock-cell--low]="esBajo(row)">
              <div class="stock-cell__head">
                <span class="stock-cell__value">{{ row.cantidadStock }}</span>
                <span class="stock-cell__min u-text-muted">/ {{ row.stockMinimo }}</span>
              </div>
              <mat-progress-bar
                mode="determinate"
                [value]="progresoStock(row)"
                [color]="esBajo(row) ? 'warn' : 'primary'"
                [attr.aria-label]="'Stock ' + row.cantidadStock + ' de minimo ' + row.stockMinimo">
              </mat-progress-bar>
            </div>
          </ng-template>
          <ng-template [appCellDef]="'acciones'" let-row>
            <ng-container *ngIf="isMobile(); else accionesInline">
              <button mat-icon-button [matMenuTriggerFor]="menu" aria-label="Acciones">
                <mat-icon>more_vert</mat-icon>
              </button>
              <mat-menu #menu="matMenu">
                <button mat-menu-item *ngIf="can(['ADMIN'])" (click)="abrirProducto(row)">
                  <mat-icon>edit</mat-icon>
                  <span>Editar</span>
                </button>
                <button mat-menu-item *ngIf="can(['ADMIN','ALMACENISTA']) && row.activo" (click)="ajustar(row)">
                  <mat-icon>inventory</mat-icon>
                  <span>Ajustar stock</span>
                </button>
                <button mat-menu-item *ngIf="can(['ADMIN']) && row.activo" (click)="desactivar(row)">
                  <mat-icon>block</mat-icon>
                  <span>Desactivar</span>
                </button>
                <button mat-menu-item *ngIf="can(['ADMIN']) && !row.activo" (click)="reactivar(row)">
                  <mat-icon>restart_alt</mat-icon>
                  <span>Reactivar</span>
                </button>
              </mat-menu>
            </ng-container>
            <ng-template #accionesInline>
              <div class="actions">
                <button *ngIf="can(['ADMIN'])" mat-icon-button title="Editar" (click)="abrirProducto(row)">
                  <mat-icon>edit</mat-icon>
                </button>
                <button *ngIf="can(['ADMIN','ALMACENISTA']) && row.activo" mat-icon-button title="Ajustar stock" (click)="ajustar(row)">
                  <mat-icon>inventory</mat-icon>
                </button>
                <button *ngIf="can(['ADMIN']) && row.activo" mat-icon-button title="Desactivar" (click)="desactivar(row)">
                  <mat-icon>block</mat-icon>
                </button>
                <button *ngIf="can(['ADMIN']) && !row.activo" mat-icon-button title="Reactivar" (click)="reactivar(row)">
                  <mat-icon>restart_alt</mat-icon>
                </button>
              </div>
            </ng-template>
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
    .filters-panel mat-panel-description {
      color: var(--app-muted);
    }
    .nombre-cell {
      display: flex;
      align-items: center;
      gap: var(--app-space-2);
    }
    .chip-inactivo {
      --mdc-chip-elevated-container-color: var(--app-surface-muted);
      color: var(--app-muted-strong);
      font-size: var(--app-font-12);
      height: 22px;
    }
    .stock-cell {
      display: grid;
      gap: 4px;
      min-width: 120px;
    }
    .stock-cell__head {
      display: flex;
      align-items: baseline;
      gap: 4px;
      font-variant-numeric: tabular-nums;
    }
    .stock-cell__value {
      color: var(--app-heading);
      font-weight: var(--app-weight-semibold);
    }
    .stock-cell--low .stock-cell__value { color: var(--app-danger); }
    .stock-cell mat-progress-bar { height: 6px; border-radius: 999px; }
  `]
})
export class ProductosComponent implements OnInit {
  private readonly breakpoint = inject(BreakpointObserver);

  loading = false;
  productos: Producto[] = [];
  productosPage?: Page<Producto>;
  pageIndex = 0;
  pageSize = 20;
  productoFiltro = this.fb.group({ nombre: [''], categoria: [''], stockBajo: [null as boolean | null], activo: [true as boolean | null] });

  readonly isMobile = toSignal(
    this.breakpoint.observe('(max-width: 768px)').pipe(map(state => state.matches)),
    { initialValue: false }
  );

  readonly columns: TableColumn<Producto>[] = [
    { key: 'codigo', header: 'Codigo', sortable: true },
    { key: 'nombre', header: 'Nombre', sortable: true, value: row => row.nombre },
    { key: 'categoria', header: 'Categoria', sortable: true },
    { key: 'stock', header: 'Stock', sortable: true, value: row => row.cantidadStock },
    { key: 'acciones', header: 'Acciones', align: 'end' }
  ];

  readonly emptyState = {
    icon: 'inventory_2',
    title: 'No hay productos para mostrar',
    message: 'Ajusta los filtros o registra un nuevo producto.'
  };

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private confirmService: ConfirmService,
    private notify: NotifyService
  ) {}

  ngOnInit() {
    this.loadProductos();
    this.productoFiltro.valueChanges.pipe(debounceTime(350)).subscribe(() => this.loadProductos(0, this.pageSize));
  }

  can(roles: Rol[]) {
    return this.auth.hasRole(roles);
  }

  esBajo(producto: Producto): boolean {
    return producto.cantidadStock <= producto.stockMinimo;
  }

  progresoStock(producto: Producto): number {
    if (!producto.stockMinimo) {
      return producto.cantidadStock > 0 ? 100 : 0;
    }
    const ratio = (producto.cantidadStock / producto.stockMinimo) * 100;
    return Math.max(0, Math.min(100, ratio));
  }

  filtrosResumen(): string {
    const value = this.productoFiltro.getRawValue();
    const parts: string[] = [];
    if (value.nombre) parts.push(`nombre: ${value.nombre}`);
    if (value.categoria) parts.push(`categoria: ${value.categoria}`);
    if (value.stockBajo === true) parts.push('stock bajo');
    if (value.stockBajo === false) parts.push('stock ok');
    if (value.activo === false) parts.push('inactivos');
    return parts.length ? parts.join(' - ') : 'Sin filtros activos';
  }

  loadProductos(page = this.pageIndex, size = this.pageSize) {
    this.pageIndex = page;
    this.pageSize = size;
    this.loading = true;
    this.api.productos({ ...this.productoFiltro.getRawValue(), page, size }).subscribe({
      next: productosPage => {
        this.productosPage = productosPage;
        this.productos = productosPage.content;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  onPage(event: PageEvent) {
    this.loadProductos(event.pageIndex, event.pageSize);
  }

  limpiarFiltros() {
    this.productoFiltro.reset({ nombre: '', categoria: '', stockBajo: null, activo: true }, { emitEvent: false });
    this.loadProductos(0, this.pageSize);
  }

  totalProductos() {
    return this.productosPage?.totalElements ?? this.productos.length;
  }

  abrirProducto(producto?: Producto) {
    const ref = this.dialog.open(ProductoFormDialogComponent, { width: '720px', data: { producto } });
    ref.afterClosed().subscribe((result?: Partial<Producto>) => {
      if (!result) return;
      const call = producto ? this.api.actualizarProducto(producto.id, result) : this.api.crearProducto(result);
      call.subscribe(() => {
        this.notify.success('Producto guardado');
        this.loadProductos();
      });
    });
  }

  ajustar(producto: Producto) {
    const ref = this.dialog.open(AjusteDialogComponent, { width: '460px', data: { producto } });
    ref.afterClosed().subscribe((result?: AjusteStockDialogResult) => {
      if (!result) return;
      this.api.ajustarStock(producto.id, result.cantidad, result.motivo).subscribe(() => {
        this.notify.success('Stock ajustado');
        this.loadProductos();
      });
    });
  }

  async desactivar(producto: Producto) {
    const ok = await this.confirmService.confirm({
      title: 'Desactivar producto',
      message: `El producto ${producto.nombre} dejara de aparecer en filtros operativos. Continuar?`,
      confirmLabel: 'Desactivar',
      cancelLabel: 'Volver',
      variant: 'danger'
    });
    if (!ok) return;

    this.api.eliminarProducto(producto.id).subscribe(() => {
      this.notify.warning('Producto desactivado');
      const nextPage = this.productos.length === 1 && this.pageIndex > 0 ? this.pageIndex - 1 : this.pageIndex;
      this.loadProductos(nextPage, this.pageSize);
    });
  }

  reactivar(producto: Producto) {
    this.api.reactivarProducto(producto.id).subscribe(() => {
      this.notify.success('Producto reactivado');
      this.loadProductos();
    });
  }
}
