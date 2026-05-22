import { DestroyRef, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent } from 'rxjs';
import { filter } from 'rxjs/operators';

export interface ShortcutEntry {
  keys: string;
  description: string;
  group: 'Navegacion' | 'Acciones' | 'Dialogos';
}

export const SHORTCUTS: ShortcutEntry[] = [
  { keys: '?', description: 'Abrir esta ayuda de atajos', group: 'Dialogos' },
  { keys: '/', description: 'Enfocar primer filtro del modulo activo', group: 'Acciones' },
  { keys: 'Esc', description: 'Cerrar dialogos abiertos', group: 'Dialogos' },
  { keys: 'g d', description: 'Ir a Dashboard', group: 'Navegacion' },
  { keys: 'g p', description: 'Ir a Productos', group: 'Navegacion' },
  { keys: 'g m', description: 'Ir a Movimientos', group: 'Navegacion' },
  { keys: 'g s', description: 'Ir a Proveedores', group: 'Navegacion' },
  { keys: 'g r', description: 'Ir a Precios', group: 'Navegacion' },
  { keys: 'g o', description: 'Ir a Ordenes', group: 'Navegacion' },
  { keys: 'g u', description: 'Ir a Usuarios', group: 'Navegacion' }
];

type Handler = () => void;

const SEQUENCE_TIMEOUT_MS = 1200;

@Injectable({ providedIn: 'root' })
export class KeyboardShortcutsService {
  private readonly destroyRef = inject(DestroyRef);
  private readonly listeners = new Map<string, Handler>();
  private pendingPrefix: string | null = null;
  private pendingTimer: ReturnType<typeof setTimeout> | null = null;
  private started = false;

  start(): void {
    if (this.started || typeof window === 'undefined') return;
    this.started = true;

    fromEvent<KeyboardEvent>(window, 'keydown')
      .pipe(
        filter(event => event.key === 'Escape' || !this.shouldIgnore(event)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(event => this.handle(event));
  }

  register(key: string, handler: Handler): void {
    this.listeners.set(this.normalize(key), handler);
  }

  unregister(key: string): void {
    this.listeners.delete(this.normalize(key));
  }

  private normalize(key: string): string {
    const normalized = key.trim().toLowerCase();
    return normalized === 'escape' ? 'esc' : normalized;
  }

  private shouldIgnore(event: KeyboardEvent): boolean {
    if (event.ctrlKey || event.metaKey || event.altKey) return true;
    const target = event.target as HTMLElement | null;
    if (!target) return false;
    if (target.isContentEditable) return true;
    const tag = target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
    if (target.closest('.mat-mdc-dialog-container')) return true;
    return false;
  }

  private handle(event: KeyboardEvent): void {
    const key = this.normalize(event.key);

    if (key === 'esc') {
      this.clearPrefix();
      const handler = this.listeners.get('esc');
      if (handler) {
        event.preventDefault();
        handler();
      }
      return;
    }

    if (this.pendingPrefix) {
      const candidate = `${this.pendingPrefix} ${key}`;
      const handler = this.listeners.get(candidate);
      this.clearPrefix();
      if (handler) {
        event.preventDefault();
        handler();
      }
      return;
    }

    if (key === '?') {
      const handler = this.listeners.get('?');
      if (handler) {
        event.preventDefault();
        handler();
      }
      return;
    }

    if (key === '/') {
      const handler = this.listeners.get('/');
      if (handler) {
        event.preventDefault();
        handler();
      }
      return;
    }

    if (key === 'g') {
      event.preventDefault();
      this.pendingPrefix = 'g';
      this.pendingTimer = setTimeout(() => this.clearPrefix(), SEQUENCE_TIMEOUT_MS);
      return;
    }
  }

  private clearPrefix(): void {
    if (this.pendingTimer) {
      clearTimeout(this.pendingTimer);
      this.pendingTimer = null;
    }
    this.pendingPrefix = null;
  }
}
