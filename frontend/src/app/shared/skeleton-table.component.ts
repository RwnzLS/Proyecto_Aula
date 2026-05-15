import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';

@Component({
  selector: 'app-skeleton-table',
  standalone: true,
  imports: [CommonModule, NgxSkeletonLoaderModule],
  template: `
    <div
      class="skeleton-table"
      role="status"
      aria-live="polite"
      aria-busy="true"
      [style.--skeleton-columns]="columns">
      <div class="skeleton-row skeleton-header">
        <ngx-skeleton-loader
          *ngFor="let _ of columnRange"
          count="1"
          appearance="line"
          [theme]="headerTheme">
        </ngx-skeleton-loader>
      </div>
      <div class="skeleton-row" *ngFor="let _ of rowRange">
        <ngx-skeleton-loader
          *ngFor="let __ of columnRange"
          count="1"
          appearance="line"
          [theme]="cellTheme">
        </ngx-skeleton-loader>
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
  `]
})
export class SkeletonTableComponent {
  @Input() rows: number = 5;
  @Input() columns: number = 4;

  get rowRange(): number[] {
    return Array.from({ length: this.rows });
  }

  get columnRange(): number[] {
    return Array.from({ length: this.columns });
  }

  readonly headerTheme = {
    height: '14px',
    'border-radius': '6px',
    margin: '0',
    'background-color': 'var(--app-surface-muted)'
  };

  readonly cellTheme = {
    height: '18px',
    'border-radius': '6px',
    margin: '0',
    'background-color': 'var(--app-surface-soft)'
  };
}
