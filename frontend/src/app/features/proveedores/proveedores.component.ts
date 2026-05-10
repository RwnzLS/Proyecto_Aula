import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { debounceTime } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { Page, Proveedor, Rol } from '../../core/models';
import { ProveedorFormDialogComponent } from './proveedor-form-dialog.component';

@Component({
  selector: 'app-proveedores',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatTableModule
  ],
  template: `
    <section class="module-page">
      <div class="module-hero">
        <div class="module-title">
          <span class="eyebrow">Abastecimiento</span>
          <h1>Proveedores</h1>
          <p>Administra contactos y datos comerciales de los aliados de compra.</p>
        </div>
        <div class="module-actions">
          <button mat-stroked-button type="button" (click)="loadProveedores()">
            <mat-icon>refresh</mat-icon>
            Actualizar
          </button>
          @if (can(['ADMIN'])) {
            <button mat-raised-button color="primary" type="button" (click)="abrirProveedor()">
              <mat-icon>add</mat-icon>
              Proveedor
            </button>
          }
        </div>
      </div>

      <div class="filter-panel">
        <form [formGroup]="filtro" class="grid form-grid">
          <mat-form-field appearance="outline"><mat-label>Nombre</mat-label><input matInput formControlName="nombre"></mat-form-field>
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
            <h2>Directorio de proveedores</h2>
            <p>{{ totalProveedores() }} registros encontrados</p>
          </div>
          <span class="count-pill">{{ proveedores.length }}</span>
        </div>
        @if (proveedores.length) {
          <div class="table-wrap">
            <table mat-table [dataSource]="proveedores">
              <ng-container matColumnDef="nombre"><th mat-header-cell *matHeaderCellDef>Nombre</th><td mat-cell *matCellDef="let p">{{ p.nombre }}</td></ng-container>
              <ng-container matColumnDef="rucNit"><th mat-header-cell *matHeaderCellDef>RUC/NIT</th><td mat-cell *matCellDef="let p">{{ p.rucNit }}</td></ng-container>
              <ng-container matColumnDef="email"><th mat-header-cell *matHeaderCellDef>Email</th><td mat-cell *matCellDef="let p">{{ p.email }}</td></ng-container>
              <ng-container matColumnDef="acciones">
                <th mat-header-cell *matHeaderCellDef>Acciones</th>
                <td mat-cell *matCellDef="let p">
                  @if (can(['ADMIN'])) {
                    <button mat-icon-button title="Editar" (click)="abrirProveedor(p)"><mat-icon>edit</mat-icon></button>
                  }
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="proveedorCols"></tr>
              <tr mat-row *matRowDef="let row; columns: proveedorCols;"></tr>
            </table>
            <mat-paginator [length]="proveedoresPage?.totalElements ?? 0" [pageIndex]="pageIndex" [pageSize]="pageSize" [pageSizeOptions]="[10,20,50]" (page)="onPage($event)" />
          </div>
        } @else {
          <div class="empty-state">
            <mat-icon>business</mat-icon>
            <h3>No hay proveedores para mostrar</h3>
            <p>Ajusta la busqueda o crea un proveedor.</p>
          </div>
        }
      </div>
    </section>
  `
})
export class ProveedoresComponent implements OnInit {
  loading = false;
  proveedores: Proveedor[] = [];
  proveedoresPage?: Page<Proveedor>;
  pageIndex = 0;
  pageSize = 20;
  proveedorCols = ['nombre', 'rucNit', 'email', 'acciones'];
  filtro = this.fb.group({ nombre: [''] });

  constructor(private api: ApiService, private auth: AuthService, private fb: FormBuilder, private dialog: MatDialog, private snack: MatSnackBar) {}

  ngOnInit() {
    this.loadProveedores();
    this.filtro.valueChanges.pipe(debounceTime(350)).subscribe(() => this.loadProveedores(0, this.pageSize));
  }

  can(roles: Rol[]) {
    return this.auth.hasRole(roles);
  }

  loadProveedores(page = this.pageIndex, size = this.pageSize) {
    this.pageIndex = page;
    this.pageSize = size;
    this.loading = true;
    this.api.proveedores({ ...this.filtro.getRawValue(), page, size }).subscribe({
      next: proveedoresPage => {
        this.proveedoresPage = proveedoresPage;
        this.proveedores = proveedoresPage.content;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  onPage(event: PageEvent) {
    this.loadProveedores(event.pageIndex, event.pageSize);
  }

  limpiarFiltro() {
    this.filtro.reset({ nombre: '' }, { emitEvent: false });
    this.loadProveedores(0, this.pageSize);
  }

  totalProveedores() {
    return this.proveedoresPage?.totalElements ?? this.proveedores.length;
  }

  abrirProveedor(proveedor?: Proveedor) {
    const ref = this.dialog.open(ProveedorFormDialogComponent, { width: '720px', data: { proveedor } });
    ref.afterClosed().subscribe((result?: Partial<Proveedor>) => {
      if (!result) return;
      this.api.guardarProveedor(result, proveedor?.id).subscribe(() => {
        this.snack.open('Proveedor guardado', 'Cerrar', { duration: 2500 });
        this.loadProveedores();
        this.api.dashboard().subscribe();
      });
    });
  }
}
