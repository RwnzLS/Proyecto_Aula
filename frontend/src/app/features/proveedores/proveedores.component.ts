import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { debounceTime } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PageEvent } from '@angular/material/paginator';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { Page, Proveedor, Rol } from '../../core/models';
import { ConfirmService } from '../../shared/confirm.service';
import { NotifyService } from '../../shared/notify.service';
import { PageHeaderComponent } from '../../shared/page-header.component';
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
    MatChipsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatTooltipModule,
    DataTableComponent,
    CellDefDirective,
    PageHeaderComponent
  ],
  template: `
    <section class="module-page">
      <app-page-header eyebrow="Abastecimiento" title="Proveedores" subtitle="Administra contactos y datos comerciales de los aliados de compra.">
        <button actions mat-stroked-button type="button" (click)="loadProveedores()">
          <mat-icon>refresh</mat-icon>
          Actualizar
        </button>
        @if (can(['ADMIN'])) {
          <button actions mat-raised-button color="primary" type="button" (click)="abrirProveedor()">
            <mat-icon>add</mat-icon>
            Proveedor
          </button>
        }
      </app-page-header>

      <div class="filter-panel">
        <form [formGroup]="filtro" class="grid form-grid">
          <mat-form-field appearance="outline">
            <mat-label>Buscar por nombre</mat-label>
            <input matInput formControlName="nombre" placeholder="Escribe parte del nombre...">
            <mat-icon matSuffix>search</mat-icon>
          </mat-form-field>
        </form>
        <div class="panel-actions">
          <button mat-stroked-button type="button" (click)="limpiarFiltro()" matTooltip="Quitar filtros">
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
          <ng-template [appCellDef]="'nombre'" let-row>
            <div class="nombre-cell">
              <span class="u-truncate">{{ row.nombre }}</span>
              @if (!row.activo) {
                <mat-chip class="chip-inactivo" disableRipple>Inactivo</mat-chip>
              }
            </div>
          </ng-template>
          <ng-template [appCellDef]="'contacto'" let-row>
            <div class="contacto-cell">
              @if (row.email) {
                <a [href]="'mailto:' + row.email" class="contacto-link">
                  <mat-icon>mail_outline</mat-icon>
                  {{ row.email }}
                </a>
              }
              @if (row.telefono) {
                <span class="contacto-tel u-text-muted">
                  <mat-icon>call</mat-icon>
                  {{ row.telefono }}
                </span>
              }
              @if (!row.email && !row.telefono) {
                <span class="u-text-muted">—</span>
              }
            </div>
          </ng-template>
          <ng-template [appCellDef]="'acciones'" let-row>
            <div class="actions">
              @if (can(['ADMIN'])) {
                <button mat-icon-button matTooltip="Editar proveedor" (click)="abrirProveedor(row)">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button matTooltip="Desactivar proveedor" (click)="desactivar(row)">
                  <mat-icon>block</mat-icon>
                </button>
              }
            </div>
          </ng-template>
        </app-data-table>
      </div>
    </section>
  `,
  styles: [`
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
    .contacto-cell {
      display: grid;
      gap: 4px;
    }
    .contacto-link {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      color: var(--app-brand-strong);
      text-decoration: none;
    }
    .contacto-link:hover { text-decoration: underline; }
    .contacto-tel {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .contacto-cell mat-icon { font-size: 16px; width: 16px; height: 16px; }
  `]
})
export class ProveedoresComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  private readonly confirmService = inject(ConfirmService);
  private readonly notify = inject(NotifyService);

  loading = false;
  proveedores: Proveedor[] = [];
  proveedoresPage?: Page<Proveedor>;
  pageIndex = 0;
  pageSize = 20;
  filtro = this.fb.group({ nombre: [''] });

  readonly columns: TableColumn<Proveedor>[] = [
    { key: 'nombre', header: 'Nombre', sortable: true, value: row => row.nombre },
    { key: 'rucNit', header: 'RUC/NIT', sortable: true },
    { key: 'contacto', header: 'Contacto' },
    { key: 'direccion', header: 'Direccion' },
    { key: 'acciones', header: 'Acciones', align: 'end' }
  ];

  readonly emptyState = {
    icon: 'business',
    title: 'No hay proveedores para mostrar',
    message: 'Ajusta la busqueda o registra un nuevo proveedor.'
  };

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

  async desactivar(proveedor: Proveedor) {
    const ok = await this.confirmService.confirm({
      title: 'Desactivar proveedor',
      message: `El proveedor ${proveedor.nombre} dejara de aparecer en sugerencias y listados activos. Continuar?`,
      confirmLabel: 'Desactivar',
      cancelLabel: 'Volver',
      variant: 'danger'
    });
    if (!ok) return;

    this.api.eliminarProveedor(proveedor.id).subscribe(() => {
      this.notify.warning('Proveedor desactivado');
      const nextPage = this.proveedores.length === 1 && this.pageIndex > 0 ? this.pageIndex - 1 : this.pageIndex;
      this.loadProveedores(nextPage, this.pageSize);
      this.api.dashboard().subscribe();
    });
  }
}
