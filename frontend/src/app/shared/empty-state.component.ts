import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="empty-state" role="status">
      <mat-icon aria-hidden="true">{{ icon }}</mat-icon>
      <h3>{{ title }}</h3>
      <p *ngIf="message">{{ message }}</p>
      <div class="empty-action">
        <ng-content select="[action]"></ng-content>
      </div>
    </div>
  `,
  styles: [`
    .empty-action {
      display: flex;
      justify-content: center;
      margin-top: var(--app-space-3);
    }
    .empty-action:empty { display: none; }
  `]
})
export class EmptyStateComponent {
  @Input() icon: string = 'inbox';
  @Input({ required: true }) title!: string;
  @Input() message?: string;
}
