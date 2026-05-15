import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { debounceTime } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { PageEvent } from '@angular/material/paginator';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { Page, Proveedor, Rol } from '../../core/models';
import { NotifyService } from '../../shared/notify.service';
import {
  CellDefDirective,
  DataTableComponent,
  TableColumn
} from '../../shared/data-table.component';
import { ProveedorFormDialogComponent } from './proveedor-form-dialog.component';

@Component({
  selector: 'app-proveedores',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    DataTableComponent,
    CellDefDirective
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

      <div class="data-panel">
        <div class="panel-head">
          <div class="panel-title">
            <h2>Directorio de proveedores</h2>
            <p>{{ totalProveedores() }} registros encontrados</p>
          </div>
          <span class="count-pill">{{ proveedores.length }}</span>
        </div>
        <app-data-table
          [columns]="columns"
          [rows]="proveedores"
          [loading]="loading"
          [length]="proveedoresPage?.totalElements ?? 0"
          [pageIndex]="pageIndex"
          [pageSize]="pageSize"
          [emptyState]="emptyState"
          (page)="onPage($event)">
          <ng-template [appCellDef]="'acciones'" let-row>
            <div class="actions">
              @if (can(['ADMIN'])) {
                <button mat-icon-button title="Editar" (click)="abrirProveedor(row)"><mat-icon>edit</mat-icon></button>
              }
            </div>
          </ng-template>
        </app-data-table>
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
  filtro = this.fb.group({ nombre: [''] });

  readonly columns: TableColumn<Proveedor>[] = [
    { key: 'nombre', header: 'Nombre', sortable: true },
    { key: 'rucNit', header: 'RUC/NIT', sortable: true },
    { key: 'email', header: 'Email', sortable: true },
    { key: 'acciones', header: 'Acciones', align: 'end' }
  ];

  readonly emptyState = {
    icon: 'business',
    title: 'No hay proveedores para mostrar',
    message: 'Ajusta la busqueda o crea un proveedor.'
  };

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private notify: NotifyService
  ) {}

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
        this.notify.success('Proveedor guardado');
        this.loadProveedores();
        this.api.dashboard().subscribe();
      });
    });
  }
}
