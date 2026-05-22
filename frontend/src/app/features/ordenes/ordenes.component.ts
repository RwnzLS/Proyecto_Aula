import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { EstadoOrden, OrdenCompra, Page, Rol } from '../../core/models';
import { ConfirmService } from '../../shared/confirm.service';
import { NotifyService } from '../../shared/notify.service';
import { EmptyStateComponent } from '../../shared/empty-state.component';
import { PageHeaderComponent } from '../../shared/page-header.component';
import { OrdenFormComponent } from './orden-form.component';
import { RecepcionDialogComponent, RecepcionItem } from './recepcion-dialog.component';

interface EstadoMeta {
  label: string;
  icon: string;
  chipClass: string;
}

interface TimelineStep {
  estado: EstadoOrden;
  label: string;
  icon: string;
  status: 'done' | 'current' | 'pending' | 'cancelled';
}

const ESTADO_META: Record<EstadoOrden, EstadoMeta> = {
  BORRADOR: { label: 'Borrador', icon: 'edit_note', chipClass: 'chip-state chip-state--draft' },
  ENVIADA: { label: 'Enviada', icon: 'outgoing_mail', chipClass: 'chip-state chip-state--sent' },
  RECIBIDA_PARCIAL: { label: 'Recibida parcial', icon: 'incomplete_circle', chipClass: 'chip-state chip-state--partial' },
  RECIBIDA: { label: 'Recibida', icon: 'check_circle', chipClass: 'chip-state chip-state--done' },
  CANCELADA: { label: 'Cancelada', icon: 'cancel', chipClass: 'chip-state chip-state--cancelled' }
};

const FLOW: EstadoOrden[] = ['BORRADOR', 'ENVIADA', 'RECIBIDA_PARCIAL', 'RECIBIDA'];

@Component({
  selector: 'app-ordenes',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    DatePipe,
    MatButtonModule,
    MatChipsModule,
    MatDialogModule,
    MatIconModule,
    MatMenuModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatTableModule,
    MatTooltipModule,
    EmptyStateComponent,
    PageHeaderComponent,
    OrdenFormComponent
  ],
  animations: [
    trigger('expandRow', [
      state('collapsed,void', style({ height: '0px', minHeight: '0', opacity: 0 })),
      state('expanded', style({ height: '*', opacity: 1 })),
      transition('expanded <=> collapsed', animate('200ms cubic-bezier(0.4, 0, 0.2, 1)')),
      transition('expanded <=> void', animate('200ms cubic-bezier(0.4, 0, 0.2, 1)'))
    ])
  ],
  template: `
    <section class="module-page">
      <app-page-header eyebrow="Compras" title="Ordenes" subtitle="Crea, envia, recibe y cancela ordenes segun su estado operativo.">
        <button actions mat-stroked-button type="button" (click)="loadOrdenes()">
          <mat-icon>refresh</mat-icon>
          Actualizar
        </button>
      </app-page-header>

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
            <table mat-table [dataSource]="ordenes" multiTemplateDataRows>
              <ng-container matColumnDef="expand">
                <th mat-header-cell *matHeaderCellDef class="cell-expand"></th>
                <td mat-cell *matCellDef="let o" class="cell-expand">
                  <button mat-icon-button type="button" (click)="toggleExpand(o); $event.stopPropagation()" [attr.aria-label]="expandedId() === o.id ? 'Cerrar detalle' : 'Abrir detalle'">
                    <mat-icon class="expand-icon" [class.expand-icon--open]="expandedId() === o.id">expand_more</mat-icon>
                  </button>
                </td>
              </ng-container>
              <ng-container matColumnDef="id">
                <th mat-header-cell *matHeaderCellDef>#</th>
                <td mat-cell *matCellDef="let o">{{ o.id }}</td>
              </ng-container>
              <ng-container matColumnDef="fechaCreacion">
                <th mat-header-cell *matHeaderCellDef>Fecha</th>
                <td mat-cell *matCellDef="let o">{{ o.fechaCreacion | date:'short' }}</td>
              </ng-container>
              <ng-container matColumnDef="proveedor">
                <th mat-header-cell *matHeaderCellDef>Proveedor</th>
                <td mat-cell *matCellDef="let o">{{ o.proveedor.nombre }}</td>
              </ng-container>
              <ng-container matColumnDef="estado">
                <th mat-header-cell *matHeaderCellDef>Estado</th>
                <td mat-cell *matCellDef="let o">
                  <mat-chip [class]="metaFor(o.estado).chipClass" disableRipple>
                    <mat-icon class="chip-icon">{{ metaFor(o.estado).icon }}</mat-icon>
                    {{ metaFor(o.estado).label }}
                  </mat-chip>
                </td>
              </ng-container>
              <ng-container matColumnDef="total">
                <th mat-header-cell *matHeaderCellDef>Total</th>
                <td mat-cell *matCellDef="let o">{{ o.total | currency:'COP' }}</td>
              </ng-container>
              <ng-container matColumnDef="acciones">
                <th mat-header-cell *matHeaderCellDef class="cell-end">Acciones</th>
                <td mat-cell *matCellDef="let o" class="cell-end">
                  @if (hasActions(o)) {
                    <button mat-icon-button [matMenuTriggerFor]="menu" (click)="$event.stopPropagation()" aria-label="Acciones de la orden">
                      <mat-icon>more_vert</mat-icon>
                    </button>
                    <mat-menu #menu="matMenu">
                      @if (can(['ADMIN','GERENTE']) && o.estado === 'BORRADOR') {
                        <button mat-menu-item (click)="enviar(o)">
                          <mat-icon>outgoing_mail</mat-icon>
                          <span>Enviar</span>
                        </button>
                      }
                      @if (can(['ADMIN','ALMACENISTA']) && (o.estado === 'ENVIADA' || o.estado === 'RECIBIDA_PARCIAL')) {
                        <button mat-menu-item (click)="recibir(o)">
                          <mat-icon>fact_check</mat-icon>
                          <span>Recibir</span>
                        </button>
                      }
                      @if (can(['ADMIN','GERENTE']) && (o.estado === 'BORRADOR' || o.estado === 'ENVIADA')) {
                        <button mat-menu-item (click)="cancelar(o)" class="menu-danger">
                          <mat-icon>cancel</mat-icon>
                          <span>Cancelar</span>
                        </button>
                      }
                    </mat-menu>
                  }
                </td>
              </ng-container>
              <ng-container matColumnDef="detalle">
                <td mat-cell *matCellDef="let o" [attr.colspan]="ordenCols.length">
                  <div class="detalle-row" [@expandRow]="expandedId() === o.id ? 'expanded' : 'collapsed'">
                    @if (expandedId() === o.id) {
                      <div class="detalle-content">
                        <div class="timeline" role="list" aria-label="Estados de la orden">
                          @for (step of timelineFor(o); track step.estado) {
                            <div class="timeline-step" [class]="'timeline-step--' + step.status" role="listitem">
                              <span class="timeline-dot">
                                <mat-icon>{{ step.icon }}</mat-icon>
                              </span>
                              <span class="timeline-label">{{ step.label }}</span>
                            </div>
                          }
                        </div>
                        <div class="detalle-grid">
                          <div class="detalle-meta">
                            <div><span class="u-text-muted">Esperada</span><strong>{{ o.fechaEsperada ? (o.fechaEsperada | date:'mediumDate') : '—' }}</strong></div>
                            <div><span class="u-text-muted">Solicitada por</span><strong>{{ o.usuario?.nombre || '—' }}</strong></div>
                            @if (o.observaciones) {
                              <div class="detalle-obs"><span class="u-text-muted">Observaciones</span><strong>{{ o.observaciones }}</strong></div>
                            }
                          </div>
                          <div class="detalle-tabla">
                            <table class="lineas" aria-label="Detalle de productos">
                              <thead>
                                <tr><th>Producto</th><th class="num">Solicitada</th><th class="num">Recibida</th><th class="num">Precio</th><th class="num">Subtotal rec.</th></tr>
                              </thead>
                              <tbody>
                                @for (linea of o.detalles; track linea.id) {
                                  <tr>
                                    <td>{{ linea.producto.nombre }}</td>
                                    <td class="num">{{ linea.cantidadSolicitada }}</td>
                                    <td class="num">{{ linea.cantidadRecibida }}</td>
                                    <td class="num">{{ linea.precioUnitario | currency:'COP' }}</td>
                                    <td class="num">{{ ((linea.cantidadRecibida > 0 ? linea.cantidadRecibida : linea.cantidadSolicitada) * linea.precioUnitario) | currency:'COP' }}</td>
                                  </tr>
                                }
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    }
                  </div>
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="ordenCols"></tr>
              <tr mat-row *matRowDef="let row; columns: ordenCols;" class="orden-row" [class.orden-row--expanded]="expandedId() === row.id" (click)="toggleExpand(row)"></tr>
              <tr mat-row *matRowDef="let row; columns: ['detalle']" class="detalle-tr"></tr>
            </table>
            <mat-paginator [length]="ordenesPage?.totalElements ?? 0" [pageIndex]="pageIndex" [pageSize]="pageSize" [pageSizeOptions]="[10,20,50]" (page)="onPage($event)" />
          </div>
        } @else {
          <app-empty-state icon="receipt_long" title="No hay ordenes registradas" message="Crea una orden de compra para iniciar el flujo." />
        }
      </div>
    </section>
  `,
  styles: [`
    .cell-expand { width: 48px; }
    .expand-icon { transition: transform var(--app-dur-fast) var(--app-ease-out); }
    .expand-icon--open { transform: rotate(180deg); }

    .orden-row { cursor: pointer; }
    .orden-row--expanded { background: var(--app-surface-soft); }
    .detalle-tr { height: 0; }
    .detalle-tr td { padding: 0 !important; border-bottom: none !important; }

    .detalle-row { overflow: hidden; background: var(--app-surface-soft); }
    .detalle-content {
      display: grid;
      gap: var(--app-space-5);
      padding: var(--app-space-5);
      border-top: 1px solid var(--app-border);
    }

    .timeline {
      display: flex;
      flex-wrap: wrap;
      gap: var(--app-space-2);
      align-items: center;
    }
    .timeline-step {
      display: flex;
      align-items: center;
      gap: var(--app-space-2);
      padding: 6px var(--app-space-3);
      border-radius: 999px;
      background: var(--app-surface);
      border: 1px solid var(--app-border);
      color: var(--app-muted);
      font-size: var(--app-font-13);
    }
    .timeline-step:not(:last-child)::after {
      content: '';
      width: 22px;
      height: 2px;
      background: var(--app-border);
      margin-left: var(--app-space-2);
    }
    .timeline-dot {
      width: 22px;
      height: 22px;
      display: grid;
      place-items: center;
      border-radius: 50%;
      background: var(--app-surface-muted);
      color: var(--app-muted);
    }
    .timeline-dot mat-icon { font-size: 14px; width: 14px; height: 14px; }

    .timeline-step--done { color: var(--app-success); border-color: color-mix(in srgb, var(--app-success) 35%, transparent); }
    .timeline-step--done .timeline-dot { background: var(--app-success); color: white; }
    .timeline-step--current { color: var(--app-brand-strong); border-color: var(--app-brand); background: color-mix(in srgb, var(--app-brand) 8%, var(--app-surface)); }
    .timeline-step--current .timeline-dot { background: var(--app-brand); color: white; }
    .timeline-step--cancelled { color: var(--app-danger); border-color: color-mix(in srgb, var(--app-danger) 35%, transparent); }
    .timeline-step--cancelled .timeline-dot { background: var(--app-danger); color: white; }

    .detalle-grid {
      display: grid;
      grid-template-columns: minmax(220px, 1fr) 2fr;
      gap: var(--app-space-5);
    }
    .detalle-meta {
      display: grid;
      gap: var(--app-space-3);
      align-content: start;
    }
    .detalle-meta > div {
      display: grid;
      gap: 2px;
    }
    .detalle-meta strong { color: var(--app-heading); }

    .lineas {
      width: 100%;
      border-collapse: collapse;
      background: var(--app-surface);
      border-radius: var(--app-radius-2);
      overflow: hidden;
      border: 1px solid var(--app-border);
    }
    .lineas th, .lineas td {
      padding: var(--app-space-2) var(--app-space-3);
      text-align: left;
      border-bottom: 1px solid var(--app-border);
    }
    .lineas th { color: var(--app-muted); background: var(--app-surface-soft); font-weight: var(--app-weight-semibold); }
    .lineas tr:last-child td { border-bottom: none; }
    .lineas td.num, .lineas th.num { text-align: right; font-variant-numeric: tabular-nums; }

    .chip-state {
      gap: 6px;
      font-weight: var(--app-weight-semibold);
      font-size: var(--app-font-12);
    }
    .chip-state .chip-icon { font-size: 16px; width: 16px; height: 16px; margin-right: 0; }
    .chip-state--draft   { --mdc-chip-elevated-container-color: var(--app-surface-muted); color: var(--app-muted-strong); }
    .chip-state--sent    { --mdc-chip-elevated-container-color: var(--app-accent); color: white; }
    .chip-state--partial { --mdc-chip-elevated-container-color: var(--app-warning); color: white; }
    .chip-state--done    { --mdc-chip-elevated-container-color: var(--app-success); color: white; }
    .chip-state--cancelled { --mdc-chip-elevated-container-color: var(--app-danger); color: white; }

    .menu-danger { color: var(--app-danger); }
    .menu-danger mat-icon { color: var(--app-danger); }

    @media (max-width: 760px) {
      .detalle-grid { grid-template-columns: 1fr; }
      .timeline-step:not(:last-child)::after { display: none; }
    }
  `]
})
export class OrdenesComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private readonly confirmService = inject(ConfirmService);
  private readonly notify = inject(NotifyService);

  loading = false;
  ordenes: OrdenCompra[] = [];
  ordenesPage?: Page<OrdenCompra>;
  pageIndex = 0;
  pageSize = 20;
  ordenCols = ['expand', 'id', 'fechaCreacion', 'proveedor', 'estado', 'total', 'acciones'];
  readonly expandedId = signal<number | null>(null);

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
    this.api.ordenes({ page, size }).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
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
  }

  toggleExpand(orden: OrdenCompra) {
    this.expandedId.update(current => current === orden.id ? null : orden.id);
  }

  metaFor(estado: EstadoOrden): EstadoMeta {
    return ESTADO_META[estado];
  }

  hasActions(orden: OrdenCompra): boolean {
    const isAdminOrGerente = this.can(['ADMIN', 'GERENTE']);
    const isAdminOrAlmacenista = this.can(['ADMIN', 'ALMACENISTA']);
    if (isAdminOrGerente && orden.estado === 'BORRADOR') return true;
    if (isAdminOrAlmacenista && (orden.estado === 'ENVIADA' || orden.estado === 'RECIBIDA_PARCIAL')) return true;
    if (isAdminOrGerente && (orden.estado === 'BORRADOR' || orden.estado === 'ENVIADA')) return true;
    return false;
  }

  timelineFor(orden: OrdenCompra): TimelineStep[] {
    const cancelled = orden.estado === 'CANCELADA';
    const currentIndex = cancelled ? -1 : FLOW.indexOf(orden.estado);
    return FLOW.map((estado, index) => {
      const meta = ESTADO_META[estado];
      let status: TimelineStep['status'];
      if (cancelled) {
        status = index === 0 ? 'cancelled' : 'pending';
      } else if (index < currentIndex) {
        status = 'done';
      } else if (index === currentIndex) {
        status = 'current';
      } else {
        status = 'pending';
      }
      return { estado, label: meta.label, icon: meta.icon, status };
    });
  }

  enviar(orden: OrdenCompra) {
    this.api.enviarOrden(orden.id).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.notify.success(`Orden #${orden.id} enviada`);
        this.loadOrdenes();
      },
      error: () => this.loadOrdenes()
    });
  }

  recibir(orden: OrdenCompra) {
    const ref = this.dialog.open(RecepcionDialogComponent, { width: '820px', data: { orden } });
    ref.afterClosed().subscribe(async (items?: RecepcionItem[]) => {
      if (!items?.length) return;
      const ok = await this.confirmService.confirm({
        title: 'Confirmar recepcion',
        message: 'Se actualizara el stock con las cantidades indicadas. Continuar?',
        confirmLabel: 'Recibir'
      });
      if (!ok) return;
      this.api.recibirOrden(orden.id, items).pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe({
        next: () => {
          this.notify.success('Recepcion registrada');
          this.loadOrdenes();
        },
        error: () => this.loadOrdenes()
      });
    });
  }

  async cancelar(orden: OrdenCompra) {
    const ok = await this.confirmService.confirm({
      title: 'Cancelar orden',
      message: `Esta accion cancelara la orden #${orden.id}. Continuar?`,
      confirmLabel: 'Cancelar orden',
      cancelLabel: 'Volver',
      variant: 'danger'
    });
    if (!ok) return;
    this.api.cancelarOrden(orden.id).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.notify.warning(`Orden #${orden.id} cancelada`);
        this.loadOrdenes();
      },
      error: () => this.loadOrdenes()
    });
  }
}
