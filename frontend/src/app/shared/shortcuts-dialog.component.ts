import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { SHORTCUTS, ShortcutEntry } from './keyboard-shortcuts.service';

type Group = ShortcutEntry['group'];

@Component({
  selector: 'app-shortcuts-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatDialogModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>
      <mat-icon aria-hidden="true">keyboard</mat-icon>
      Atajos de teclado
    </h2>
    <mat-dialog-content class="shortcuts-content">
      @for (group of groupedShortcuts; track group.label) {
        <section class="shortcut-group" [attr.aria-labelledby]="'grp-' + group.label">
          <h3 [id]="'grp-' + group.label">{{ group.label }}</h3>
          <dl class="shortcut-list">
            @for (entry of group.entries; track entry.keys) {
              <div class="shortcut-row">
                <dt>
                  @for (chunk of splitKeys(entry.keys); track chunk) {
                    <kbd>{{ chunk }}</kbd>
                  }
                </dt>
                <dd>{{ entry.description }}</dd>
              </div>
            }
          </dl>
        </section>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close cdkFocusInitial>Cerrar</button>
    </mat-dialog-actions>
  `,
  styles: [`
    [mat-dialog-title] {
      display: flex;
      align-items: center;
      gap: var(--app-space-2);
    }
    .shortcuts-content {
      display: grid;
      gap: var(--app-space-5);
      min-width: 360px;
    }
    .shortcut-group h3 {
      margin: 0 0 var(--app-space-3);
      color: var(--app-muted);
      font-size: var(--app-font-12);
      letter-spacing: var(--app-tracking-wide);
      text-transform: uppercase;
    }
    .shortcut-list {
      display: grid;
      gap: var(--app-space-2);
      margin: 0;
    }
    .shortcut-row {
      display: grid;
      grid-template-columns: 120px 1fr;
      gap: var(--app-space-3);
      align-items: center;
    }
    dt {
      display: flex;
      gap: 4px;
      flex-wrap: wrap;
    }
    dd { margin: 0; color: var(--app-text); }
    kbd {
      display: inline-block;
      min-width: 22px;
      padding: 2px 8px;
      border-radius: var(--app-radius-2);
      border: 1px solid var(--app-border-strong);
      background: var(--app-surface-soft);
      color: var(--app-heading);
      font-family: var(--app-font-family);
      font-size: var(--app-font-12);
      font-weight: var(--app-weight-semibold);
      text-align: center;
      box-shadow: 0 1px 0 var(--app-border-strong);
    }
    @media (max-width: 560px) {
      .shortcut-row { grid-template-columns: 90px 1fr; }
    }
  `]
})
export class ShortcutsDialogComponent {
  readonly groupedShortcuts = this.group(SHORTCUTS);

  splitKeys(value: string): string[] {
    return value.split(' ').filter(Boolean);
  }

  private group(entries: ShortcutEntry[]): { label: Group; entries: ShortcutEntry[] }[] {
    const order: Group[] = ['Navegacion', 'Acciones', 'Dialogos'];
    return order
      .map(label => ({ label, entries: entries.filter(entry => entry.group === label) }))
      .filter(group => group.entries.length > 0);
  }
}
