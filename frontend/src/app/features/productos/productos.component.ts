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
import { Page, Producto, Rol } from '../../core/models';
import { AjusteDialogComponent, AjusteStockDialogResult } from './ajuste-dialog.component';
import { ProductoFormDialogComponent } from './producto-form-dialog.component';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [
    ReactiveFormsModule,
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

      <div class="filter-panel">
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
        </form>
        <div class="panel-actions">
          <button mat-stroked-button type="button" (click)="limpiarFiltros()">
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
            <h2>Inventario disponible</h2>
            <p>{{ totalProductos() }} productos encontrados</p>
          </div>
          <span class="count-pill">{{ productos.length }}</span>
        </div>
        @if (productos.length) {
          <div class="table-wrap">
            <table mat-table [dataSource]="productos">
              <ng-container matColumnDef="codigo"><th mat-header-cell *matHeaderCellDef>Codigo</th><td mat-cell *matCellDef="let p">{{ p.codigo }}</td></ng-container>
              <ng-container matColumnDef="nombre"><th mat-header-cell *matHeaderCellDef>Nombre</th><td mat-cell *matCellDef="let p">{{ p.nombre }}</td></ng-container>
              <ng-container matColumnDef="categoria"><th mat-header-cell *matHeaderCellDef>Categoria</th><td mat-cell *matCellDef="let p">{{ p.categoria }}</td></ng-container>
              <ng-container matColumnDef="stock">
                <th mat-header-cell *matHeaderCellDef>Stock</th>
                <td mat-cell *matCellDef="let p">
                  <mat-chip [class]="p.cantidadStock <= p.stockMinimo ? 'chip-danger' : 'chip-ok'">
                    {{ p.cantidadStock }} / {{ p.stockMinimo }}
                  </mat-chip>
                </td>
              </ng-container>
              <ng-container matColumnDef="acciones">
                <th mat-header-cell *matHeaderCellDef>Acciones</th>
                <td mat-cell *matCellDef="let p" class="actions">
                  @if (can(['ADMIN'])) {
                    <button mat-icon-button title="Editar" (click)="abrirProducto(p)"><mat-icon>edit</mat-icon></button>
                  }
                  @if (can(['ADMIN','ALMACENISTA'])) {
                    <button mat-icon-button title="Ajustar" (click)="ajustar(p)"><mat-icon>inventory</mat-icon></button>
                  }
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="productoCols"></tr>
              <tr mat-row *matRowDef="let row; columns: productoCols;"></tr>
            </table>
            <mat-paginator [length]="productosPage?.totalElements ?? 0" [pageIndex]="pageIndex" [pageSize]="pageSize" [pageSizeOptions]="[10,20,50]" (page)="onPage($event)" />
          </div>
        } @else {
          <div class="empty-state">
            <mat-icon>inventory_2</mat-icon>
            <h3>No hay productos para mostrar</h3>
            <p>Ajusta los filtros o registra un nuevo producto.</p>
          </div>
        }
      </div>
    </section>
  `
})
export class ProductosComponent implements OnInit {
  loading = false;
  productos: Producto[] = [];
  productosPage?: Page<Producto>;
  pageIndex = 0;
  pageSize = 20;
  productoCols = ['codigo', 'nombre', 'categoria', 'stock', 'acciones'];
  productoFiltro = this.fb.group({ nombre: [''], categoria: [''], stockBajo: [null as boolean | null] });

  constructor(private api: ApiService, private auth: AuthService, private fb: FormBuilder, private dialog: MatDialog, private snack: MatSnackBar) {}

  ngOnInit() {
    this.loadProductos();
    this.productoFiltro.valueChanges.pipe(debounceTime(350)).subscribe(() => this.loadProductos(0, this.pageSize));
  }

  can(roles: Rol[]) {
    return this.auth.hasRole(roles);
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
    this.productoFiltro.reset({ nombre: '', categoria: '', stockBajo: null }, { emitEvent: false });
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
        this.snack.open('Producto guardado', 'Cerrar', { duration: 2500 });
        this.loadProductos();
      });
    });
  }

  ajustar(producto: Producto) {
    const ref = this.dialog.open(AjusteDialogComponent, { width: '420px', data: { producto } });
    ref.afterClosed().subscribe((result?: AjusteStockDialogResult) => {
      if (!result) return;
      this.api.ajustarStock(producto.id, result.cantidad, result.motivo).subscribe(() => {
        this.snack.open('Stock ajustado', 'Cerrar', { duration: 2500 });
        this.loadProductos();
      });
    });
  }
}
