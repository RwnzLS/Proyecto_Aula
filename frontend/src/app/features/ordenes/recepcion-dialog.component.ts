import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { OrdenCompra } from '../../core/models';

export interface RecepcionItem {
  detalleId: number;
  cantidadRecibida: number;
}

@Component({
  selector: 'app-recepcion-dialog',
  standalone: true,
  imports: [MatButtonModule, MatDialogModule, MatIconModule, MatInputModule, MatTableModule],
  template: `
    <h2 mat-dialog-title>Recepcion de orden {{ data.orden.id }}</h2>
    <mat-dialog-content>
      <div class="table-wrap">
        <table mat-table [dataSource]="data.orden.detalles">
          <ng-container matColumnDef="producto"><th mat-header-cell *matHeaderCellDef>Producto</th><td mat-cell *matCellDef="let d">{{ d.producto.nombre }}</td></ng-container>
          <ng-container matColumnDef="solicitada"><th mat-header-cell *matHeaderCellDef>Solicitada</th><td mat-cell *matCellDef="let d">{{ d.cantidadSolicitada }}</td></ng-container>
          <ng-container matColumnDef="recibida"><th mat-header-cell *matHeaderCellDef>Recibida</th><td mat-cell *matCellDef="let d">{{ d.cantidadRecibida }}</td></ng-container>
          <ng-container matColumnDef="nueva"><th mat-header-cell *matHeaderCellDef>Nueva</th><td mat-cell *matCellDef="let d"><input matInput type="number" min="0" [max]="pendiente(d)" [value]="cantidad(d.id)" (input)="setCantidad(d, $event)"></td></ng-container>
          <tr mat-header-row *matHeaderRowDef="cols"></tr>
          <tr mat-row *matRowDef="let row; columns: cols;"></tr>
        </table>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-raised-button color="primary" (click)="confirmar()">
        <mat-icon>check_circle</mat-icon>
        Continuar
      </button>
    </mat-dialog-actions>
  `
})
export class RecepcionDialogComponent {
  cols = ['producto', 'solicitada', 'recibida', 'nueva'];
  private cantidades: Record<number, number> = {};

  constructor(
    private dialogRef: MatDialogRef<RecepcionDialogComponent, RecepcionItem[]>,
    @Inject(MAT_DIALOG_DATA) public data: { orden: OrdenCompra }
  ) {}

  cantidad(id: number) {
    return this.cantidades[id] ?? 0;
  }

  pendiente(detalle: OrdenCompra['detalles'][number]) {
    return Math.max(0, detalle.cantidadSolicitada - detalle.cantidadRecibida);
  }

  setCantidad(detalle: OrdenCompra['detalles'][number], event: Event) {
    const value = Number((event.target as HTMLInputElement).value);
    this.cantidades[detalle.id] = Math.min(Math.max(0, value || 0), this.pendiente(detalle));
  }

  confirmar() {
    const items = this.data.orden.detalles
      .map(detalle => ({ detalleId: detalle.id, cantidadRecibida: this.cantidad(detalle.id) }))
      .filter(item => item.cantidadRecibida > 0);
    this.dialogRef.close(items);
  }
}
