import { Component, OnInit } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { EstadoOrden, OrdenCompra, Page, Rol } from '../../core/models';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog.component';
import { OrdenFormComponent } from './orden-form.component';
import { RecepcionDialogComponent, RecepcionItem } from './recepcion-dialog.component';

@Component({
  selector: 'app-ordenes',
  standalone: true,
  imports: [
    CurrencyPipe,
    DatePipe,
    MatButtonModule,
    MatChipsModule,
    MatDialogModule,
    MatIconModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatTableModule,
    OrdenFormComponent
  ],
  template: `
    <section class="module-page">
      <div class="module-hero">
        <div class="module-title">
          <span class="eyebrow">Compras</span>
          <h1>Ordenes</h1>
          <p>Crea, envia, recibe y cancela ordenes segun su estado operativo.</p>
        </div>
        <div class="module-actions">
          <button mat-stroked-button type="button" (click)="loadOrdenes()">
            <mat-icon>refresh</mat-icon>
            Actualizar
          </button>
        </div>
      </div>

      @if (can(['ADMIN','GERENTE'])) {
        <app-orden-form (saved)="ordenCreada()" />
      }

      @if (loading) {
        <mat-progress-bar mode="indeterminate" />
      }

      <div class="data-panel">
        <div class="panel-head">
          <div class="panel-title">
            <h2>Ordenes registradas</h2>
            <p>{{ totalOrdenes() }} ordenes encontradas</p>
          </div>
          <span class="count-pill">{{ ordenes.length }}</span>
        </div>
        @if (ordenes.length) {
          <div class="table-wrap">
            <table mat-table [dataSource]="ordenes">
              <ng-container matColumnDef="id"><th mat-header-cell *matHeaderCellDef>#</th><td mat-cell *matCellDef="let o">{{ o.id }}</td></ng-container>
              <ng-container matColumnDef="fechaCreacion"><th mat-header-cell *matHeaderCellDef>Fecha</th><td mat-cell *matCellDef="let o">{{ o.fechaCreacion | date:'short' }}</td></ng-container>
              <ng-container matColumnDef="proveedor"><th mat-header-cell *matHeaderCellDef>Proveedor</th><td mat-cell *matCellDef="let o">{{ o.proveedor.nombre }}</td></ng-container>
              <ng-container matColumnDef="estado"><th mat-header-cell *matHeaderCellDef>Estado</th><td mat-cell *matCellDef="let o"><mat-chip [class]="estadoColor(o.estado)">{{ o.estado }}</mat-chip></td></ng-container>
              <ng-container matColumnDef="total"><th mat-header-cell *matHeaderCellDef>Total</th><td mat-cell *matCellDef="let o">{{ o.total | currency:'COP' }}</td></ng-container>
              <ng-container matColumnDef="acciones">
                <th mat-header-cell *matHeaderCellDef>Acciones</th>
                <td mat-cell *matCellDef="let o" class="actions">
                  @if (can(['ADMIN','GERENTE']) && o.estado === 'BORRADOR') {
                    <button mat-icon-button title="Enviar" (click)="enviar(o)"><mat-icon>outgoing_mail</mat-icon></button>
                  }
                  @if (can(['ADMIN','GERENTE']) && (o.estado === 'BORRADOR' || o.estado === 'ENVIADA')) {
                    <button mat-icon-button title="Cancelar" (click)="cancelar(o)"><mat-icon>cancel</mat-icon></button>
                  }
                  @if (can(['ADMIN','ALMACENISTA']) && (o.estado === 'ENVIADA' || o.estado === 'RECIBIDA_PARCIAL')) {
                    <button mat-icon-button title="Recibir" (click)="recibir(o)"><mat-icon>fact_check</mat-icon></button>
                  }
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="ordenCols"></tr>
              <tr mat-row *matRowDef="let row; columns: ordenCols;"></tr>
            </table>
            <mat-paginator [length]="ordenesPage?.totalElements ?? 0" [pageIndex]="pageIndex" [pageSize]="pageSize" [pageSizeOptions]="[10,20,50]" (page)="onPage($event)" />
          </div>
        } @else {
          <div class="empty-state">
            <mat-icon>receipt_long</mat-icon>
            <h3>No hay ordenes registradas</h3>
            <p>Crea una orden de compra para iniciar el flujo.</p>
          </div>
        }
      </div>
    </section>
  `
})
export class OrdenesComponent implements OnInit {
  loading = false;
  ordenes: OrdenCompra[] = [];
  ordenesPage?: Page<OrdenCompra>;
  pageIndex = 0;
  pageSize = 20;
  ordenCols = ['id', 'fechaCreacion', 'proveedor', 'estado', 'total', 'acciones'];

  constructor(private api: ApiService, private auth: AuthService, private dialog: MatDialog, private snack: MatSnackBar) {}

  ngOnInit() {
    this.loadOrdenes();
  }

  can(roles: Rol[]) {
    return this.auth.hasRole(roles);
  }

  loadOrdenes(page = this.pageIndex, size = this.pageSize) {
    this.pageIndex = page;
    this.pageSize = size;
    this.loading = true;
    this.api.ordenes({ page, size }).subscribe({
      next: ordenesPage => {
        this.ordenesPage = ordenesPage;
        this.ordenes = ordenesPage.content;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  onPage(event: PageEvent) {
    this.loadOrdenes(event.pageIndex, event.pageSize);
  }

  totalOrdenes() {
    return this.ordenesPage?.totalElements ?? this.ordenes.length;
  }

  ordenCreada() {
    this.loadOrdenes();
    this.api.dashboard().subscribe();
  }

  enviar(orden: OrdenCompra) {
    this.api.enviarOrden(orden.id).subscribe(() => {
      this.snack.open('Orden enviada', 'Cerrar', { duration: 2500 });
      this.loadOrdenes();
      this.api.dashboard().subscribe();
    });
  }

  recibir(orden: OrdenCompra) {
    const ref = this.dialog.open(RecepcionDialogComponent, { width: '820px', data: { orden } });
    ref.afterClosed().subscribe((items?: RecepcionItem[]) => {
      if (!items?.length) return;
      const confirmRef = this.dialog.open(ConfirmDialogComponent, { width: '420px', data: { mensaje: 'Confirmar recepcion de mercancia?' } });
      confirmRef.afterClosed().subscribe((ok?: boolean) => {
        if (!ok) return;
        this.api.recibirOrden(orden.id, items).subscribe(() => {
          this.snack.open('Recepcion registrada', 'Cerrar', { duration: 2500 });
          this.loadOrdenes();
          this.api.dashboard().subscribe();
        });
      });
    });
  }

  cancelar(orden: OrdenCompra) {
    const ref = this.dialog.open(ConfirmDialogComponent, { width: '420px', data: { mensaje: `Cancelar la orden #${orden.id}?` } });
    ref.afterClosed().subscribe((ok?: boolean) => {
      if (!ok) return;
      this.api.cancelarOrden(orden.id).subscribe(() => {
        this.snack.open('Orden cancelada', 'Cerrar', { duration: 2500 });
        this.loadOrdenes();
        this.api.dashboard().subscribe();
      });
    });
  }

  estadoColor(estado: EstadoOrden): string {
    const map: Record<EstadoOrden, string> = {
      BORRADOR: '',
      ENVIADA: 'primary',
      RECIBIDA_PARCIAL: 'accent',
      RECIBIDA: 'success',
      CANCELADA: 'warn'
    };
    return map[estado] ?? '';
  }
}
