import { Component, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { OrdenCompra } from '../../core/models';

export interface RecepcionItem {
  detalleId: number;
  cantidadRecibida: number;
}

type Detalle = OrdenCompra['detalles'][number];

@Component({
  selector: 'app-recepcion-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule
  ],
  template: `
    <h2 mat-dialog-title>Recepcion de orden #{{ data.orden.id }}</h2>
    <mat-dialog-content class="recepcion-content">
      <p class="recepcion-help u-text-muted">
        Indica cuanta cantidad llegaste a recibir por cada linea. No puede superar la cantidad pendiente.
      </p>

      <div class="recepcion-lista" role="list">
        @for (detalle of data.orden.detalles; track detalle.id) {
          <article class="recepcion-linea" role="listitem">
            <header class="recepcion-linea__head">
              <div class="recepcion-linea__title">
                <strong>{{ detalle.producto.nombre }}</strong>
                <span class="u-text-muted">{{ detalle.producto.codigo }}</span>
              </div>
              <span class="recepcion-linea__badge" [class]="badgeClass(detalle)">
                <mat-icon>{{ badgeIcon(detalle) }}</mat-icon>
                {{ badgeLabel(detalle) }}
              </span>
            </header>

            <div class="recepcion-linea__progress">
              <mat-progress-bar mode="determinate" [value]="progresoActual(detalle)" [color]="progresoActual(detalle) >= 100 ? 'primary' : 'accent'"></mat-progress-bar>
              <div class="recepcion-linea__meta">
                <span><strong>{{ recibidoEfectivo(detalle) }}</strong> / {{ detalle.cantidadSolicitada }} recibidas</span>
                <span class="u-text-muted">Pendiente: {{ pendienteRestante(detalle) }}</span>
              </div>
            </div>

            <div class="recepcion-linea__input">
              <label [attr.for]="'cant-' + detalle.id">Recibir ahora</label>
              <input
                [id]="'cant-' + detalle.id"
                matInput
                type="number"
                min="0"
                [max]="pendiente(detalle)"
                [value]="cantidad(detalle.id)"
                (input)="setCantidad(detalle, $event)"
                [disabled]="pendiente(detalle) === 0">
              <span class="u-text-muted">/ {{ pendiente(detalle) }}</span>
              <button mat-stroked-button type="button" [disabled]="pendiente(detalle) === 0" (click)="recibirTodo(detalle)">
                Recibir todo
              </button>
            </div>

            @if (errorRow().has(detalle.id)) {
              <p class="recepcion-linea__error" role="alert">
                <mat-icon>error_outline</mat-icon>
                Cantidad excede el pendiente.
              </p>
            }
          </article>
        }
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-raised-button color="primary" [disabled]="!hayCantidades() || errorRow().size > 0" (click)="confirmar()">
        <mat-icon>check_circle</mat-icon>
        Continuar
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .recepcion-content { display: grid; gap: var(--app-space-4); }
    .recepcion-help { margin: 0; }
    .recepcion-lista { display: grid; gap: var(--app-space-3); }
    .recepcion-linea {
      display: grid;
      gap: var(--app-space-2);
      padding: var(--app-space-4);
      border: 1px solid var(--app-border);
      border-radius: var(--app-radius-2);
      background: var(--app-surface);
    }
    .recepcion-linea__head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--app-space-3);
      flex-wrap: wrap;
    }
    .recepcion-linea__title { display: grid; gap: 2px; }
    .recepcion-linea__title strong { color: var(--app-heading); }
    .recepcion-linea__badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px var(--app-space-2);
      border-radius: 999px;
      font-size: var(--app-font-12);
      font-weight: var(--app-weight-semibold);
    }
    .recepcion-linea__badge mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .badge--pending  { background: var(--app-surface-muted); color: var(--app-muted-strong); }
    .badge--partial  { background: color-mix(in srgb, var(--app-warning) 18%, var(--app-surface)); color: var(--app-warning); }
    .badge--complete { background: color-mix(in srgb, var(--app-success) 18%, var(--app-surface)); color: var(--app-success); }

    .recepcion-linea__progress { display: grid; gap: 4px; }
    .recepcion-linea__progress mat-progress-bar { height: 8px; border-radius: 999px; }
    .recepcion-linea__meta {
      display: flex;
      justify-content: space-between;
      font-size: var(--app-font-13);
      font-variant-numeric: tabular-nums;
    }

    .recepcion-linea__input {
      display: flex;
      align-items: center;
      gap: var(--app-space-3);
      flex-wrap: wrap;
    }
    .recepcion-linea__input label { font-weight: var(--app-weight-semibold); }
    .recepcion-linea__input input {
      width: 100px;
      padding: 6px var(--app-space-2);
      border-radius: var(--app-radius-2);
      border: 1px solid var(--app-border-strong);
      background: var(--app-surface-soft);
      font-variant-numeric: tabular-nums;
    }
    .recepcion-linea__input input:disabled { opacity: 0.55; }

    .recepcion-linea__error {
      margin: 0;
      display: flex;
      align-items: center;
      gap: 4px;
      color: var(--app-danger);
      font-size: var(--app-font-13);
    }
    .recepcion-linea__error mat-icon { font-size: 16px; width: 16px; height: 16px; }
  `]
})
export class RecepcionDialogComponent {
  private readonly cantidades = signal<Record<number, number>>({});
  readonly errorRow = signal<Set<number>>(new Set());

  constructor(
    private dialogRef: MatDialogRef<RecepcionDialogComponent, RecepcionItem[]>,
    @Inject(MAT_DIALOG_DATA) public data: { orden: OrdenCompra }
  ) {}

  cantidad(id: number) {
    return this.cantidades()[id] ?? 0;
  }

  pendiente(detalle: Detalle) {
    return Math.max(0, detalle.cantidadSolicitada - detalle.cantidadRecibida);
  }

  recibidoEfectivo(detalle: Detalle) {
    return detalle.cantidadRecibida + this.cantidad(detalle.id);
  }

  pendienteRestante(detalle: Detalle) {
    return Math.max(0, this.pendiente(detalle) - this.cantidad(detalle.id));
  }

  progresoActual(detalle: Detalle) {
    if (!detalle.cantidadSolicitada) return 0;
    return Math.min(100, (this.recibidoEfectivo(detalle) / detalle.cantidadSolicitada) * 100);
  }

  badgeClass(detalle: Detalle) {
    if (this.recibidoEfectivo(detalle) >= detalle.cantidadSolicitada) return 'badge--complete';
    if (this.recibidoEfectivo(detalle) > 0) return 'badge--partial';
    return 'badge--pending';
  }

  badgeIcon(detalle: Detalle) {
    if (this.recibidoEfectivo(detalle) >= detalle.cantidadSolicitada) return 'check_circle';
    if (this.recibidoEfectivo(detalle) > 0) return 'incomplete_circle';
    return 'hourglass_empty';
  }

  badgeLabel(detalle: Detalle) {
    if (this.recibidoEfectivo(detalle) >= detalle.cantidadSolicitada) return 'Completa';
    if (this.recibidoEfectivo(detalle) > 0) return 'Parcial';
    return 'Pendiente';
  }

  setCantidad(detalle: Detalle, event: Event) {
    const raw = this.parseCantidad((event.target as HTMLInputElement).value);
    const max = this.pendiente(detalle);
    const safe = Math.min(Math.max(0, raw), max);
    this.cantidades.update(map => ({ ...map, [detalle.id]: safe }));
    this.errorRow.update(set => {
      const next = new Set(set);
      if (raw > max) next.add(detalle.id); else next.delete(detalle.id);
      return next;
    });
  }

  recibirTodo(detalle: Detalle) {
    const max = this.pendiente(detalle);
    this.cantidades.update(map => ({ ...map, [detalle.id]: max }));
    this.errorRow.update(set => {
      const next = new Set(set);
      next.delete(detalle.id);
      return next;
    });
  }

  hayCantidades(): boolean {
    return this.itemsRecepcion().length > 0;
  }

  confirmar() {
    if (!this.hayCantidades() || this.errorRow().size > 0) return;
    const items = this.itemsRecepcion();
    this.dialogRef.close(items);
  }

  private itemsRecepcion(): RecepcionItem[] {
    return this.data.orden.detalles
      .map(detalle => ({
        detalleId: detalle.id,
        cantidadRecibida: Math.min(this.cantidad(detalle.id), this.pendiente(detalle))
      }))
      .filter(item => item.cantidadRecibida > 0);
  }

  private parseCantidad(value: string) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return 0;
    return Math.trunc(parsed);
  }
}
