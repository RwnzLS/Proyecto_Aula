import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="skeleton-table"
      role="status"
      aria-live="polite"
      aria-busy="true"
      [style.--skeleton-columns]="columns">
      <div class="skeleton-row skeleton-header">
        <span
          *ngFor="let _ of columnRange; trackBy: trackByIndex"
          class="skeleton-line skeleton-line--header">
        </span>
      </div>
      <div class="skeleton-row" *ngFor="let _ of rowRange; trackBy: trackByIndex">
        <span
          *ngFor="let __ of columnRange; trackBy: trackByIndex"
          class="skeleton-line">
        </span>
      </div>
      <span class="sr-only">Cargando datos</span>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .skeleton-table {
      display: grid;
      gap: var(--app-space-3);
      padding: var(--app-space-5);
    }
    .skeleton-row {
      display: grid;
      gap: var(--app-space-3);
      grid-template-columns: repeat(var(--skeleton-columns, 4), minmax(0, 1fr));
    }
    .skeleton-line {
      display: block;
      height: 18px;
      border-radius: 6px;
      background: var(--app-surface-soft);
    }
    .skeleton-line--header {
      height: 14px;
      background: var(--app-surface-muted);
    }
  `]
})
export class SkeletonTableComponent {
  private _rows = 5;
  private _columns = 4;

  rowRange = this.range(this._rows);
  columnRange = this.range(this._columns);

  @Input() set rows(value: number) {
    this._rows = this.normalizeRangeSize(value, 5);
    this.rowRange = this.range(this._rows);
  }

  get rows(): number {
    return this._rows;
  }

  @Input() set columns(value: number) {
    this._columns = this.normalizeRangeSize(value, 4);
    this.columnRange = this.range(this._columns);
  }

  get columns(): number {
    return this._columns;
  }

  trackByIndex = (index: number): number => index;

  private range(length: number): number[] {
    return Array.from({ length }, (_, index) => index);
  }

  private normalizeRangeSize(value: number | null | undefined, fallback: number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
  }
}
