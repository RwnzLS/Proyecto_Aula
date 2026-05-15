import { CommonModule } from '@angular/common';
import {
  Component,
  ContentChildren,
  Directive,
  EventEmitter,
  Input,
  Output,
  QueryList,
  TemplateRef,
  computed,
  signal
} from '@angular/core';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { EmptyStateComponent } from './empty-state.component';
import { SkeletonTableComponent } from './skeleton-table.component';

export interface TableColumn<T = any> {
  key: string;
  header: string;
  sortable?: boolean;
  align?: 'start' | 'end' | 'center';
  value?: (row: T) => unknown;
  cssClass?: string;
}

export interface EmptyStateConfig {
  icon?: string;
  title: string;
  message?: string;
}

@Directive({
  selector: '[appCellDef]',
  standalone: true
})
export class CellDefDirective {
  @Input('appCellDef') key!: string;
  constructor(public readonly template: TemplateRef<{ $implicit: any }>) {}
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [
    CommonModule,
    MatPaginatorModule,
    MatSortModule,
    MatTableModule,
    SkeletonTableComponent,
    EmptyStateComponent
  ],
  template: `
    <ng-container *ngIf="loading && !rowsSignal().length; else loaded">
      <app-skeleton-table [rows]="pageSize" [columns]="columns.length || 4"></app-skeleton-table>
    </ng-container>
    <ng-template #loaded>
      <ng-container *ngIf="rowsSignal().length; else empty">
        <div class="table-wrap">
          <table
            mat-table
            matSort
            [dataSource]="displayRows()"
            (matSortChange)="onSortChange($event)">
            <ng-container *ngFor="let col of columns; trackBy: trackByKey" [matColumnDef]="col.key">
              <th
                mat-header-cell
                *matHeaderCellDef
                [mat-sort-header]="col.sortable ? col.key : ''"
                [disabled]="!col.sortable"
                [class.cell-end]="col.align === 'end'"
                [class.cell-center]="col.align === 'center'"
                [ngClass]="col.cssClass">
                {{ col.header }}
              </th>
              <td
                mat-cell
                *matCellDef="let row"
                [class.cell-end]="col.align === 'end'"
                [class.cell-center]="col.align === 'center'"
                [ngClass]="col.cssClass">
                <ng-container
                  *ngIf="templateFor(col.key) as tpl; else defaultCell">
                  <ng-container *ngTemplateOutlet="tpl; context: { $implicit: row }"></ng-container>
                </ng-container>
                <ng-template #defaultCell>{{ resolveValue(col, row) }}</ng-template>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="columnKeys"></tr>
            <tr mat-row *matRowDef="let row; columns: columnKeys"></tr>
          </table>
          <mat-paginator
            *ngIf="paginator"
            [length]="length"
            [pageIndex]="pageIndex"
            [pageSize]="pageSize"
            [pageSizeOptions]="pageSizeOptions"
            (page)="page.emit($event)">
          </mat-paginator>
        </div>
      </ng-container>
      <ng-template #empty>
        <app-empty-state
          [icon]="emptyState?.icon ?? 'inbox'"
          [title]="emptyState?.title ?? 'Sin resultados'"
          [message]="emptyState?.message">
        </app-empty-state>
      </ng-template>
    </ng-template>
  `,
  styles: [`
    :host { display: block; }
    .table-wrap { overflow: auto; }
    .cell-end { text-align: right; }
    .cell-center { text-align: center; }
    td.cell-end .actions, td.cell-end > * { justify-content: flex-end; }
  `]
})
export class DataTableComponent<T = any> {
  @Input() columns: TableColumn<T>[] = [];
  @Input() loading = false;
  @Input() paginator = true;
  @Input() pageIndex = 0;
  @Input() pageSize = 20;
  @Input() length = 0;
  @Input() pageSizeOptions: number[] = [10, 20, 50];
  @Input() emptyState?: EmptyStateConfig;

  @Output() page = new EventEmitter<PageEvent>();
  @Output() sortChange = new EventEmitter<Sort>();

  @ContentChildren(CellDefDirective) cellDefs?: QueryList<CellDefDirective>;

  readonly rowsSignal = signal<T[]>([]);
  private readonly sortSignal = signal<Sort | null>(null);

  readonly displayRows = computed<T[]>(() => {
    const rows = this.rowsSignal();
    const sort = this.sortSignal();
    if (!sort || !sort.active || sort.direction === '') return rows;
    const column = this.columns.find(col => col.key === sort.active);
    if (!column) return rows;
    const factor = sort.direction === 'asc' ? 1 : -1;
    const accessor = column.value ?? ((row: any) => row?.[sort.active]);
    return [...rows].sort((a, b) => {
      const va = accessor(a) as any;
      const vb = accessor(b) as any;
      if (va == null && vb == null) return 0;
      if (va == null) return -1 * factor;
      if (vb == null) return 1 * factor;
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * factor;
      return String(va).localeCompare(String(vb), 'es', { numeric: true }) * factor;
    });
  });

  @Input() set rows(value: readonly T[] | null | undefined) {
    this.rowsSignal.set(value ? [...value] : []);
  }

  get columnKeys(): string[] {
    return this.columns.map(col => col.key);
  }

  trackByKey = (_: number, col: TableColumn<T>) => col.key;

  templateFor(key: string): TemplateRef<{ $implicit: T }> | null {
    if (!this.cellDefs) return null;
    return this.cellDefs.find(def => def.key === key)?.template ?? null;
  }

  resolveValue(col: TableColumn<T>, row: T): unknown {
    if (col.value) return col.value(row);
    return (row as any)?.[col.key];
  }

  onSortChange(sort: Sort): void {
    this.sortSignal.set(sort);
    this.sortChange.emit(sort);
  }
}
